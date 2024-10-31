import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const statusFilePath = path.join(process.cwd(), 'src', 'data', 'emailStatus.json'); // Path to the file to hold status

export async function POST() {
  try {
    // Update status to resumed in a JSON file or a database
    fs.writeFileSync(statusFilePath, JSON.stringify({ isPaused: false }), 'utf-8');
    return NextResponse.json({ message: 'Envio de e-mails retomado!' });
  } catch (error) {
    console.error('Erro ao retomar o envio de e-mails:', error);
    return NextResponse.json({ error: 'Erro ao retomar o envio de e-mails' }, { status: 500 });
  }
}