import express from "express";
import cors from "cors";
import http from "http";
import { issueChallenge, verifyLogin, requireSession } from "./auth.js";
import { attachSignalingServer } from "./signaling.js";
import path from "node:path";

app.use(express.static(path.join(process.cwd(), "client/dist")));
app.get("*", (_req, res) => {
  res.sendFile(path.join(process.cwd(), "client/dist/index.html"));
});


const app = express();
app.use(cors());
app.use(express.json());

app.get("/auth/challenge", issueChallenge);
app.post("/auth/verify", verifyLogin);

// Example protected route
app.get("/me", requireSession, (req, res) => {
  res.json({ me: (req as any).session.sub });
});

const server = http.createServer(app);
attachSignalingServer(server);

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`listening on ${port}`));
