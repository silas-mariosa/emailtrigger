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
  bounce?: boolean;
  optOut?: boolean;
}

// Configurações anti-spam melhoradas
const EMAIL_BATCH_SIZE = 5; // Reduzido para evitar spam
const BATCH_DELAY = 60000; // 1 minuto entre lotes
const DAILY_LIMIT = 100; // Limite diário de envios
const WARM_UP_DAYS = 7; // Período de warm-up

const emailLogPath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailsEnviados.json"
);
const bounceListPath = path.join(
  process.cwd(),
  "public",
  "data",
  "bounceList.json"
);
const optOutListPath = path.join(
  process.cwd(),
  "public",
  "data",
  "optOutList.json"
);

// Configuração SMTP melhorada com autenticação adequada
const transporter = nodemailer.createTransport({
  host: "smtp.hostinger.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
  pool: true,
  maxConnections: 3, // Reduzido para evitar sobrecarga
  maxMessages: 20, // Reduzido para melhor controle
  rateLimit: 5, // Máximo 5 e-mails por segundo
  rateDelta: 1000, // 1 segundo entre envios
  // Headers anti-spam
  headers: {
    "List-Unsubscribe": "<mailto:unsubscribe@smartgabinete.com.br>",
    "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    Precedence: "bulk",
    "X-Auto-Response-Suppress": "OOF, AutoReply",
  },
});

// Função para verificar se o e-mail está na lista de bounce
function isBouncedEmail(email: string): boolean {
  if (!fs.existsSync(bounceListPath)) return false;
  const bounceList = JSON.parse(fs.readFileSync(bounceListPath, "utf-8"));
  return bounceList.includes(email);
}

// Função para verificar se o e-mail optou por sair
function isOptedOut(email: string): boolean {
  if (!fs.existsSync(optOutListPath)) return false;
  const optOutList = JSON.parse(fs.readFileSync(optOutListPath, "utf-8"));
  return optOutList.includes(email);
}

// Função para verificar limite diário
function checkDailyLimit(): boolean {
  const today = new Date().toDateString();
  let emailLog: EmailLog[] = [];

  if (fs.existsSync(emailLogPath)) {
    emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
  }

  const todayEmails = emailLog.filter(
    (log) =>
      new Date(log.dataEnvio).toDateString() === today &&
      log.situacao === "Enviado com sucesso"
  );

  return todayEmails.length < DAILY_LIMIT;
}

// Função para validar e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return (
    emailRegex.test(email) &&
    !email.includes("noreply") &&
    !email.includes("no-reply") &&
    !email.includes("test") &&
    !email.includes("example")
  );
}

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
    existingEntry.bounce = envio.bounce;
    existingEntry.optOut = envio.optOut;
  } else {
    emailLog.push(envio);
  }

  fs.writeFileSync(emailLogPath, JSON.stringify(emailLog, null, 2), "utf-8");
  console.log(`Log de email registrado: ${JSON.stringify(envio)}`);
}

async function sendEmail({ cnpj, dadosCnpj }: Root) {
  // Validações anti-spam
  if (!dadosCnpj.email || !dadosCnpj.email.trim()) {
    console.warn(
      `Email inválido para o destinatário: ${JSON.stringify(dadosCnpj)}`
    );
    logEmail({
      email: dadosCnpj.email || "Email não fornecido",
      dataEnvio: new Date().toISOString(),
      situacao: "Erro: Email inválido ou não definido",
    });
    return;
  }

  const email = dadosCnpj.email.trim().toLowerCase();

  // Verificações de proteção
  if (!isValidEmail(email)) {
    console.warn(`Email inválido: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Erro: Email inválido",
    });
    return;
  }

  if (isBouncedEmail(email)) {
    console.warn(`Email com bounce: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Pulado: Email com bounce",
      bounce: true,
    });
    return;
  }

  if (isOptedOut(email)) {
    console.warn(`Email opt-out: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Pulado: Opt-out",
      optOut: true,
    });
    return;
  }

  if (!checkDailyLimit()) {
    console.warn(`Limite diário atingido`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Pulado: Limite diário atingido",
    });
    return;
  }

  try {
    console.log(`Enviando e-mail para: ${email}`);

    // Template com link de opt-out
    const emailWithOptOut = htmlTemplate.replace(
      "<!-- Footer -->",
      `
            <!-- Footer -->
            <tr>
              <td align="center" style="padding:8px 16px;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#6b7280;">
                  Para cancelar o recebimento, <a href="https://smartgabinete.com.br/unsubscribe?email=${encodeURIComponent(
                    email
                  )}" style="color:#1f3b77;">clique aqui</a>
                </p>
              </td>
            </tr>
            `
    );

    const mailOptions = {
      from: {
        name: "Smart Gabinete",
        address: "contato@smartgabinete.com.br",
      },
      to: email,
      subject: "Faça um mandato com excelência",
      html: emailWithOptOut,
      // Headers adicionais anti-spam
      headers: {
        "Message-ID": `<${Date.now()}.${Math.random()}@smartgabinete.com.br>`,
        "X-Mailer": "Smart Gabinete Email System",
        "X-Priority": "3",
        "X-MSMail-Priority": "Normal",
      },
    };

    await transporter.sendMail(mailOptions);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Enviado com sucesso",
    });
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${email}:`, error);

    // Verificar se é um bounce permanente
    const errorMessage = (error as Error).message.toLowerCase();
    if (
      errorMessage.includes("permanent") ||
      errorMessage.includes("bounce") ||
      errorMessage.includes("invalid")
    ) {
      // Adicionar à lista de bounce
      let bounceList: string[] = [];
      if (fs.existsSync(bounceListPath)) {
        bounceList = JSON.parse(fs.readFileSync(bounceListPath, "utf-8"));
      }
      if (!bounceList.includes(email)) {
        bounceList.push(email);
        fs.writeFileSync(
          bounceListPath,
          JSON.stringify(bounceList, null, 2),
          "utf-8"
        );
      }
    }

    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: `Erro: ${(error as Error).message}`,
      bounce:
        errorMessage.includes("bounce") || errorMessage.includes("invalid"),
    });
    throw error;
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
      !emailLog.find(
        (log: EmailLog) =>
          log.email === email.dadosCnpj.email &&
          log.situacao === "Enviado com sucesso"
      )
  );

  console.log(`Total de e-mails para enviar: ${emailsParaEnviar.length}`);

  for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
    const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

    try {
      console.log(
        `Iniciando envio do lote ${Math.floor(i / EMAIL_BATCH_SIZE) + 1} de ${
          batch.length
        } e-mails.`
      );

      // Envio sequencial para melhor controle
      for (const email of batch) {
        await sendEmail(email);
        // Delay entre e-mails individuais
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      console.log(
        `Lote ${Math.floor(i / EMAIL_BATCH_SIZE) + 1} enviado com sucesso.`
      );
    } catch (error) {
      console.error("Erro ao enviar um lote de e-mails:", error);
    }

    // Delay entre os lotes
    if (i + EMAIL_BATCH_SIZE < emailsParaEnviar.length) {
      console.log(
        `Aguardando ${BATCH_DELAY / 1000} segundos antes do próximo lote...`
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
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
    const emails = JSON.parse(fileContent);

    await sendEmailsInBatches(emails);

    return NextResponse.json({
      message: "Processo de envio de e-mails iniciado",
      totalEmails: emails.length,
      batchSize: EMAIL_BATCH_SIZE,
      dailyLimit: DAILY_LIMIT,
    });
  } catch (error) {
    console.error("Erro ao enviar e-mails:", error);
    return NextResponse.json(
      { error: "Erro ao enviar e-mails" },
      { status: 500 }
    );
  }
}
