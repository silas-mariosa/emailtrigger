import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const emailLogPath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailsEnviados.json"
);
const bounceListPath = path.join(
  process.cwd(),
  "public",
  "data",
  "bounceList.json"
);
const optOutListPath = path.join(
  process.cwd(),
  "public",
  "data",
  "optOutList.json"
);

export async function GET() {
  try {
    // Carregar dados de e-mails enviados
    let emailLog: any[] = [];
    if (fs.existsSync(emailLogPath)) {
      emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
    }

    // Carregar lista de bounce
    let bounceList: string[] = [];
    if (fs.existsSync(bounceListPath)) {
      bounceList = JSON.parse(fs.readFileSync(bounceListPath, "utf-8"));
    }

    // Carregar lista de opt-out
    let optOutList: string[] = [];
    if (fs.existsSync(optOutListPath)) {
      optOutList = JSON.parse(fs.readFileSync(optOutListPath, "utf-8"));
    }

    // Calcular estatísticas
    const totalEnviados = emailLog.filter(
      (log) => log.situacao === "Enviado com sucesso"
    ).length;
    const totalErros = emailLog.filter((log) =>
      log.situacao.includes("Erro")
    ).length;
    const totalBounces = emailLog.filter((log) => log.bounce).length;
    const totalOptOuts = emailLog.filter((log) => log.optOut).length;

    // Calcular taxa de entrega
    const taxaEntrega =
      totalEnviados > 0
        ? (((totalEnviados - totalBounces) / totalEnviados) * 100).toFixed(2)
        : "0";

    // Calcular taxa de bounce
    const taxaBounce =
      totalEnviados > 0
        ? ((totalBounces / totalEnviados) * 100).toFixed(2)
        : "0";

    // Calcular taxa de opt-out
    const taxaOptOut =
      totalEnviados > 0
        ? ((totalOptOuts / totalEnviados) * 100).toFixed(2)
        : "0";

    // E-mails enviados hoje
    const hoje = new Date().toDateString();
    const enviadosHoje = emailLog.filter(
      (log) =>
        new Date(log.dataEnvio).toDateString() === hoje &&
        log.situacao === "Enviado com sucesso"
    ).length;

    // Últimos 7 dias
    const ultimos7Dias = [];
    for (let i = 6; i >= 0; i--) {
      const data = new Date();
      data.setDate(data.getDate() - i);
      const dataStr = data.toDateString();
      const enviados = emailLog.filter(
        (log) =>
          new Date(log.dataEnvio).toDateString() === dataStr &&
          log.situacao === "Enviado com sucesso"
      ).length;
      ultimos7Dias.push({
        data: data.toISOString().split("T")[0],
        enviados,
      });
    }

    // Verificar saúde da reputação
    let saudeReputacao = "Boa";
    if (parseFloat(taxaBounce) > 5) {
      saudeReputacao = "Crítica";
    } else if (parseFloat(taxaBounce) > 2) {
      saudeReputacao = "Atenção";
    }

    return NextResponse.json({
      estatisticas: {
        totalEnviados,
        totalErros,
        totalBounces,
        totalOptOuts,
        enviadosHoje,
        taxaEntrega: `${taxaEntrega}%`,
        taxaBounce: `${taxaBounce}%`,
        taxaOptOut: `${taxaOptOut}%`,
        saudeReputacao,
      },
      ultimos7Dias,
      listas: {
        bounce: bounceList.length,
        optOut: optOutList.length,
      },
      recomendacoes: {
        acao:
          saudeReputacao === "Crítica"
            ? "Parar envios imediatamente"
            : saudeReputacao === "Atenção"
            ? "Reduzir volume de envios"
            : "Continuar monitorando",
        limiteDiario:
          saudeReputacao === "Crítica"
            ? 10
            : saudeReputacao === "Atenção"
            ? 50
            : 100,
      },
    });
  } catch (error) {
    console.error("Erro ao calcular estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao calcular estatísticas" },
      { status: 500 }
    );
  }
}
