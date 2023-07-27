import express from "express";
import { Issuer } from "./Issuer";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Test");
});

app.get("/invitationLink", async (req, res) => {
  const issuer = new Issuer(8080, "Faber college");
  await issuer.initialize();
  const invite = await issuer.printInvite();
  console.log(invite);
  res.send(invite);
});

const PORT = (process.env.PORT || 8080) as number;
app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
