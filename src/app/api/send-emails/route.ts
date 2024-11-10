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

const EMAIL_BATCH_SIZE = 50; // Tamanho do lote
const BATCH_DELAY = 45000; // 30 minutos (30 * 60 * 1000 ms)
const EMAIL_SEND_LIMIT = 2800; // Limite de e-mails para envio
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
  if (!dadosCnpj.email || !dadosCnpj.email.trim()) {
    console.warn(`Email inválido para o destinatário: ${JSON.stringify(dadosCnpj)}`);
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
      from: '"Smart Gabinete - Um solução completa para seu mandato parlamentar"<contato@smartgabinete.com.br>',
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

    if ((error as Error).message.includes("hostinger_out_ratelimit")) {
      return { errorType: "rateLimit", firstErrorTime: Date.now() };
    }

    if ((error as Error).message.includes("450 4.7.1 Error: too many AUTH commands")) {
      return { errorType: "authError", firstErrorTime: Date.now() };
    }

    if ((error as Error).message.includes("450 4.7.1 Error: too much mail")) {
      return { errorType: "tooMuchMail", firstErrorTime: Date.now() };
    }

    logEmail({
      email: dadosCnpj.email,
      dataEnvio: new Date().toISOString(),
      situacao: `Erro: ${(error as Error).message}`,
    });
    throw error;
  }
}

async function sendEmailsInBatches(emails: Root[]) {
  const emailLog = fs.existsSync(emailLogPath)
    ? JSON.parse(fs.readFileSync(emailLogPath, "utf-8"))
    : [];

  const emailsParaEnviar = emails.filter(
    (email) =>
      email.dadosCnpj.email &&
      !emailLog.find(
        (log: EmailLog) =>
          log.email === email.dadosCnpj.email && log.situacao === "Enviado com sucesso"
      )
  );

  let emailsSentCount = 0;
  let firstErrorTime: number | null = null;

  for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
    const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

    try {
      const emailPromises = batch.map((email) => sendEmail(email));
      const results = await Promise.all(emailPromises);

      const rateLimitError = results.find((result) => result && result.errorType === "rateLimit");
      const authError = results.find((result) => result && result.errorType === "authError");
      const tooMuchMailError = results.find((result) => result && result.errorType === "tooMuchMail");

      if (rateLimitError || authError || tooMuchMailError) {
        const errorType = rateLimitError
          ? "Rate limit"
          : authError
          ? "Auth error"
          : "Too much mail";
      
        firstErrorTime = rateLimitError
          ? rateLimitError.firstErrorTime
          : authError
          ? authError.firstErrorTime
          : tooMuchMailError?.firstErrorTime ?? null;
      
        console.log(`Pause no envio: ${errorType}`);
        console.warn(
          `Aguardando ${AUTH_ERROR_THRESHOLD / 1000} segundos antes de tentar novamente.`
        );
      
        let timeLeft = AUTH_ERROR_THRESHOLD; // tempo restante em milissegundos
      
        // Mostrador de tempo restante a cada 10 minutos
        const interval = setInterval(() => {
          timeLeft -= 600000; // subtrai 10 minutos (600.000 ms)
          if (timeLeft > 0) {
            console.log(
              `Tempo restante até a próxima tentativa: ${(timeLeft / 60000).toFixed(
                2
              )} minutos`
            );
          } else {
            clearInterval(interval); // encerra o intervalo quando o tempo expira
          }
        }, 600000); // intervalo de 10 minutos (600.000 ms)
      
        await new Promise((resolve) => setTimeout(resolve, AUTH_ERROR_THRESHOLD));
      
        clearInterval(interval); // limpa o intervalo ao final do tempo de espera
      }
      

      emailsSentCount += batch.length;
      console.log(`Lote de ${batch.length} e-mails enviado com sucesso.`);
      console.log(`Total de e-mails enviados: ${emailsSentCount}`);

      if (emailsSentCount >= EMAIL_SEND_LIMIT) {
        console.log(`Limite de ${EMAIL_SEND_LIMIT} e-mails enviados. Pausando...`);
        await new Promise((resolve) => setTimeout(resolve, 60000));
        emailsSentCount = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    } catch (error) {
      console.error("Erro ao enviar o lote de e-mails:", error);
    }
  }

  if (firstErrorTime) {
    const currentTime = Date.now();
    const elapsedTime = currentTime - firstErrorTime;

    if (elapsedTime < AUTH_ERROR_THRESHOLD) {
      const timeToWait = AUTH_ERROR_THRESHOLD - elapsedTime;
      console.warn(`Aguardando ${timeToWait / 1000} segundos antes de tentar novamente.`);
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }

    firstErrorTime = null;
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
