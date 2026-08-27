import { customAlphabet } from "nanoid";

// Sin caracteres ambiguos (0/O, 1/I/l) porque a veces el código se dicta
// por teléfono o se transcribe a mano (pantalla "Escaneo").
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

// 10 caracteres de este alfabeto ≈ 49 bits de entropía — de sobra para no ser
// adivinable por fuerza bruta, y entra cómodo en el espacio de un NDEF URI
// record en NTAG213 (144 bytes útiles: sobra lugar para "https://dominio/r/" + token).
const generar = customAlphabet(ALPHABET, 10);

export function generarTokenRemera(): string {
  return generar();
}

// Validación básica antes de pegarle a la DB con un token con formato inválido
// (ej. alguien escribiendo el código a mano en vez de escanear).
const TOKEN_REGEX = new RegExp(`^[${ALPHABET}]{10}$`);

export function esTokenValido(token: string): boolean {
  return TOKEN_REGEX.test(token);
}
