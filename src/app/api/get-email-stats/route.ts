import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

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

export async function GET() {
  try {
    // Verificar se os arquivos existem
    if (!fs.existsSync(candidatosPath)) {
      return NextResponse.json({
        totalUnicos: 0,
        jaEnviados: 0,
        restantes: 0,
        message: "Arquivo de candidatos não encontrado",
      });
    }

    let candidatos = [];
    let emailLog = [];

    try {
      candidatos = JSON.parse(fs.readFileSync(candidatosPath, "utf-8"));
    } catch (parseError) {
      console.error(
        "Erro ao fazer parse do arquivo de candidatos:",
        parseError
      );
      return NextResponse.json({
        totalUnicos: 0,
        jaEnviados: 0,
        restantes: 0,
        message: "Erro ao ler arquivo de candidatos",
      });
    }

    if (fs.existsSync(emailLogPath)) {
      try {
        emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
      } catch (parseError) {
        console.error(
          "Erro ao fazer parse do arquivo de log de emails:",
          parseError
        );
        emailLog = [];
      }
    }

    // Calcular emails únicos dos candidatos
    const emailsUnicos = new Set<string>();
    for (const candidato of candidatos) {
      const email = candidato.dadosCnpj.email;
      emailsUnicos.add(email);
    }

    // Calcular emails já enviados com sucesso
    const emailsEnviadosComSucesso = new Set(
      emailLog
        .filter((log: any) => log.situacao === "Enviado com sucesso")
        .map((log: any) => log.email)
    );

    const totalUnicos = emailsUnicos.size;
    const jaEnviados = emailsEnviadosComSucesso.size;
    const restantes = totalUnicos - jaEnviados;

    return NextResponse.json({
      totalUnicos,
      jaEnviados,
      restantes,
      percentualConcluido:
        totalUnicos > 0 ? Math.round((jaEnviados / totalUnicos) * 100) : 0,
    });
  } catch (error) {
    console.error("Erro ao obter estatísticas de emails:", error);
    return NextResponse.json(
      {
        error: "Erro ao obter estatísticas de emails",
        totalUnicos: 0,
        jaEnviados: 0,
        restantes: 0,
      },
      { status: 500 }
    );
  }
}
