import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const optOutListPath = path.join(
  process.cwd(),
  "public",
  "data",
  "optOutList.json"
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json(
      { error: "E-mail não especificado" },
      { status: 400 }
    );
  }

  try {
    // Carregar lista de opt-out
    let optOutList: string[] = [];
    if (fs.existsSync(optOutListPath)) {
      optOutList = JSON.parse(fs.readFileSync(optOutListPath, "utf-8"));
    }

    // Adicionar e-mail à lista de opt-out
    if (!optOutList.includes(email)) {
      optOutList.push(email);
      fs.writeFileSync(
        optOutListPath,
        JSON.stringify(optOutList, null, 2),
        "utf-8"
      );
    }

    console.log(`E-mail ${email} adicionado à lista de opt-out`);

    return NextResponse.json({
      message: "E-mail removido da lista de envios com sucesso",
      email: email,
    });
  } catch (error) {
    console.error("Erro ao processar opt-out:", error);
    return NextResponse.json(
      { error: "Erro ao processar opt-out" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "E-mail não especificado" },
        { status: 400 }
      );
    }

    // Carregar lista de opt-out
    let optOutList: string[] = [];
    if (fs.existsSync(optOutListPath)) {
      optOutList = JSON.parse(fs.readFileSync(optOutListPath, "utf-8"));
    }

    // Adicionar e-mail à lista de opt-out
    if (!optOutList.includes(email)) {
      optOutList.push(email);
      fs.writeFileSync(
        optOutListPath,
        JSON.stringify(optOutList, null, 2),
        "utf-8"
      );
    }

    console.log(`E-mail ${email} adicionado à lista de opt-out via POST`);

    return NextResponse.json({
      message: "E-mail removido da lista de envios com sucesso",
      email: email,
    });
  } catch (error) {
    console.error("Erro ao processar opt-out:", error);
    return NextResponse.json(
      { error: "Erro ao processar opt-out" },
      { status: 500 }
    );
  }
}
