const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Shinigami-bin backend is alive... or is it?" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Shinigami-bin server running on port ${PORT}`);
});
