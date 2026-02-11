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

  const handleChange = (key, value) => {
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
          <div className="setting-section">
            <div className="setting-header">
              <h3>MOUSE SENSITIVITY</h3>
              <span className="setting-value">
                {settings.sensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={settings.sensitivity}
              onChange={(e) =>
                handleChange("sensitivity", parseFloat(e.target.value))
              }
              className="slider"
            />

            <div className="setting-info">
              <span>Slow (0.1x)</span>
              <span className="valorant-equiv">
                ≈ Valorant: {valorantSens}{" "}
              </span>
              <span>Fast (3.0x)</span>
            </div>
            <p className="setting-description">
              Adjust how fast your cursor moves. Lower = more precise, Higher =
              faster flicks.
            </p>
          </div>
          {/*Crosshair Size*/}
          <div className="setting-section">
            <div className="setting-header">
              <h3>CROSSHAIR SIZE</h3>
              <span className="setting-value">{settings.crosshairSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="80"
              step="5"
              value={settings.crosshairSize}
              onChange={(e) =>
                handleChange("crosshairSize", parseInt(e.target.value))
              }
              className="slider"
            />

            <div
              className="crosshair-preview"
              style={{
                width: `${settings.crosshairSize}px`,
                height: `${settings.crosshairSize}px`,
              }}
            >
              <div
                className="preview-crosshair"
                style={{ "--crosshair-color": settings.crosshairColor }}
              ></div>
            </div>
          </div>

          <div className="setting-section">
            <div className="setting-header">
              <h3>CROSSHAIR COLOR</h3>
              <span className="setting-value">{settings.crosshairColor}</span>
            </div>
            <div className="color-picker-container">
              <input
                type="color"
                value={settings.crosshairColor}
                onChange={(e) => handleChange("crosshairColor", e.target.value)}
                className="color-picker"
              />

              <div className="color-presets">
                {[
                  "#00ffff",
                  "#ff00ff",
                  "#ffff00",
                  "#00ff00",
                  "#ff0000",
                  "#ffffff",
                ].map((color) => (
                  <button
                    key={color}
                    className="color-preset"
                    style={{ backgroundColor: color }}
                    onClick={() => handleChange("crosshairColor", color)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/*volume*/}
          <div className="setting-section">
            <div className="setting-header">
              <h3>SOUND EFFECTS VOLUME</h3>
              <span className="setting-value">
                {Math.round(settings.gameVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.gameVolume}
              onChange={(e) =>
                handleChange("gameVolume", parseFloat(e.target.value))
              }
              className="slider"
            />
          </div>

          {/* SHOW FPS */}
          <div className="setting-section">
            <div className="setting-header">
              <h3>SHOW FPS COUNTER</h3>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.showFPS}
                  onChange={(e) => handleChange("showFPS", e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>

          {/* RESET BUTTON */}
          <div className="setting-section">
            <button onClick={resetSettings} className="reset-btn">
              RESET TO DEFAULT SETTINGS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
