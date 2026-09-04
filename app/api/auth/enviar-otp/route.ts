import { NextResponse } from "next/server";
import { enviarOtp } from "@/lib/twilio";

export async function POST(request: Request) {
  const { celular } = await request.json();

  if (!celular || typeof celular !== "string") {
    return NextResponse.json({ error: "Falta el celular" }, { status: 400 });
  }

  try {
    await enviarOtp(celular);
    return NextResponse.json({ ok: true });
  } catch {
    // No exponer el error real de Twilio al cliente (puede filtrar si un
    // número está mal formado, rate limits, etc.)
    return NextResponse.json(
      { error: "No pudimos enviar el código. Probá de nuevo en un minuto." },
      { status: 500 }
    );
  }
}
