import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID!;

// --- Login: OTP vía Twilio Verify ------------------------------------

export async function enviarOtp(celularE164: string) {
  return client.verify.v2
    .services(verifyServiceSid)
    .verifications.create({ to: celularE164, channel: "sms" });
}

export async function verificarOtp(celularE164: string, codigo: string) {
  const resultado = await client.verify.v2
    .services(verifyServiceSid)
    .verificationChecks.create({ to: celularE164, code: codigo });
  return resultado.status === "approved";
}

// --- Notificación de solicitud de acceso -------------------------------
// NOTA (pendiente del brief): hoy usa el mismo Twilio del OTP, mandando un SMS
// normal (no Verify, porque acá no estamos verificando un código, estamos
// avisando). Si más adelante conviene separar el provider de notificaciones,
// esta es la única función a reemplazar — nada más del código llama a Twilio
// directamente para este caso.
export async function notificarSolicitudAcceso(params: {
  celularTutor: string;
  ninoNombre: string;
  quienDiceSer: string | null;
  urlDecision: string;
}) {
  const { celularTutor, ninoNombre, quienDiceSer, urlDecision } = params;
  const texto = quienDiceSer
    ? `${ninoNombre} está esperando esta llamada. Alguien que dice ser "${quienDiceSer}" pidió ver más datos. Decidí acá: ${urlDecision}`
    : `${ninoNombre} está esperando esta llamada. Alguien pidió ver más datos. Decidí acá: ${urlDecision}`;

  return client.messages.create({
    to: celularTutor,
    from: process.env.TWILIO_SMS_FROM, // número/sender de SMS normal, distinto del Verify service
    body: texto,
  });
}
