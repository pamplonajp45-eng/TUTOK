import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import "./App.css";
import { useNavigate } from "react-router-dom";

const GearIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="24"
    height="24"
    className="gear-svg"
  >
    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
  </svg>
);


const TrophyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    width="24"
    height="24"
    className="trophy-svg"
  >
    <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v3c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.11c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 10V7h2v3H5zm12 0V7h2v3h-2z" />
  </svg>

)

function App() {
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const [gameSettings, setGameSettings] = useState({
    sensitivity: parseFloat(localStorage.getItem("sensitivity")) || 1.0,
    crosshairSize: parseInt(localStorage.getItem("crosshairSize")) || 40,
    crosshairColor: localStorage.getItem("crosshairColor") || "#ffffff",
    targetSize: localStorage.getItem("targetSize") || "medium",
    gameVolume: parseFloat(localStorage.getItem("gameVolume")) || 0.5,
    showFPS: localStorage.getItem("showFPS") === "true",
  });

  const [virtualCursor, setVirtualCursor] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  })
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
  const [fps, setFps] = useState(0);

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
    if (isPausedRef.current) return;
    const id = Date.now() + Math.random();

    // Apply target size from settings
    let minSize, maxSize;
    switch (gameSettings.targetSize) {
      case "small":
        minSize = 30;
        maxSize = 50;
        break;
      case "large":
        minSize = 60;
        maxSize = 100;
        break;
      default: // medium
        minSize = 40;
        maxSize = 70;
    }

    const size = Math.random() * (maxSize - minSize) + minSize;
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
    gameEndedRef.current = false;

    setVirtualCursor({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    })

    setTimeout(() => {
      if (gameAreaRef.current) {
        gameAreaRef.current.requestPointerLock();
      }
    }, 100);

    // Spawn targets
    targetSpawnInterval.current = setInterval(() => {
      spawnTarget();
    }, SPAWN_INTERVAL);

    // Game timer
    gameTimer.current = setInterval(() => {
      if (!isPausedRef.current) {
        setTimeLeft(prev => {
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);
  };

  const handleMouseMove = useCallback((event) => {
    if (isPausedRef.current) return;
    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;

    const sensitivity = gameSettings.sensitivity || 1.0;

    setVirtualCursor(prev => {
      let newX = prev.x + (deltaX * sensitivity);
      let newY = prev.y + (deltaY * sensitivity);

      newX = Math.max(0, Math.min(newX, window.innerWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight));

      return { x: newX, y: newY };
    });
  }, [gameSettings.sensitivity]);


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

  const handleGameAreaClick = (e) => {
    // Check if we hit a target
    let hitSomething = false;

    targets.forEach(target => {
      // Calculate distance from virtual cursor to target center
      const targetCenterX = target.x + target.size / 2;
      const targetCenterY = target.y + target.size / 2;

      const distance = Math.sqrt(
        Math.pow(virtualCursor.x - targetCenterX, 2) +
        Math.pow(virtualCursor.y - targetCenterY, 2)
      );

      // Check if cursor is within target radius
      if (distance <= target.size / 2) {
        hitTarget(target.id);
        hitSomething = true;
      }
    });

    // If didn't hit anything, it's a miss
    if (!hitSomething) {
      setStats(prev => {
        const newStats = {
          ...prev,
          misses: prev.misses + 1
        };
        statsRef.current = newStats;
        return newStats;
      });

      if (isPaused) return;

      setScore(prev => {
        const newScore = Math.max(0, prev - 10);
        scoreRef.current = newScore;
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



  useEffect(() => {
    if (gameState === 'playing') {
      document.addEventListener('mousemove', handleMouseMove);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        if (document.pointerLockElement) {
          document.exitPointerLock();
        }
      };
    }
  }, [gameState, handleMouseMove]);

  // Reload settings when returning to game
  useEffect(() => {
    const handleFocus = () => {
      setGameSettings({
        sensitivity: parseFloat(localStorage.getItem("sensitivity")) || 1.0,
        crosshairSize: parseInt(localStorage.getItem("crosshairSize")) || 40,
        crosshairColor: localStorage.getItem("crosshairColor") || "#ffffff",
        targetSize: localStorage.getItem("targetSize") || "medium",
        gameVolume: parseFloat(localStorage.getItem("gameVolume")) || 0.5,
        showFPS: localStorage.getItem("showFPS") === "true",
      });
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("storage", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("storage", handleFocus);
    };
  }, []);

  // FPS Counter Logic
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let frameId;

    const updateFPS = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        lastTime = now;
      }
      frameId = requestAnimationFrame(updateFPS);
    };

    if (gameSettings.showFPS) {
      frameId = requestAnimationFrame(updateFPS);
    } else {
      setFps(0);
    }

    return () => cancelAnimationFrame(frameId);
  }, [gameSettings.showFPS]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsPaused(prev => {
          const newPausedState = !prev;
          isPausedRef.current = newPausedState;

          if (newPausedState) {
            document.exitPointerLock();
          } else {
            gameAreaRef.current?.requestPointerLock();
          }
          return newPausedState;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    }
  }, []);


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

            <button
              onClick={() => navigate("/settings")}
              className="settings-icon-btn"
              title="Settings"
            >
              <GearIcon />
            </button>

            <button
              onClick={() => navigate("/leaderboards")}
              className="trophy-icon-btn"
              title="Leaderboard"
            >
              <TrophyIcon />
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

          </div>
        </div>
      )}

      {/* GAME SCREEN */}
      {gameState === 'playing' && (
        <div
          className="game-area"
          ref={gameAreaRef}
          onClick={handleGameAreaClick}
        >
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

            {gameSettings.showFPS && (
              <div className="hud-item fps-counter">
                <span className="hud-label">FPS</span>
                <span className="hud-value">{fps}</span>
              </div>
            )}
          </div>

          {isPaused && (
            <div className="pause-overlay">
              <div className="pause-menu">
                <h2>TRAINING PAUSED</h2>
                <button onClick={() => { setIsPaused(false); isPausedRef.current = false }}>RESUME TRAINING</button>
                <button onClick={() => navigate('/settings')}>SETTINGS</button>
                <button onClick={() => setGameState('menu')}>ABANDON TRAINING</button>
              </div>
            </div>
          )}


          <div
            className="crosshair"
            style={{
              left: `${virtualCursor.x}px`,
              top: `${virtualCursor.y}px`,
              width: `${gameSettings.crosshairSize}px`,
              height: `${gameSettings.crosshairSize}px`,
              '--crosshair-color': gameSettings.crosshairColor
            }}
          ></div>


          {targets.map(target => (
            <div
              key={target.id}
              className="target"
              style={{
                left: `${target.x}px`,
                top: `${target.y}px`,
                width: `${target.size}px`,
                height: `${target.size}px`
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
