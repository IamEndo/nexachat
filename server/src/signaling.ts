import { WebSocketServer } from "ws";
import type { Server } from "http";

type SigMsg =
  | { type: "join"; room: string; peerId: string }
  | { type: "signal"; room: string; from: string; to: string; data: any }
  | { type: "leave"; room: string; peerId: string };

export function setupSignaling(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  // room -> peerId -> ws
  const rooms = new Map<string, Map<string, WebSocket>>();

  wss.on("connection", (ws) => {
    let myRoom: string | null = null;
    let myId: string | null = null;

    ws.on("message", (raw) => {
      let msg: SigMsg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "join") {
        myRoom = msg.room;
        myId = msg.peerId;
        if (!rooms.has(myRoom)) rooms.set(myRoom, new Map());
        rooms.get(myRoom)!.set(myId, ws);
        return;
      }

      if (msg.type === "signal" && myRoom) {
        const peers = rooms.get(myRoom);
        const dest = peers?.get(msg.to);
        if (dest && dest.readyState === dest.OPEN) {
          dest.send(JSON.stringify(msg));
        }
        return;
      }

      if (msg.type === "leave" && myRoom && myId) {
        rooms.get(myRoom)?.delete(myId);
        return;
      }
    });

    ws.on("close", () => {
      if (myRoom && myId) rooms.get(myRoom)?.delete(myId);
    });
  });
}
