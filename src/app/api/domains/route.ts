import { NextResponse } from "next/server";
import { listReadyDomains, saveDomain } from "@/lib/server/domains";

export async function GET() {
  try {
    const domains = await listReadyDomains();
    return NextResponse.json({ domains });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar domínios." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const domain = await saveDomain({
      ...payload,
      status: payload.status || "ready",
      active: payload.active ?? true
    });
    return NextResponse.json({ domain });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar domínio." },
      { status: 400 }
    );
  }
}
