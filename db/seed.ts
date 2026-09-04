/**
 * Carga datos de prueba para poder probar /r/{token} sin tener que esperar
 * a que la pantalla de registro (todavía placeholder) esté lista.
 *
 * Uso: npx tsx db/seed.ts
 * (o agregar "seed": "tsx db/seed.ts" a package.json y correr `npm run seed`)
 */
import { db } from "./index";
import { tutores, ninos, remeras, remeraNino, contactos } from "./schema";

const TOKEN_DE_PRUEBA = "TESTABCD92"; // 10 chars, mismo alfabeto de lib/tokens.ts

async function main() {
  console.log("Sembrando datos de prueba...");

  const [tutor] = await db
    .insert(tutores)
    .values({
      celular: "+5491100000000", // reemplazar por tu celular real para probar el login
      nombre: "Tutor de prueba",
    })
    .returning();

  const [nino] = await db
    .insert(ninos)
    .values({
      tutorId: tutor.id,
      nombre: "Sofía",
      fechaNacimiento: "2019-03-15",
      alergiasNotas: "Alergia al maní",
      grupoSanguineo: "O+",
      obraSocial: "OSDE",
    })
    .returning();

  const [remera] = await db
    .insert(remeras)
    .values({
      token: TOKEN_DE_PRUEBA,
      talle: "6",
      lote: "piloto-001",
      estado: "activa",
    })
    .returning();

  await db.insert(remeraNino).values({
    remeraId: remera.id,
    ninoId: nino.id,
  });

  await db.insert(contactos).values([
    {
      ninoId: nino.id,
      nombre: "Mamá",
      celular: "+5491100000000",
      relacion: "mama",
      esPrincipal: true,
    },
    {
      ninoId: nino.id,
      nombre: "Papá",
      celular: "+5491100000001",
      relacion: "papa",
      esPrincipal: false,
    },
  ]);

  console.log("Listo. Probá:");
  console.log(`  - Card pública: http://localhost:3000/r/${TOKEN_DE_PRUEBA}`);
  console.log(`  - Desde la landing: pegá el código ${TOKEN_DE_PRUEBA}`);
  console.log(
    `  - Login del tutor: /cuenta con el celular +5491100000000 (necesita Twilio real configurado)`
  );
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
