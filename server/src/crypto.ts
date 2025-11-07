import { sha256 } from "@noble/hashes/sha256";
import * as secp from "@noble/secp256k1";

export function canonicalLoginMessage(domain: string, challenge: string) {
  // NEXID signs (domain + operation + challenge). We’ll use a simple canonical form:
  // "nexid://login?domain=<domain>&challenge=<base64url>"
  // (We can adapt to the exact URI sorting rules later.)
  return `nexid://login?domain=${domain}&challenge=${challenge}`;
}

export async function verifySignatureHex(
  msg: string,
  sigHex: string,
  pubkeyHex: string
) {
  const digest = sha256(new TextEncoder().encode(msg));
  // secp256k1 verify expects a 32-byte hash and a 33/65-byte public key in hex.
  return secp.verify(sigHex, digest, pubkeyHex, { strict: true });
}
