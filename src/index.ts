import "dotenv/config";
import express from "express";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.send("Hello World, Yoo yo");
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
