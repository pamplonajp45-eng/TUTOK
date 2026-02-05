import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Leaderboard.css";

function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/leaderboard?limit=50");
      setLeaderboard(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      setLoading(false);
    }
  };

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-container">
        <h1 className="leaderboard-title">
          <span className="title-elite"></span>
          <span className="title-operators"> PALO!</span>
        </h1>
        <p className="leaderboard-subtitle">Mga Batak Tumutok</p>

        <button onClick={() => navigate("/")} className="back-btn">
          ← RETURN TO TRAINING
        </button>

        {loading ? (
          <div className="loading">LOADING DATA...</div>
        ) : (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="header-rank">RANK</div>
              <div className="header-name">OPERATOR</div>
              <div className="header-score">SCORE</div>
              <div className="header-accuracy">ACCURACY</div>
              <div className="header-reaction">REACTION</div>
              <div className="header-date">DATE</div>
            </div>

            {leaderboard.map((entry, index) => (
              <div
                key={entry._id}
                className={`table-row ${index < 3 ? "top-three" : ""}`}
              >
                <div className="row-rank">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </div>
                <div className="row-name">{entry.playerName}</div>
                <div className="row-score">{entry.score.toLocaleString()}</div>
                <div className="row-accuracy">{entry.accuracy.toFixed(1)}%</div>
                <div className="row-reaction">
                  {entry.avgReactionTime.toFixed(0)}ms
                </div>
                <div className="row-date">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="no-data">No records yet. Be the first!</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Leaderboard;
