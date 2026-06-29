import { NextResponse } from "next/server";
import { deleteSite, saveSite } from "@/lib/server/sites";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await request.json();
    const site = await saveSite({ ...payload, id: params.id });
    return NextResponse.json({ site });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao atualizar site." },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteSite(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Falha ao excluir site." },
      { status: 400 }
    );
  }
}
