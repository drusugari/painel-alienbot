import { NextResponse } from "next/server";
import { listSites, saveSite } from "@/lib/server/sites";

export async function GET() {
  try {
    const sites = await listSites();
    return NextResponse.json({ sites });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao listar sites." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const site = await saveSite(payload);
    return NextResponse.json({ site });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao salvar site." },
      { status: 400 }
    );
  }
}
