import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const candidatosPath = path.join(
      process.cwd(),
      "public",
      "data",
      "candidatosComDados.json"
    );

    if (!fs.existsSync(candidatosPath)) {
      return NextResponse.json({ estados: [] }, { status: 200 });
    }

    const candidatosData = fs.readFileSync(candidatosPath, "utf-8");
    const candidatos = JSON.parse(candidatosData);

    // Extrair estados únicos dos dados CNPJ (nomes completos)
    const estados = new Set<string>();

    candidatos.forEach((candidato: any) => {
      if (candidato.dadosCnpj?.estado) {
        estados.add(candidato.dadosCnpj.estado);
      }
    });

    // Converter para array e ordenar alfabeticamente
    const estadosArray = Array.from(estados).sort();

    return NextResponse.json({
      estados: estadosArray,
      totalEstados: estadosArray.length,
    });
  } catch (error) {
    console.error("Erro ao obter estados:", error);
    return NextResponse.json(
      { error: "Erro ao carregar estados dos candidatos" },
      { status: 500 }
    );
  }
}
