import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { canonicalLoginMessage, verifySignatureHex } from "./crypto.js";

type Challenge = {
  id: string;
  challenge: string;        // base64url
  domain: string;
  createdAt: number;
  used: boolean;
};

const CHALLENGES = new Map<string, Challenge>();
const SESSIONS = new Map<string, { sub: string; createdAt: number }>();

const BASE64URL = {
  encode: (data: Uint8Array) =>
    Buffer.from(data).toString("base64url"),
};

export function issueChallenge(req: Request, res: Response) {
  const domain = (req.get("origin") ?? req.hostname ?? "localhost").replace(/^https?:\/\//, "");
  const id = nanoid();
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const challenge = BASE64URL.encode(bytes);

  const record: Challenge = { id, challenge, domain, createdAt: Date.now(), used: false };
  CHALLENGES.set(id, record);

  res.json({
    id,
    challenge,
    domain,
    uri: `nexid://login?domain=${encodeURIComponent(domain)}&challenge=${challenge}`
  });
}

export async function verifyLogin(req: Request, res: Response) {
  const { id, pubkeyHex, sigHex } = req.body ?? {};
  if (!id || !pubkeyHex || !sigHex) return res.status(400).json({ error: "Missing fields" });

  const record = CHALLENGES.get(id);
  if (!record || record.used) return res.status(400).json({ error: "Invalid challenge" });

  // Basic expiry (5 minutes)
  if (Date.now() - record.createdAt > 5 * 60_000) {
    CHALLENGES.delete(id);
    return res.status(400).json({ error: "Challenge expired" });
  }

  const msg = canonicalLoginMessage(record.domain, record.challenge);
  const ok = await verifySignatureHex(msg, sigHex, pubkeyHex);

  if (!ok) return res.status(401).json({ error: "Bad signature" });

  record.used = true;

  // Minimal session token (demo only). Swap for JWT/HttpOnly cookie in prod.
  const session = nanoid();
  SESSIONS.set(session, { sub: pubkeyHex.toLowerCase(), createdAt: Date.now() });

  res.json({ session, sub: pubkeyHex.toLowerCase() });
}

export function requireSession(req: Request, res: Response, next: Function) {
  const token = req.get("x-session") ?? req.query.session;
  if (!token || !SESSIONS.has(String(token))) return res.status(401).json({ error: "no or bad session" });
  (req as any).session = SESSIONS.get(String(token));
  next();
}
