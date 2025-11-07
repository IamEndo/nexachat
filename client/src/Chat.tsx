import React, { useEffect, useRef, useState } from "react";
import { createPeer } from "./webrtc";
import * as secp from "@noble/secp256k1";
import { getOrCreateKey, signMessageHex } from "./crypto";

const SERVER = import.meta.env.VITE_SERVER ?? "http://localhost:5174";

export default function Chat({ session, sub }: { session: string; sub: string }) {
  const [log, setLog] = useState<string[]>([]);
  const [text, setText] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const peer = useRef<Awaited<ReturnType<typeof createPeer>> | null>(null);
  const room = "global"; // MVP: single room

  useEffect(() => {
    (async () => {
      const { pubHex } = await getOrCreateKey();
      const ws = new WebSocket(SERVER.replace(/^http/, "ws") + "/signal");
      wsRef.current = ws;

      ws.onopen = async () => {
        const nonce = crypto.getRandomValues(new Uint8Array(16));
        const msg = JSON.stringify({ room, nonce: Buffer.from(nonce).toString("base64url") });
        ws.send(JSON.stringify({
          type: "join",
          room,
          pubkeyHex: pubHex,
          sigHex: await signMessageHex(msg),
          nonce: Buffer.from(nonce).toString("base64url")
        }));

        const p = await createPeer((s) => setLog((L) => [...L, s]));
        peer.current = p;

        const offer = await p.pc.createOffer();
        await p.pc.setLocalDescription(offer);

        const envelope = {
          type: "offer",
          sdp: offer.sdp
        };

        ws.send(JSON.stringify({
          type: "relay",
          envelope: {
            ...envelope,
            pubkeyHex: pubHex,
            sigHex: await signMessageHex(JSON.stringify(envelope))
          }
        }));
      };

      ws.onmessage = async (ev) => {
        const data = JSON.parse(ev.data);
        if (data.type !== "relay") return;
        const env = data.envelope;

        if (env.type === "offer" && peer.current) {
          await peer.current.pc.setRemoteDescription({ type: "offer", sdp: env.sdp });
          const answer = await peer.current.pc.createAnswer();
          await peer.current.pc.setLocalDescription(answer);

          const { pubHex } = await getOrCreateKey();
          const envelope = { type: "answer", sdp: answer.sdp };
          ws.send(JSON.stringify({
            type: "relay",
            envelope: {
              ...envelope,
              pubkeyHex: pubHex,
              sigHex: await signMessageHex(JSON.stringify(envelope))
            }
          }));
        } else if (env.type === "answer" && peer.current) {
          await peer.current.pc.setRemoteDescription({ type: "answer", sdp: env.sdp });
        }
      };
    })();
  }, [session, sub]);

  function send() {
    if (!peer.current) return;
    peer.current.dc.send(text);
    setLog((L) => [...L, `me: ${text}`]);
    setText("");
  }

  return (
    <div style={{ maxWidth: 720, margin: "2rem auto", fontFamily: "system-ui" }}>
      <h3>Decentralized P2P Chat (MVP)</h3>
      <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 240 }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input value={text} onChange={e => setText(e.target.value)} style={{ flex: 1 }} placeholder="Type a message…" />
        <button onClick={send}>Send</button>
      </div>
      <p style={{ marginTop: 12, color: "#555" }}>
        Identity-backed: your SDP offers/answers are signed by your Nexa identity (dev key in this demo).
      </p>
    </div>
  );
}
