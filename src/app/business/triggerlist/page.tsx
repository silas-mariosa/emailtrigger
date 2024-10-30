'use client'

import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';
import { htmlTemplate } from '@/components/componentes/TemplateEmail/tampletes';
export interface Root {
    cnpj: string
    candidato: Candidato
    dadosCnpj: DadosCnpj
    to: string
    subject: string
}

export interface Candidato {
    estado: string
    municipio: string
    partido: string
    siglaPartido: string
    numero: string
    nomeCompleto: string
    nomeSocial: string
    cargo: string
    status: string
    resultado: string
    dataEleicao: string
    linkCandidatura: string
}

export interface DadosCnpj {
    email: string
    logradouro: string
    bairro: string
    cep: string
    municipio: string
    estado: string
    correspondencia: string
}

interface EmailLog {
    email: string;
    dataEnvio: string;
    situacao: string;
}

const EMAIL_BATCH_SIZE = 500;
const BATCH_DELAY = 60000;
const candidate_List: Root[] = JSON.parse(JSON.stringify(require('@/data/candidatosComDados.json')));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'contato.smartgabinete@gmail.com',
    pass: 'mjjawfmxztolfhna'
  }
});

const emailLogPath = path.join(process.cwd(), 'emailsEnviados.json');

// Função para registrar o envio do email
function logEmail(envio: EmailLog) {
  let emailLog: EmailLog[] = [];

  // Carregar logs anteriores, se existir
  if (fs.existsSync(emailLogPath)) {
    const data = fs.readFileSync(emailLogPath, 'utf-8');
    emailLog = JSON.parse(data);
  }

  // Adicionar o novo envio ao log
  emailLog.push(envio);

  // Salvar o log atualizado
  fs.writeFileSync(emailLogPath, JSON.stringify(emailLog, null, 2), 'utf-8');
}

async function sendEmail({to, subject, candidato}: Root) {
  const trackingImage = `<img src="https://yourserver.com/track?email=${encodeURIComponent(to)}" alt="" style="display:none"/>`;
  
  const personalizedHtml = htmlTemplate
    .replace('{{nomeSocial}}', candidato.nomeSocial)
    .replace('{{cargo}}', candidato.cargo)
    .replace('{{resultado}}', candidato.resultado)
    .replace('{{linkCandidatura}}', candidato.linkCandidatura)
    + trackingImage;

  const mailOptions = {
    from: 'contato.smartgabinete@gmail.com',
    to,
    subject,
    html: personalizedHtml
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email enviado para: ${to}`);
    
    // Registrar email como enviado com sucesso
    logEmail({
      email: to,
      dataEnvio: new Date().toISOString(),
      situacao: 'Enviado com sucesso'
    });
  } catch (error) {
    const err = error as Error;
    console.error(`Erro ao enviar para ${to}:`, error);

    // Registrar email como falha no envio
    logEmail({
      email: to,
      dataEnvio: new Date().toISOString(),
      situacao: `Erro: ${err.message}`
    });
  }
}

async function sendEmailsInBatches(emails: Root[]) {
  for (let i = 0; i < emails.length; i += EMAIL_BATCH_SIZE) {
    const batch = emails.slice(i, i + EMAIL_BATCH_SIZE);
    const emailPromises = batch.map(email => sendEmail(email));

    await Promise.all(emailPromises);
    console.log(`Lote de ${batch.length} e-mails enviados. Aguardando ${BATCH_DELAY / 1000} segundos...`);
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
  }
}

async function main() {
  await sendEmailsInBatches(candidate_List);
}

main().catch(console.error);
