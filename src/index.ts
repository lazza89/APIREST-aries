import express from "express";
import cors from "cors";

import routes from "./routes/routes";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", routes);

const PORT = (process.env.PORT || 8081) as number;
app.listen(PORT, () => {
  console.log("Server is running on http://localhost:" + PORT);
});
