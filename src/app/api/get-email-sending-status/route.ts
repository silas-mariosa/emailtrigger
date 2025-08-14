import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const statusFilePath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailStatus.json"
);
const emailLogPath = path.join(
  process.cwd(),
  "public",
  "data",
  "emailsEnviados.json"
);

export async function GET() {
  try {
    // Verificar status de pausa
    let isPaused = false;
    if (fs.existsSync(statusFilePath)) {
      try {
        const fileContent = fs.readFileSync(statusFilePath, "utf-8");
        const statusData = JSON.parse(fileContent);
        isPaused = statusData.isPaused === true;
      } catch (parseError) {
        console.error("Erro ao fazer parse do arquivo de status:", parseError);
        // Se houver erro no parse, recriar o arquivo com valores padrão
        fs.writeFileSync(
          statusFilePath,
          JSON.stringify({ isPaused: false }, null, 2),
          "utf-8"
        );
        isPaused = false;
      }
    }

    // Verificar estatísticas de envio
    let totalSent = 0;
    let totalErrors = 0;
    let totalPaused = 0;

    if (fs.existsSync(emailLogPath)) {
      try {
        const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
        totalSent = emailLog.filter(
          (log: any) => log.situacao === "Enviado com sucesso"
        ).length;
        totalErrors = emailLog.filter((log: any) =>
          log.situacao.includes("Erro")
        ).length;
        totalPaused = emailLog.filter(
          (log: any) => log.situacao === "Envio pausado"
        ).length;
      } catch (parseError) {
        console.error(
          "Erro ao fazer parse do arquivo de log de emails:",
          parseError
        );
        // Se houver erro no parse, usar valores padrão
        totalSent = 0;
        totalErrors = 0;
        totalPaused = 0;
      }
    }

    // Verificar se há envio em andamento e status detalhado
    const agora = new Date();
    let isSending = false;
    let statusDetalhado = "parado";
    let ultimoEnvioInfo = null;
    let proximoEnvio = null;
    let tempoRestante = null;
    let tempoDesdeUltimoEnvio = null;

    if (fs.existsSync(emailLogPath)) {
      try {
        const emailLog = JSON.parse(fs.readFileSync(emailLogPath, "utf-8"));
        const enviosSucesso = emailLog.filter(
          (log: any) => log.situacao === "Enviado com sucesso"
        );

        if (enviosSucesso.length > 0) {
          // Pegar o último envio com sucesso
          const ultimoEnvio = new Date(
            enviosSucesso[enviosSucesso.length - 1].dataEnvio
          );

          ultimoEnvioInfo = {
            timestamp: ultimoEnvio.toISOString(),
            dataFormatada: ultimoEnvio.toLocaleString("pt-BR"),
            email: enviosSucesso[enviosSucesso.length - 1].email,
          };

          tempoDesdeUltimoEnvio = agora.getTime() - ultimoEnvio.getTime();

          // Cooldown de 1 minuto (60000ms) entre lotes
          const cooldownMs = 60000;
          const proximoEnvioTime = new Date(ultimoEnvio.getTime() + cooldownMs);

          if (proximoEnvioTime > agora) {
            proximoEnvio = proximoEnvioTime.toISOString();
            tempoRestante = Math.max(
              0,
              proximoEnvioTime.getTime() - agora.getTime()
            );
            statusDetalhado = "aguardando_cooldown";
          } else {
            statusDetalhado = "pronto_para_enviar";
          }

          // Verificar se está realmente enviando (último envio foi há menos de 5 minutos)
          const cincoMinutos = 5 * 60 * 1000;
          if (tempoDesdeUltimoEnvio < cincoMinutos && !isPaused) {
            isSending = true;
            statusDetalhado = "enviando";
          }
        } else {
          statusDetalhado = "nenhum_envio";
        }
      } catch (parseError) {
        console.error("Erro ao calcular próximo envio:", parseError);
        statusDetalhado = "erro_calculo";
      }
    } else {
      statusDetalhado = "sem_log";
    }

    // Se está pausado, sobrescrever status
    if (isPaused) {
      statusDetalhado = "pausado";
      isSending = false;
    }

    return NextResponse.json({
      isPaused,
      isSending,
      totalSent,
      totalErrors,
      totalPaused,
      statusDetalhado,
      ultimoEnvioInfo,
      proximoEnvio,
      tempoRestante,
      tempoDesdeUltimoEnvio,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erro ao obter status do envio:", error);
    return NextResponse.json(
      {
        error: "Erro ao obter status do envio",
        isPaused: false,
        isSending: false,
      },
      { status: 500 }
    );
  }
}
