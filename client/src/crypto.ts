// DEV ONLY: in-browser ephemeral key to "simulate" the Nexa identity app.
// Replace this with a real wallet bridge/mobile flow later.
import * as secp from "@noble/secp256k1";
// fallback
import { sha256 } from '@noble/hashes/sha256.js';



let priv: Uint8Array | null = null;
let pubHex: string | null = null;

export async function getOrCreateKey() {
  if (!priv) {
    priv = secp.utils.randomPrivateKey();
    pubHex = Buffer.from(secp.getPublicKey(priv, true)).toString("hex");
  }
  return { priv: priv!, pubHex: pubHex! };
}

export async function signMessageHex(msg: string) {
  const { priv } = await getOrCreateKey();
  const digest = sha256(new TextEncoder().encode(msg));
  const sig = await secp.sign(digest, priv, { der: false, recovered: false });
  return Buffer.from(sig).toString("hex");
}
