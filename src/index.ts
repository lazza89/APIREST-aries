import express from "express";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Test");
});

app.get("/invitationLink", (req, res) => {
  res.send([1, 2, 3]);
});

const PORT = (process.env.PORT || 8080) as number;
app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
