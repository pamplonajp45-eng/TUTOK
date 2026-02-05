import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();
  const [gameState, setGameState] = useState("menu"); // menu, playing, results
  const [playerName, setPlayerName] = useState("");
  const [targets, setTargets] = useState([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [stats, setStats] = useState({
    hits: 0,
    misses: 0,
    reactionTimes: [],
  });
  const [leaderboard, setLeaderboard] = useState([]);

  const gameEndedRef = useRef(false);
  const gameAreaRef = useRef(null);
  const targetSpawnInterval = useRef(null);
  const gameTimer = useRef(null);
  const targetCreationTime = useRef({});
  const scoreRef = useRef(0);
  const statsRef = useRef({ hits: 0, misses: 0, reactionTimes: [] });

  const GAME_DURATION = 60;
  const TARGET_LIFETIME = 2000;
  const SPAWN_INTERVAL = 800;

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async () => {
    try {
      const response = await axios.get("/api/leaderboard?limit=5");
      setLeaderboard(response.data);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Spawn target
  const spawnTarget = () => {
    const id = Date.now() + Math.random();
    const size = Math.random() * 30 + 40;
    const x = Math.random() * (window.innerWidth - size - 40) + 20;
    const y = Math.random() * (window.innerHeight - size - 200) + 100;

    const newTarget = { id, x, y, size };
    setTargets((prev) => [...prev, newTarget]);
    targetCreationTime.current[id] = Date.now();

    // Remove target after lifetime
    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== id));
      if (targetCreationTime.current[id]) {
        // Update stats for auto-miss
        setStats((prev) => {
          const newStats = {
            ...prev,
            misses: prev.misses + 1,
          };
          statsRef.current = newStats; // ✅ Update ref
          return newStats;
        });
        delete targetCreationTime.current[id];
      }
    }, TARGET_LIFETIME);
  };

  // In the startGame function, add logs:
  const startGame = () => {
    if (!playerName.trim()) {
      alert("Please enter your name!");
      return;
    }

    console.log("🎮 Game Starting!");

    setGameState("playing");
    setScore(0);
    setTimeLeft(GAME_DURATION);
    setStats({ hits: 0, misses: 0, reactionTimes: [] });
    setTargets([]);
    targetCreationTime.current = {};

    // Reset refs
    scoreRef.current = 0;
    statsRef.current = { hits: 0, misses: 0, reactionTimes: [] };
    gameEndedRef.current = false; // ✅ Reset the flag

    // Spawn targets
    targetSpawnInterval.current = setInterval(() => {
      spawnTarget();
    }, SPAWN_INTERVAL);

    // Game timer
    gameTimer.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const hitTarget = (targetId) => {
    const reactionTime = Date.now() - targetCreationTime.current[targetId];
    delete targetCreationTime.current[targetId];

    setTargets((prev) => prev.filter((t) => t.id !== targetId));

    // Update score
    setScore((prev) => {
      const newScore = prev + 100;
      scoreRef.current = newScore; // ✅ Update ref
      return newScore;
    });

    // Update stats
    setStats((prev) => {
      const newStats = {
        hits: prev.hits + 1,
        misses: prev.misses,
        reactionTimes: [...prev.reactionTimes, reactionTime],
      };
      statsRef.current = newStats; // ✅ Update ref
      return newStats;
    });
  };

  // Miss
  const handleMiss = (e) => {
    if (e.target === gameAreaRef.current) {
      // Update stats for miss
      setStats((prev) => {
        const newStats = {
          ...prev,
          misses: prev.misses + 1,
        };
        statsRef.current = newStats; // ✅ Update ref
        return newStats;
      });

      // Update score
      setScore((prev) => {
        const newScore = Math.max(0, prev - 10);
        scoreRef.current = newScore; // ✅ Update ref
        return newScore;
      });
    }
  };

  const endGame = () => {
    if (gameEndedRef.current) {
      console.log(" Game already ended, skipping...");
      return;
    }

    gameEndedRef.current = true;
    console.log(" Ending game...");

    clearInterval(targetSpawnInterval.current);
    clearInterval(gameTimer.current);
    setTargets([]);
    setGameState("results");

    // Use ref values
    const finalScore = scoreRef.current;
    const finalStats = statsRef.current;

    console.log("📊 Ref Values:", { finalScore, finalStats }); // ✅ Debug log

    const totalShots = finalStats.hits + finalStats.misses;
    const accuracy = totalShots > 0 ? (finalStats.hits / totalShots) * 100 : 0;
    const avgReactionTime =
      finalStats.reactionTimes.length > 0
        ? finalStats.reactionTimes.reduce((a, b) => a + b, 0) /
          finalStats.reactionTimes.length
        : 0;

    const dataToSave = {
      playerName,
      score: finalScore,
      accuracy,
      avgReactionTime,
      targetsHit: finalStats.hits,
      targetsMissed: finalStats.misses,
    };

    console.log("💾 Saving to DB:", dataToSave); // ✅ Debug log

    axios
      .post("/api/stats", dataToSave)
      .then((response) => {
        console.log("✅ Response from server:", response.data);
        fetchLeaderboard();
      })
      .catch((error) => {
        console.error("❌ Error saving stats:", error);
      });
  };

  const returnToMenu = () => {
    setGameState("menu");
    fetchLeaderboard();
  };

  return (
    <div className="App">
      {/* MENU SCREEN */}
      {gameState === "menu" && (
        <div className="menu">
          <div className="menu-content">
            <h1 className="title">
              <span className="title-main">TUTOK</span>
              <span className="title-sub">REACTOR</span>
            </h1>
            <p className="tagline">PRECISION • SPEED • DOMINANCE</p>

            <div className="input-container">
              <input
                type="text"
                placeholder="ENTER CALLSIGN"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startGame()}
                className="name-input"
                maxLength={20}
              />
            </div>

            <button onClick={startGame} className="start-btn">
              LEZ GO!
            </button>

            <div className="instructions">
              <h3>MISSION PARAMETERS</h3>
              <div className="instruction-item">
                ⊕ Eliminate targets before they fade
              </div>
              <div className="instruction-item">
                ⊗ Precision matters - misses cost points
              </div>
              <div className="instruction-item">
                ◷ 60 seconds to prove your worth
              </div>
            </div>

            {leaderboard.length > 0 && (
              <div className="leaderboard">
                <div className="leaderboard-header">
                  <h3>Mga Palo</h3>
                  <button
                    onClick={() => navigate("/leaderboard")}
                    className="view-all-btn"
                  >
                    VIEW ALL →
                  </button>
                </div>
                <div className="leaderboard-list">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div key={entry._id} className="leaderboard-item">
                      <span className="rank">#{index + 1}</span>
                      <span className="name">{entry.playerName}</span>
                      <span className="score">{entry.score}</span>
                      <span className="accuracy">
                        {entry.accuracy.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {gameState === "playing" && (
        <div className="game-area" ref={gameAreaRef} onClick={handleMiss}>
          <div className="hud">
            <div className="hud-item">
              <span className="hud-label">SCORE</span>
              <span className="hud-value">{score}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">TIME</span>
              <span className="hud-value">{timeLeft}s</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">HITS</span>
              <span className="hud-value">{stats.hits}</span>
            </div>
            <div className="hud-item">
              <span className="hud-label">ACC</span>
              <span className="hud-value">
                {stats.hits + stats.misses > 0
                  ? ((stats.hits / (stats.hits + stats.misses)) * 100).toFixed(
                      0,
                    )
                  : 0}
                %
              </span>
            </div>
          </div>

          {targets.map((target) => (
            <div
              key={target.id}
              className="target"
              style={{
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${target.size}px`,
                height: `${target.size}px`,
              }}
              onClick={(e) => {
                e.stopPropagation();
                hitTarget(target.id);
              }}
            >
              <div className="target-inner"></div>
            </div>
          ))}
        </div>
      )}

      {/* RESULTS SCREEN */}
      {gameState === "results" && (
        <div className="results">
          <div className="results-content">
            <h2 className="results-title">MISSION COMPLETE</h2>

            <div className="results-grid">
              <div className="result-card">
                <div className="result-label">FINAL SCORE</div>
                <div className="result-value large">{score}</div>
              </div>

              <div className="result-card">
                <div className="result-label">ACCURACY</div>
                <div className="result-value">
                  {stats.hits + stats.misses > 0
                    ? (
                        (stats.hits / (stats.hits + stats.misses)) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </div>
              </div>

              <div className="result-card">
                <div className="result-label">TARGETS HIT</div>
                <div className="result-value">{stats.hits}</div>
              </div>

              <div className="result-card">
                <div className="result-label">AVG REACTION</div>
                <div className="result-value">
                  {stats.reactionTimes.length > 0
                    ? (
                        stats.reactionTimes.reduce((a, b) => a + b, 0) /
                        stats.reactionTimes.length
                      ).toFixed(0)
                    : 0}
                  ms
                </div>
              </div>
            </div>

            <div className="results-actions">
              <button onClick={startGame} className="retry-btn">
                RUN IT BACK
              </button>
              <button onClick={returnToMenu} className="menu-btn">
                RETURN TO BASE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
