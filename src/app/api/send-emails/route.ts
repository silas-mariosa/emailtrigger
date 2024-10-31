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

const EMAIL_BATCH_SIZE = 500;
const BATCH_DELAY = 90000; // 1 minuto

const statusFilePath = path.join(process.cwd(), 'src', 'data', 'emailStatus.json');

if (!fs.existsSync(statusFilePath)) {
    fs.writeFileSync(statusFilePath, JSON.stringify({ isPaused: false }), 'utf-8');
}

const emailLogPath = path.join(process.cwd(), 'src', 'data', 'emailsEnviados.json');

const transporter = nodemailer.createTransport({
    service: 'smtp.titan.email',
    port: 465, // Porta SSL/TLS recomendada para segurança
    secure: true,
    auth: {
        user: 'contato@smartgabinete.com.br',
        pass: '@Wfbmrt8'
    }
});

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
    console.log(`Log de email registrado: ${JSON.stringify(envio)}`); // Debugging log
}

// Função para enviar email com tentativas e backoff exponencial
async function sendEmailWithRetry({ dadosCnpj }: Root, retries = 3) {
    for (let attempt = 0; attempt < retries; attempt++) {
        try {
            console.log(`Enviando e-mail para: ${dadosCnpj.email} (Tentativa ${attempt + 1})`);
            // Configuração do e-mail
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
            return; // Envio bem-sucedido, sai da função
        } catch (error) {
            console.error(`Erro ao enviar e-mail para ${dadosCnpj.email}:`, error);
            logEmail({
                email: dadosCnpj.email,
                dataEnvio: new Date().toISOString(),
                situacao: `Erro: ${(error as Error).message}`
            });
            if (attempt < retries - 1) {
                const delay = Math.pow(2, attempt) * 1000; // Backoff exponencial
                console.log(`Tentando novamente em ${delay / 1000} segundos...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw error; // Após todas as tentativas, propaga o erro
            }
        }
    }
}

async function sendEmailsInBatches(emails: Root[]) {
    for (let i = 0; i < emails.length; i += EMAIL_BATCH_SIZE) {
        // Check if paused
        const status = JSON.parse(fs.readFileSync(statusFilePath, 'utf-8'));
        if (status.isPaused) {
            console.log('Envio de e-mails pausado no sendEmailsInBatches.');
            break; // Exit the loop if paused
        }

        const batch = emails.slice(i, i + EMAIL_BATCH_SIZE);
        try {
            console.log(`Iniciando envio do lote de ${batch.length} e-mails.`);
            const emailPromises = batch.map(email => sendEmailWithRetry(email)); // Alterado para usar sendEmailWithRetry
            await Promise.all(emailPromises);
            console.log(`Lote de ${batch.length} e-mails enviado com sucesso.`);
        } catch (error) {
            console.error('Erro ao enviar um lote de e-mails:', error);
            throw error; // Propagate the error for the API to capture it
        }
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
}

export async function POST() {
    try {
        console.log('Iniciando o processo de envio de e-mails');
        
        // Defina o caminho do JSON
        const filePath = path.join(process.cwd(), 'src', 'data', 'candidatosComDados1.json');
        console.log('filePath verificado');
        
        // Leia o conteúdo do arquivo JSON
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        console.log('fileContent verificado');
        const emails = JSON.parse(fileContent);
        console.log('emails verificado');

        // Passe a lista de emails como argumento
        await sendEmailsInBatches(emails);
        
        return NextResponse.json({ message: 'Processo de envio de e-mails iniciado' });
    } catch (error) {
        console.error('Erro ao enviar e-mails:', error); // Log detalhado do erro
        return NextResponse.json({ error: 'Erro ao enviar e-mails' }, { status: 500 });
    }
}
