import { WebSocketServer, WebSocket } from "ws";
import { verifySignatureHex } from "./crypto.js";
import { sha256 } from "@noble/hashes/sha256";

type Peer = { ws: WebSocket; sub: string };
const rooms = new Map<string, Set<Peer>>();

function stringHash(obj: any) {
  return JSON.stringify(obj);
}

async function verifySignedEnvelope(env: any): Promise<{ sub: string } | null> {
  // Envelope:
  // { sdp: string, type: "offer"|"answer"|"candidate", pubkeyHex, sigHex }
  const { pubkeyHex, sigHex, ...rest } = env;
  const msg = stringHash(rest);
  const ok = await verifySignatureHex(msg, sigHex, pubkeyHex);
  return ok ? { sub: pubkeyHex.toLowerCase() } : null;
}

export function attachSignalingServer(server: any) {
  const wss = new WebSocketServer({ server, path: "/signal" });
  wss.on("connection", (ws) => {
    let currentRoom: string | null = null;
    let me: Peer | null = null;

    ws.on("message", async (raw) => {
      const m = JSON.parse(raw.toString());

      if (m.type === "join") {
        const { room, pubkeyHex, sigHex, nonce } = m;
        const ok = await verifySignatureHex(JSON.stringify({ room, nonce }), sigHex, pubkeyHex);
        if (!ok) return ws.close(1008, "auth failed");

        me = { ws, sub: pubkeyHex.toLowerCase() };
        currentRoom = room;
        if (!rooms.has(room)) rooms.set(room, new Set());
        rooms.get(room)!.add(me);
        return;
      }

      if (m.type === "relay") {
        if (!me || !currentRoom) return;
        const verified = await verifySignedEnvelope(m.envelope);
        if (!verified || verified.sub !== me.sub) return; // must match sender identity

        // relay to other peers in room
        for (const p of rooms.get(currentRoom) ?? []) {
          if (p.ws !== ws) p.ws.send(JSON.stringify({ type: "relay", envelope: m.envelope }));
        }
      }
    });

    ws.on("close", () => {
      if (currentRoom && me) rooms.get(currentRoom)?.delete(me);
    });
  });
}
