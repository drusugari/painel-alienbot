import { NextResponse } from "next/server";
import { duplicateSite } from "@/lib/server/sites";

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const site = await duplicateSite(params.id);
    return NextResponse.json({ site });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao duplicar site." },
      { status: 400 }
    );
  }
}
