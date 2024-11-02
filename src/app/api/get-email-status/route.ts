import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { EmailLog } from '../send-emails/route';

export async function GET() {
  try {
    // Check if the directory exists, if not, create it
    const emailLogDir = path.join(process.cwd(), 'public', 'data');
    if (!fs.existsSync(emailLogDir)) {
      fs.mkdirSync(emailLogDir, { recursive: true }); // Create the directory recursively
    }
    const emailLogPath = path.join(process.cwd(), 'public', 'data', 'emailsEnviados.json');
    // Check if the email log file exists
    if (!fs.existsSync(emailLogPath)) {
      // Create the file with an empty array as the initial content
      fs.writeFileSync(emailLogPath, JSON.stringify([]), 'utf-8');
      return NextResponse.json({ message: 'No logs found. A new log file has been created.' }, { status: 404 });
    }
    
    // Read the email log file
    const data = fs.readFileSync(emailLogPath, 'utf-8');
    const emailLogs: EmailLog[] = JSON.parse(data);
    
    return NextResponse.json(emailLogs);
  } catch (error) {
    console.error('Error fetching email status:', error);
    return NextResponse.json({ error: 'Error fetching email status' }, { status: 500 });
  }
}
