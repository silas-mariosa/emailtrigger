import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const statusFilePath = path.join(process.cwd(), 'public', 'data', 'emailStatus.json'); // Path to the file to hold status

export async function POST() {
  try {
    // Update status to paused in a JSON file or a database
    fs.writeFileSync(statusFilePath, JSON.stringify({ isPaused: true }), 'utf-8');
    return NextResponse.json({ message: 'Envio de e-mails pausado!' });
  } catch (error) {
    console.error('Erro ao pausar o envio de e-mails:', error);
    return NextResponse.json({ error: 'Erro ao pausar o envio de e-mails' }, { status: 500 });
  }
}