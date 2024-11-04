import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { htmlTemplate } from "@/components/componentes/TemplateEmail/tampletes";

export interface Root {
  cnpj: string;
  candidato: Candidato;
  dadosCnpj: DadosCnpj;
}

export interface Candidato {
  estado: string;
  municipio: string;
  partido: string;
  siglaPartido: string;
  numero: string;
  nomeCompleto: string;
  nomeSocial: string;
  cargo: string;
  status: string;
  resultado: string;
  dataEleicao: string;
  linkCandidatura: string;
}

export interface DadosCnpj {
  email: string;
  logradouro: string;
  bairro: string;
  cep: string;
  municipio: string;
  estado: string;
  correspondencia: string;
}

export interface EmailLog {
  email: string;
  dataEnvio: string;
  situacao: string;
}

const EMAIL_BATCH_SIZE = 50; // Tamanho reduzido do lote
const BATCH_DELAY = 30000; // 30 segundos
const EMAIL_SEND_LIMIT = 3000; // Limite de e-mails para envio
const AUTH_ERROR_THRESHOLD = 3600000; // 1 hora em milissegundos

const emailLogPath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailsEnviados.json"
);

const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  pool: true, // Reutiliza as conexões SMTP
  maxConnections: 5, // Número máximo de conexões simultâneas
  maxMessages: 50, // Máximo de mensagens por conexão
});

// Função para registrar o envio do email
function logEmail(envio: EmailLog) {
  let emailLog: EmailLog[] = [];

  if (fs.existsSync(emailLogPath)) {
    const data = fs.readFileSync(emailLogPath, "utf-8");
    emailLog = JSON.parse(data);
  }

  // Atualizar ou adicionar o log
  const existingEntry = emailLog.find((log) => log.email === envio.email);
  if (existingEntry) {
    existingEntry.situacao = envio.situacao;
  } else {
    emailLog.push(envio);
  }

  fs.writeFileSync(emailLogPath, JSON.stringify(emailLog, null, 2), "utf-8");
  console.log(`Log de email registrado: ${JSON.stringify(envio)}`);
}

async function sendEmail({ cnpj, dadosCnpj }: Root) {
  // Verificação de email válido
  if (!dadosCnpj.email || !dadosCnpj.email.trim()) {
    console.warn(
      `Email inválido para o destinatário: ${JSON.stringify(dadosCnpj)}`
    );
    logEmail({
      email: dadosCnpj.email || "Email não fornecido",
      dataEnvio: new Date().toISOString(),
      situacao: `Erro: Email inválido ou não definido para CNPJ: ${cnpj}`,
    });
    return;
  }

  try {
    console.log(`Enviando e-mail para: ${dadosCnpj.email}`);
    const mailOptions = {
      from: "contato@smartgabinete.com.br",
      to: dadosCnpj.email,
      subject: "Faça um mandato com excelência",
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
    logEmail({
      email: dadosCnpj.email,
      dataEnvio: new Date().toISOString(),
      situacao: "Enviado com sucesso",
    });
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${dadosCnpj.email}:`, error);

    // Verifica se o erro é o de limite de envio
    if ((error as Error).message.includes("hostinger_out_ratelimit")) {
      console.warn("Limite de envio atingido. Aguardando 1 hora.");
      return { errorType: "rateLimit", firstErrorTime: Date.now() }; // Retorna o timestamp do primeiro erro
    }

    // Verifica se o erro é o de muitos comandos AUTH
    if (
      (error as Error).message.includes(
        "450 4.7.1 Error: too many AUTH commands"
      )
    ) {
      console.warn("Erro: muitos comandos AUTH. Aguardando 1 hora.");
      return { errorType: "authError", firstErrorTime: Date.now() }; // Retorna o timestamp do primeiro erro
    }

    logEmail({
      email: dadosCnpj.email,
      dataEnvio: new Date().toISOString(),
      situacao: `Erro: ${(error as Error).message}`,
    });
    throw error; // Relança o erro para tratamento adicional
  }
}

async function sendEmailsInBatches(emails: Root[]) {
  // Carrega o log de e-mails para verificar envios anteriores
  const emailLog = fs.existsSync(emailLogPath)
    ? JSON.parse(fs.readFileSync(emailLogPath, "utf-8"))
    : [];

  // Filtra os e-mails que ainda não foram enviados com sucesso
  const emailsParaEnviar = emails.filter(
    (email) =>
      email.dadosCnpj.email && // Verifica se o email não é vazio
      !emailLog.find(
        (log: EmailLog) =>
          log.email === email.dadosCnpj.email &&
          log.situacao === "Enviado com sucesso"
      )
  );

  let emailsSentCount = 0; // Contador de e-mails enviados
  let firstErrorTime: number | null = null; // Para armazenar o tempo do primeiro erro

  for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
    const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

    try {
      const emailPromises = batch.map((email) => sendEmail(email));

      const results = await Promise.all(emailPromises);

      // Verifica se algum email retornou um erro e obtém o timestamp do primeiro erro
      const rateLimitError = results.find(
        (result) => result && result.errorType === "rateLimit"
      );
      const authError = results.find(
        (result) => result && result.errorType === "authError"
      );

      if (rateLimitError) {
        firstErrorTime = rateLimitError.firstErrorTime;
        break; // Sai do loop para lidar com a pausa
      }

      if (authError) {
        firstErrorTime = authError.firstErrorTime;
        break; // Sai do loop para lidar com a pausa
      }

      emailsSentCount += batch.length; // Atualiza o contador
      console.log(`Lote de ${batch.length} e-mails enviado com sucesso.`);

      // Pausa se o limite de e-mails enviados for atingido
      if (emailsSentCount >= EMAIL_SEND_LIMIT) {
        console.log(
          `Limite de ${EMAIL_SEND_LIMIT} e-mails enviados. Pausando...`
        );
        await new Promise((resolve) => setTimeout(resolve, 60000)); // Pausa por 1 minuto
        emailsSentCount = 0; // Reseta o contador após a pausa
      }
      break; // Sai do loop se o lote foi enviado com sucesso
    } catch (error) {
      console.error("Erro ao enviar o lote de e-mails:", error);
    }

    // Delay entre as tentativas
    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
  }

  // Se houve erro de limite ou AUTH, controla o tempo de pausa
  if (firstErrorTime) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - firstErrorTime;

    // Verifica se já se passou 1 hora desde o primeiro erro
    if (elapsedTime < AUTH_ERROR_THRESHOLD) {
      const timeToWait = AUTH_ERROR_THRESHOLD - elapsedTime;
      console.warn(
        `Aguardando ${timeToWait / 1000} segundos antes de tentar novamente.`
      );
      await new Promise((resolve) => setTimeout(resolve, timeToWait)); // Aguardar até 1 hora
    } 

    firstErrorTime = null; // Reseta o timestamp do erro
  }
}

export async function POST() {
  try {
    console.log("Iniciando o processo de envio de e-mails");

    const filePath = path.join(
      process.cwd(),
      "public",
      "data",
      "candidatosComDados.json"
    );
    const fileContent = fs.readFileSync(filePath, "utf-8");
    let emails: Root[] = JSON.parse(fileContent);

    // Filtrar duplicatas com base no campo dadosCnpj.email
    const uniqueEmailsMap = new Map<string, Root>();
    emails.forEach((emailObj) => {
      if (
        emailObj.dadosCnpj.email &&
        !uniqueEmailsMap.has(emailObj.dadosCnpj.email)
      ) {
        uniqueEmailsMap.set(emailObj.dadosCnpj.email, emailObj);
      }
    });
    emails = Array.from(uniqueEmailsMap.values()); // Converter o Map de volta para uma lista sem duplicatas

    await sendEmailsInBatches(emails);

    return NextResponse.json({
      message: "Processo de envio de e-mails iniciado",
    });
  } catch (error) {
    console.error("Erro ao enviar e-mails:", error);
    return NextResponse.json(
      { error: "Erro ao enviar e-mails" },
      { status: 500 }
    );
  }
}
