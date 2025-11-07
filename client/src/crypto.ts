import { sha256 } from "@noble/hashes/sha256";
import { secp256k1 } from "@noble/secp256k1";

// example helpers:
export function hash(data: Uint8Array) {
  return sha256(data);
}

export async function sign(msgHash: Uint8Array, privKey: Uint8Array) {
  return await secp256k1.signAsync(msgHash, privKey, { recovered: false, der: true });
}

export async function verify(sig: Uint8Array, msgHash: Uint8Array, pubKey: Uint8Array) {
  return await secp256k1.verifyAsync(sig, msgHash, pubKey);
}
