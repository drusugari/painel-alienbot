import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: { cnpj: string } }
) {
  const cnpj = params.cnpj.replace(/\D/g, "");

  if (cnpj.length !== 14) {
    return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
      next: { revalidate: 60 * 60 * 24 }
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "CNPJ não encontrado ou BrasilAPI indisponível." },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Não foi possível consultar a BrasilAPI agora." },
      { status: 502 }
    );
  }
}
