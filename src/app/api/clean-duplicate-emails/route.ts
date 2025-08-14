import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const emailLogPath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailsEnviados.json"
);

interface EmailLog {
  email: string;
  dataEnvio: string;
  situacao: string;
  bounce?: boolean;
  optOut?: boolean;
}

export async function POST() {
  try {
    if (!fs.existsSync(emailLogPath)) {
      return NextResponse.json({
        message: "Arquivo de log não encontrado",
        status: "not_found",
      });
    }

    const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    const totalOriginal = emailLog.length;

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

    const duplicatasRemovidas = totalOriginal - logLimpo.length;

    return NextResponse.json({
      message: "Log de emails limpo com sucesso",
      status: "success",
      totalOriginal,
      totalUnicos: logLimpo.length,
      duplicatasRemovidas,
    });
  } catch (error) {
    console.error("Erro ao limpar log de emails:", error);
    return NextResponse.json(
      { error: "Erro ao limpar log de emails" },
      { status: 500 }
    );
  }
}
