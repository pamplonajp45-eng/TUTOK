// test change
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Settings.css";

function Settings() {
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    sensitivity: parseFloat(localStorage.getItem("sensitivity")) || 1.0,
    crosshairSize: localStorage.getItem("crosshairSize") || 40,
    crosshairColor: localStorage.getItem("crosshairColor") || "#ffffff",
    targetSize: localStorage.getItem("targetSize") || "medium",
    gameVolume: parseFloat(localStorage.getItem("gameVolume")) || 0.5,
    showFPS: localStorage.getItem("showFPS") === "true",
  });

  useEffect(() => {
    Object.keys(settings).forEach((key) => {
      localStorage.setItem(key, settings[key]);
    });
  }, [settings]);

  const handleChange = (e) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    const defaults = {
      sensitivity: 1.0,
      crosshairColor: "#ffffff",
      crosshairSize: 40,
      targetSize: "medium",
      gameVolume: 0.5,
      showFPS: false,
    };
    setSettings(defaults);
    localStorage.clear();
  };

  const valorantSens = (settings.sensitivity * 0.8).toFixed(2);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">
          <span className="title-settings">SETTINGS</span>
        </h1>
        <p className="settings-subtitle"> CUSTOMIZE YOUR TRAINING EXPERIENCE</p>

        <button onClick={() => navigate("/")} className="back-btn">
          ← RETURN TO MENU
        </button>

        <div className="settings-content">
          {/*Sens*/}
          <div className="settings-section">
            <div className="settings-header">
              <h3>MOUSE SENSITIVITY</h3>
              <span className="setting-value">
                {settings.sensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) =>
                handleChange("sensitivity", parseFloat(e.target.value))
              }
              className="slider"
            />

            <div className="setting-info"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
