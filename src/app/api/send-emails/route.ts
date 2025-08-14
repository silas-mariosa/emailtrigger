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
const statusFilePath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailStatus.json"
);

// Função para verificar se o envio está pausado
function isEmailSendingPaused(): boolean {
  try {
    if (!fs.existsSync(statusFilePath)) {
      return false;
    }
    const statusData = JSON.parse(fs.readFileSync(statusFilePath, "utf-8"));
    return statusData.isPaused === true;
  } catch (error) {
    console.error("Erro ao verificar status de pausa:", error);
    return false;
  }
}

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
  try {
    if (!fs.existsSync(emailLogPath)) return true;

    const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    const today = new Date().toISOString().split("T")[0];

    const todayEmails = emailLog.filter((log: EmailLog) =>
      log.dataEnvio.startsWith(today)
    );

    return todayEmails.length < DAILY_LIMIT;
  } catch (error) {
    console.error("Erro ao verificar limite diário:", error);
    return true;
  }
}

// Função para verificar se há cooldown ativo
function checkCooldown(): { hasCooldown: boolean; timeRemaining: number } {
  try {
    if (!fs.existsSync(emailLogPath)) {
      return { hasCooldown: false, timeRemaining: 0 };
    }

    const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    const enviosSucesso = emailLog.filter(
      (log: EmailLog) => log.situacao === "Enviado com sucesso"
    );

    if (enviosSucesso.length === 0) {
      return { hasCooldown: false, timeRemaining: 0 };
    }

    const ultimoEnvio = new Date(
      enviosSucesso[enviosSucesso.length - 1].dataEnvio
    );
    const agora = new Date();
    const tempoDecorrido = agora.getTime() - ultimoEnvio.getTime();
    const cooldownMs = BATCH_DELAY; // 1 minuto

    if (tempoDecorrido < cooldownMs) {
      const tempoRestante = cooldownMs - tempoDecorrido;
      return { hasCooldown: true, timeRemaining: tempoRestante };
    }

    return { hasCooldown: false, timeRemaining: 0 };
  } catch (error) {
    console.error("Erro ao verificar cooldown:", error);
    return { hasCooldown: false, timeRemaining: 0 };
  }
}

// Função para validar formato de e-mail
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Função para registrar log de e-mail
function logEmail(log: EmailLog) {
  try {
    let emailLog = [];
    if (fs.existsSync(emailLogPath)) {
      emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    }
    emailLog.push(log);
    fs.writeFileSync(emailLogPath, JSON.stringify(emailLog, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao registrar log de e-mail:", error);
  }
}

// Função para limpar entradas duplicadas no log de emails
function limparLogDuplicados() {
  try {
    if (!fs.existsSync(emailLogPath)) return;

    const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    const emailsUnicos = new Map<string, EmailLog>();

    // Manter apenas a entrada mais recente para cada email
    for (const log of emailLog) {
      const email = log.email;
      if (
        !emailsUnicos.has(email) ||
        new Date(log.dataEnvio) > new Date(emailsUnicos.get(email)!.dataEnvio)
      ) {
        emailsUnicos.set(email, log);
      }
    }

    const logLimpo = Array.from(emailsUnicos.values());
    fs.writeFileSync(emailLogPath, JSON.stringify(logLimpo, null, 2), "utf-8");

    console.log(
      `Log limpo: ${emailLog.length} entradas originais -> ${logLimpo.length} entradas únicas`
    );
  } catch (error) {
    console.error("Erro ao limpar log duplicados:", error);
  }
}

async function sendEmail({ cnpj, dadosCnpj }: Root) {
  const email = dadosCnpj.email;

  // Verificação adicional de duplicatas antes do envio
  if (fs.existsSync(emailLogPath)) {
    const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    const emailJaEnviado = emailLog.find(
      (log: EmailLog) =>
        log.email === email && log.situacao === "Enviado com sucesso"
    );

    if (emailJaEnviado) {
      console.log(
        `E-mail ${email} já foi enviado com sucesso anteriormente. Pulando...`
      );
      return;
    }
  }

  // Verificar se o envio está pausado
  if (isEmailSendingPaused()) {
    console.log(`Envio pausado. E-mail ${email} não será enviado.`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Envio pausado",
    });
    return;
  }

  // Validações antes do envio
  if (!isValidEmail(email)) {
    console.log(`E-mail inválido: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "E-mail inválido",
    });
    return;
  }

  if (isBouncedEmail(email)) {
    console.log(`E-mail na lista de bounce: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "E-mail na lista de bounce",
      bounce: true,
    });
    return;
  }

  if (isOptedOut(email)) {
    console.log(`E-mail optou por sair: ${email}`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "E-mail optou por sair",
      optOut: true,
    });
    return;
  }

  if (!checkDailyLimit()) {
    console.log(`Limite diário atingido. E-mail ${email} não será enviado.`);
    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Limite diário atingido",
    });
    return;
  }

  try {
    // Injetar link de opt-out no template
    const unsubscribeLink = `${
      process.env.NEXT_PUBLIC_DOMAIN || "http://localhost:3000"
    }/api/unsubscribe?email=${encodeURIComponent(email)}`;
    const htmlWithUnsubscribe = htmlTemplate.replace(
      "<!-- UNSUBSCRIBE_LINK_PLACEHOLDER -->",
      `<p style="text-align: center; margin-top: 20px; font-size: 12px; color: #666;">
        <a href="${unsubscribeLink}" style="color: #666; text-decoration: underline;">
          Cancelar inscrição
        </a>
      </p>`
    );

    const mailOptions = {
      from: `"Smart Gabinete" <${process.env.EMAIL}>`,
      to: email,
      subject: "Gerencie seu gabinete de forma inteligente",
      html: htmlWithUnsubscribe,
      text: "Gerencie seu gabinete de forma inteligente e economize 15h/semana. Teste grátis por 7 dias.",
    };

    console.log(`Enviando e-mail para: ${email}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`E-mail enviado com sucesso para: ${email}`);

    logEmail({
      email: email,
      dataEnvio: new Date().toISOString(),
      situacao: "Enviado com sucesso",
    });

    return info;
  } catch (error) {
    console.error(`Erro ao enviar e-mail para ${email}:`, error);

    const errorMessage = (error as Error).message.toLowerCase();

    // Adicionar à lista de bounce se for um erro permanente
    if (errorMessage.includes("bounce") || errorMessage.includes("invalid")) {
      let bounceList = [];
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

  // Criar um Set para emails já enviados com sucesso (mais eficiente)
  const emailsEnviadosComSucesso = new Set(
    emailLog
      .filter((log: EmailLog) => log.situacao === "Enviado com sucesso")
      .map((log: EmailLog) => log.email)
  );

  // Criar um Set para emails únicos dos candidatos
  const emailsUnicos = new Set<string>();
  const candidatosUnicos: Root[] = [];

  // Filtrar candidatos únicos por email
  for (const candidato of emails) {
    const email = candidato.dadosCnpj.email;
    if (!emailsUnicos.has(email)) {
      emailsUnicos.add(email);
      candidatosUnicos.push(candidato);
    }
  }

  console.log(`📊 [ENVIO] Total de candidatos no arquivo: ${emails.length}`);
  console.log(`📊 [ENVIO] Total de emails únicos: ${candidatosUnicos.length}`);
  console.log(
    `📊 [ENVIO] Emails já enviados com sucesso: ${emailsEnviadosComSucesso.size}`
  );

  // Filtra os e-mails que ainda não foram enviados com sucesso
  const emailsParaEnviar = candidatosUnicos.filter(
    (candidato) => !emailsEnviadosComSucesso.has(candidato.dadosCnpj.email)
  );

  console.log(
    `📤 [ENVIO] Total de e-mails para enviar: ${emailsParaEnviar.length}`
  );

  if (emailsParaEnviar.length === 0) {
    console.log(
      "✅ [ENVIO] Todos os emails únicos já foram enviados com sucesso!"
    );
    return;
  }

  for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
    // Verificar se o envio foi pausado antes de cada lote
    if (isEmailSendingPaused()) {
      console.log("Envio pausado. Aguardando retomada...");
      break;
    }

    const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

    try {
      const numeroLote = Math.floor(i / EMAIL_BATCH_SIZE) + 1;
      console.log(
        `📦 [LOTE ${numeroLote}] Iniciando envio do lote ${numeroLote} de ${batch.length} e-mails.`
      );

      // Envio sequencial para melhor controle
      for (let j = 0; j < batch.length; j++) {
        const email = batch[j];
        // Verificar se o envio foi pausado antes de cada e-mail
        if (isEmailSendingPaused()) {
          console.log("⏸️ [LOTE] Envio pausado. Aguardando retomada...");
          break;
        }

        console.log(
          `📧 [LOTE ${numeroLote}] Enviando email ${j + 1}/${batch.length}: ${
            email.dadosCnpj.email
          }`
        );
        await sendEmail(email);
        console.log(
          `✅ [LOTE ${numeroLote}] Email ${j + 1}/${
            batch.length
          } enviado com sucesso`
        );

        // Delay entre e-mails individuais
        if (j < batch.length - 1) {
          console.log(
            `⏳ [LOTE ${numeroLote}] Aguardando 2 segundos antes do próximo email...`
          );
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      console.log(
        `✅ [LOTE ${numeroLote}] Lote ${numeroLote} enviado com sucesso.`
      );
    } catch (error) {
      console.error("Erro ao enviar um lote de e-mails:", error);
    }

    // Delay entre os lotes
    if (i + EMAIL_BATCH_SIZE < emailsParaEnviar.length) {
      const proximoLote =
        Math.floor((i + EMAIL_BATCH_SIZE) / EMAIL_BATCH_SIZE) + 1;
      console.log(
        `⏰ [COOLDOWN] Aguardando ${
          BATCH_DELAY / 1000
        } segundos antes do próximo lote (${proximoLote})...`
      );
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
      console.log(
        `🚀 [COOLDOWN] Cooldown finalizado. Iniciando próximo lote...`
      );
    }
  }
}

export async function POST() {
  try {
    console.log("🚀 [ENVIO] Iniciando o processo de envio de e-mails");
    console.log("📅 [ENVIO] Data/Hora:", new Date().toLocaleString("pt-BR"));

    // Limpar entradas duplicadas no log antes de iniciar
    console.log("🧹 [ENVIO] Limpando entradas duplicadas no log...");
    limparLogDuplicados();

    // Verificar se o envio está pausado antes de iniciar
    if (isEmailSendingPaused()) {
      return NextResponse.json({
        message: "Envio de e-mails está pausado",
        status: "paused",
      });
    }

    // Verificar se há cooldown ativo
    const cooldownCheck = checkCooldown();
    if (cooldownCheck.hasCooldown) {
      const tempoRestanteSegundos = Math.ceil(
        cooldownCheck.timeRemaining / 1000
      );
      const minutos = Math.floor(tempoRestanteSegundos / 60);
      const segundos = tempoRestanteSegundos % 60;

      return NextResponse.json({
        message: `Aguarde o cooldown terminar. Tempo restante: ${minutos}:${segundos
          .toString()
          .padStart(2, "0")}`,
        status: "cooldown",
        timeRemaining: cooldownCheck.timeRemaining,
        timeRemainingFormatted: `${minutos}:${segundos
          .toString()
          .padStart(2, "0")}`,
      });
    }

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
