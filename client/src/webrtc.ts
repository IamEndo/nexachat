export async function createPeer(onMessage: (s: string) => void) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  const dc = pc.createDataChannel("chat");
  dc.onmessage = (ev) => onMessage(String(ev.data));
  await new Promise<void>((res) => (dc.onopen = () => res()));
  return { pc, dc };
}
