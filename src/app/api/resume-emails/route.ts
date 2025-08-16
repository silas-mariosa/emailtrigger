import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const statusFilePath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailStatus.json"
);

export async function POST() {
  try {
    // Atualizar status para retomado (limpar informações de pausa automática)
    fs.writeFileSync(
      statusFilePath,
      JSON.stringify({
        isPaused: false,
        pauseReason: null,
        pausedAt: null,
        lastUpdated: new Date().toISOString(),
      }),
      "utf-8"
    );

    // Verificar se há emails para enviar
    const candidatosPath = path.join(
      process.cwd(),
      "public",
      "data",
      "candidatosComDados.json"
    );
    const emailLogPath = path.join(
      process.cwd(),
      "public",
      "data",
      "emailsEnviados.json"
    );

    if (fs.existsSync(candidatosPath)) {
      const candidatos = JSON.parse(fs.readFileSync(candidatosPath, "utf-8"));
      const emailLog = fs.existsSync(emailLogPath)
        ? JSON.parse(fs.readFileSync(emailLogPath, "utf-8"))
        : [];

      // Verificar se há emails únicos para enviar
      const emailsEnviadosComSucesso = new Set(
        emailLog
          .filter((log: any) => log.situacao === "Enviado com sucesso")
          .map((log: any) => log.email)
      );

      const emailsUnicos = new Set<string>();
      const candidatosUnicos: any[] = [];

      for (const candidato of candidatos) {
        const email = candidato.dadosCnpj.email;
        if (!emailsUnicos.has(email)) {
          emailsUnicos.add(email);
          candidatosUnicos.push(candidato);
        }
      }

      const emailsParaEnviar = candidatosUnicos.filter(
        (candidato) => !emailsEnviadosComSucesso.has(candidato.dadosCnpj.email)
      );

      if (emailsParaEnviar.length > 0) {
        return NextResponse.json({
          message: "Envio de e-mails retomado!",
          status: "resumed",
          emailsRestantes: emailsParaEnviar.length,
          totalUnicos: candidatosUnicos.length,
          jaEnviados: emailsEnviadosComSucesso.size,
        });
      } else {
        return NextResponse.json({
          message:
            "Envio retomado, mas todos os emails únicos já foram enviados!",
          status: "resumed_no_emails",
          totalUnicos: candidatosUnicos.length,
          jaEnviados: emailsEnviadosComSucesso.size,
        });
      }
    }

    return NextResponse.json({ message: "Envio de e-mails retomado!" });
  } catch (error) {
    console.error("Erro ao retomar o envio de e-mails:", error);
    return NextResponse.json(
      { error: "Erro ao retomar o envio de e-mails" },
      { status: 500 }
    );
  }
}
