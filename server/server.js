const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/aimlab";
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Game Stats Schema
const gameStatsSchema = new mongoose.Schema({
  playerName: { type: String, required: true },
  score: { type: Number, required: true },
  accuracy: { type: Number, required: true },
  avgReactionTime: { type: Number, required: true },
  targetsHit: { type: Number, required: true },
  targetsMissed: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

const GameStats = mongoose.model("GameStats", gameStatsSchema);

// Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Save game stats
app.post("/api/stats", async (req, res) => {
  try {
    const stats = new GameStats(req.body);
    await stats.save();
    res.status(201).json({ message: "Stats saved successfully", stats });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get leaderboard
app.get("/api/leaderboard", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await GameStats.find()
      .sort({ score: -1 })
      .limit(limit)
      .select("playerName score accuracy avgReactionTime createdAt");
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
