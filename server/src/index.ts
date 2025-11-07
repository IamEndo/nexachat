import express from "express";
import cors from "cors";
import http from "http";
import { issueChallenge, verifyLogin, requireSession } from "./auth.js";
import { attachSignalingServer } from "./signaling.js";

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

const PORT = process.env.PORT || 5174;
server.listen(PORT, () => console.log(`Server listening on :${PORT}`));
