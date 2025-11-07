import React, { useState } from "react";
import Login from "./Login";
import Chat from "./Chat";

export default function App() {
  const [session, setSession] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);

  if (!session) return <Login onAuthed={(s, me) => { setSession(s); setSub(me); }} />;
  return <Chat session={session} sub={sub!} />;
}
