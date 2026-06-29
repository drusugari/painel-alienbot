import { NextResponse } from "next/server";
import { deleteDomain } from "@/lib/server/domains";

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteDomain(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao excluir domínio." },
      { status: 400 }
    );
  }
}
