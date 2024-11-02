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

const EMAIL_BATCH_SIZE = 50;  // Tamanho reduzido do lote
const BATCH_DELAY = 30000; // 30 segundos
const EMAIL_SEND_LIMIT = 3000; // Limite de e-mails para envio
const AUTH_ERROR_THRESHOLD = 3600000; // 1 hora em milissegundos
const PAUSE_DURATION = 86400000; // 24 horas em milissegundos

const emailLogPath = path.join(process.cwd(), 'public', 'data', 'emailsEnviados.json');

const transporter = nodemailer.createTransport({
    host: "smtp.hostinger.com",
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
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

        // Verifica se o erro é o de limite de envio
        if ((error as Error).message.includes('hostinger_out_ratelimit')) {
            console.warn('Limite de envio atingido. Aguardando 1 hora.');
            return { errorType: 'rateLimit', firstErrorTime: Date.now() }; // Retorna o timestamp do primeiro erro
        }

        // Verifica se o erro é o de muitos comandos AUTH
        if ((error as Error).message.includes('450 4.7.1 Error: too many AUTH commands')) {
            console.warn('Erro: muitos comandos AUTH. Aguardando 1 hora.');
            return { errorType: 'authError', firstErrorTime: Date.now() }; // Retorna o timestamp do primeiro erro
        }

        logEmail({
            email: dadosCnpj.email,
            dataEnvio: new Date().toISOString(),
            situacao: `Erro: ${(error as Error).message}`
        });
        throw error; // Relança o erro para tratamento adicional
    }
}

async function sendEmailsInBatches(emails: Root[]) {
    // Carrega o log de e-mails para verificar envios anteriores
    const emailLog = fs.existsSync(emailLogPath)
        ? JSON.parse(fs.readFileSync(emailLogPath, 'utf-8'))
        : [];

    // Filtra os e-mails que ainda não foram enviados com sucesso
    const emailsParaEnviar = emails.filter(
        email => email.dadosCnpj.email && // Verifica se o email não é vazio
            !emailLog.find((log: EmailLog) => log.email === email.dadosCnpj.email && log.situacao === 'Enviado com sucesso')
    );

    let emailsSentCount = 0; // Contador de e-mails enviados
    let attemptCount = 0; // Contador de tentativas
    const MAX_ATTEMPTS = 3; // Número máximo de tentativas
    let firstErrorTime: number | null = null; // Para armazenar o tempo do primeiro erro

    for (let i = 0; i < emailsParaEnviar.length; i += EMAIL_BATCH_SIZE) {
        const batch = emailsParaEnviar.slice(i, i + EMAIL_BATCH_SIZE);

        while (attemptCount < MAX_ATTEMPTS) {
            try {
                console.log(`Enviando lote de ${batch.length} e-mails (Tentativa ${attemptCount + 1}).`);
                const emailPromises = batch.map(email => sendEmail(email));

                const results = await Promise.all(emailPromises);

                // Verifica se algum email retornou um erro e obtém o timestamp do primeiro erro
                const rateLimitError = results.find(result => result && result.errorType === 'rateLimit');
                const authError = results.find(result => result && result.errorType === 'authError');

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
                attemptCount = 0; // Reseta o contador de tentativas após sucesso

                // Pausa se o limite de e-mails enviados for atingido
                if (emailsSentCount >= EMAIL_SEND_LIMIT) {
                    console.log(`Limite de ${EMAIL_SEND_LIMIT} e-mails enviados. Pausando...`);
                    await new Promise(resolve => setTimeout(resolve, 60000)); // Pausa por 1 minuto
                    emailsSentCount = 0; // Reseta o contador após a pausa
                }
                break; // Sai do loop se o lote foi enviado com sucesso
            } catch (error) {
                console.error('Erro ao enviar o lote de e-mails:', error);
                attemptCount += 1; // Incrementa o contador de tentativas

                if (attemptCount >= MAX_ATTEMPTS) {
                    console.warn('Número máximo de tentativas atingido. Pausando o envio de e-mails por 24 horas.');
                    await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION)); // Pausa por 24 horas
                }
            }

            // Delay entre as tentativas
            await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
        }

        // Se houve erro de limite ou AUTH, controla o tempo de pausa
        if (firstErrorTime) {
            const currentTime = Date.now();
            const elapsedTime = currentTime - firstErrorTime;

            // Verifica se já se passou 1 hora desde o primeiro erro
            if (elapsedTime < AUTH_ERROR_THRESHOLD) {
                const timeToWait = AUTH_ERROR_THRESHOLD - elapsedTime;
                console.warn(`Aguardando ${timeToWait / 1000} segundos antes de tentar novamente.`);
                await new Promise(resolve => setTimeout(resolve, timeToWait)); // Aguardar até 1 hora
            } else if (elapsedTime < PAUSE_DURATION) {
                const remainingTime = PAUSE_DURATION - elapsedTime;
                console.warn(`Aguardando ${remainingTime / 1000} segundos antes de tentar novamente.`);
                await new Promise(resolve => setTimeout(resolve, remainingTime)); // Aguardar o tempo restante até 24 horas
            }

            firstErrorTime = null; // Reseta o timestamp do erro
        }
    }
}

export async function POST(req: Request) {
    const data: Root[] = await req.json();
    await sendEmailsInBatches(data);
    return NextResponse.json({ status: 'success' });
}
