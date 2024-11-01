import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { htmlTemplate } from '@/components/componentes/TemplateEmail/tampletes';

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

const EMAIL_BATCH_SIZE = 10;  // Reduzido o lote
const BATCH_DELAY = 30000; // 30 segundos

const emailLogPath = path.join(process.cwd(), 'src', 'data', 'emailsEnviados.json');

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
      user: "contato@smartgabinete.com.br",
      pass: "@Wfbmprt8",
    },
    pool: true,  // Reutiliza as conexões SMTP
    maxConnections: 5, // Número máximo de conexões simultâneas
    maxMessages: 50,   // Máximo de mensagens por conexão
});

// Função para registrar o envio do email
function logEmail(envio: EmailLog) {
    let emailLog: EmailLog[] = [];

    if (fs.existsSync(emailLogPath)) {
        const data = fs.readFileSync(emailLogPath, 'utf-8');
        emailLog = JSON.parse(data);
    }

    // Atualizar ou adicionar o log
    const existingEntry = emailLog.find(log => log.email === envio.email);
    if (existingEntry) {
        existingEntry.situacao = envio.situacao;
    } else {
        emailLog.push(envio);
    }

    fs.writeFileSync(emailLogPath, JSON.stringify(emailLog, null, 2), 'utf-8');
    console.log(`Log de email registrado: ${JSON.stringify(envio)}`);
}

async function sendEmail({ cnpj, dadosCnpj }: Root) {
    // Verificação de email válido
    if (!dadosCnpj.email || !dadosCnpj.email.trim()) {
        console.warn(`Email inválido para o destinatário: ${JSON.stringify(dadosCnpj)}`);
        logEmail({
            email: dadosCnpj.email || 'Email não fornecido',
            dataEnvio: new Date().toISOString(),
            situacao: `Erro: Email inválido ou não definido para CNPJ: ${cnpj}`
        });
        return;
    }

    try {
        console.log(`Enviando e-mail para: ${dadosCnpj.email}`);
        const mailOptions = {
            from: 'contato@smartgabinete.com.br',
            to: dadosCnpj.email,
            subject: 'Faça um mandato com excelência',
            html: htmlTemplate
        };

        await transporter.sendMail(mailOptions);
        logEmail({
            email: dadosCnpj.email,
            dataEnvio: new Date().toISOString(),
            situacao: 'Enviado com sucesso'
        });
    } catch (error) {
        console.error(`Erro ao enviar e-mail para ${dadosCnpj.email}:`, error);
        logEmail({
            email: dadosCnpj.email,
            dataEnvio: new Date().toISOString(),
            situacao: `Erro: ${(error as Error).message}`
        });
        throw error;
    }
}



async function sendEmailsInBatches(emails: Root[]) {
    // Carrega o log de e-mails para verificar envios anteriores
    const emailLog = fs.existsSync(emailLogPath)
        ? JSON.parse(fs.readFileSync(emailLogPath, 'utf-8'))
        : [];

    // Filtra os e-mails que ainda não foram enviados com sucesso
    const emailsParaEnviar = emails.filter(
        email => !emailLog.find((log: EmailLog) => log.email === email.dadosCnpj.email && log.situacao === 'Enviado com sucesso')
    );

    for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
        const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

        try {
            console.log(`Iniciando envio do lote de ${batch.length} e-mails.`);
            const emailPromises = batch.map(email => sendEmail(email));

            await Promise.all(emailPromises);
            console.log(`Lote de ${batch.length} e-mails enviado com sucesso.`);
        } catch (error) {
            console.error('Erro ao enviar um lote de e-mails:', error);
        }

        // Delay entre os lotes
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
}

export async function POST() {
    try {
        console.log('Iniciando o processo de envio de e-mails');
        
        const filePath = path.join(process.cwd(), 'src', 'data', 'candidatosComDados.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const emails = JSON.parse(fileContent);

        await sendEmailsInBatches(emails);

        return NextResponse.json({ message: 'Processo de envio de e-mails iniciado' });
    } catch (error) {
        console.error('Erro ao enviar e-mails:', error);
        return NextResponse.json({ error: 'Erro ao enviar e-mails' }, { status: 500 });
    }
}
