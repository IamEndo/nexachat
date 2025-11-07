import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getOrCreateKey, signMessageHex } from "./crypto";

const SERVER = import.meta.env.VITE_SERVER ?? "http://localhost:5174";

export default function Login({ onAuthed }: { onAuthed: (session: string, sub: string) => void }) {
  const [challenge, setChallenge] = useState<any>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  useEffect(() => {
    fetch(`${SERVER}/auth/challenge`)
      .then(r => r.json())
      .then(async (c) => {
        setChallenge(c);
        setQrDataUrl(await QRCode.toDataURL(c.uri));
      });
  }, []);

  async function devMockSign() {
    const { pubHex } = await getOrCreateKey();
    const msg = `nexid://login?domain=${challenge.domain}&challenge=${challenge.challenge}`;
    const sigHex = await signMessageHex(msg);

    const r = await fetch(`${SERVER}/auth/verify`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: challenge.id, pubkeyHex: pubHex, sigHex })
    });
    const data = await r.json();
    if (data.session) onAuthed(data.session, data.sub);
    else alert(JSON.stringify(data));
  }

  if (!challenge) return <div>Loading challenge…</div>;

  return (
    <div style={{ maxWidth: 520, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h2>NEXID Login (MVP)</h2>
      <p>Scan with your Nexa identity app, or use the dev mock signer.</p>
      <img src={qrDataUrl} alt="nexid qr" style={{ width: 240, height: 240 }} />
      <pre style={{ background: "#f5f5f5", padding: 12, overflow: "auto" }}>{challenge.uri}</pre>
      <button onClick={devMockSign}>Dev: Sign & Login</button>
    </div>
  );
}
