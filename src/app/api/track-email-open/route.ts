import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { EmailLog } from '../send-emails/route';

const dataFilePath = path.join(process.cwd(), 'public',  'emailsEnviados.json');

async function loadEmailsData() {
  const data = fs.existsSync(dataFilePath)
    ? JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'))
    : [];
  return data;
}

async function saveEmailsData(emailsData: EmailLog) {
  fs.writeFileSync(dataFilePath, JSON.stringify(emailsData, null, 2), 'utf-8');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'E-mail não especificado' }, { status: 400 });
  }

  const emailsData = await loadEmailsData();
  const emailEntry = emailsData.find((e: EmailLog) => e.email === email);

  if (emailEntry && emailEntry.status !== 'Visualizado') {
    emailEntry.status = 'Visualizado';
    emailEntry.data_visualizacao = new Date().toISOString();
    await saveEmailsData(emailsData);
  }

  return NextResponse.json({ message: 'Abertura de e-mail registrada' });
}
