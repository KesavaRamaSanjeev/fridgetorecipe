import React, { useState, useEffect } from "react";
import { Sun, Moon, Key, Trash2, Globe, Save, Eye, EyeOff } from "lucide-react";
import styles from "./Settings.module.css";

export default function Settings({ theme, onToggleTheme }) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [language, setLanguage] = useState("English");
  const [saveStatus, setSaveStatus] = useState("");

  // Load saved custom key on mount
  useEffect(() => {
    const savedKey = localStorage.getItem("custom_gemini_key") || "";
    setApiKey(savedKey);
    
    const savedLang = localStorage.getItem("app_language") || "English";
    setLanguage(savedLang);
  }, []);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("custom_gemini_key", apiKey.trim());
    localStorage.setItem("app_language", language);
    setSaveStatus("Settings saved successfully! Refreshing connection...");
    
    // Auto clear status after 3s
    setTimeout(() => {
      setSaveStatus("");
      // Reload page to re-initialize connection
      window.location.reload();
    }, 1500);
  };

  const handleClearHistory = () => {
    if (window.confirm("Are you sure you want to clear your cooking history and saved recipes? This cannot be undone.")) {
      localStorage.removeItem("recipe_planner_sessions");
      localStorage.removeItem("shopping_list");
      localStorage.removeItem("custom_gemini_key");
      alert("All data cleared successfully.");
      window.location.reload();
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Settings</h1>
      <p className={styles.pageSubtitle}>Personalize your Chef Studio configurations and credentials.</p>

      <div className={styles.sectionsGrid}>
        {/* Appearance Settings */}
        <div className={`${styles.card} glass`}>
          <h3 className={styles.cardTitle}>
            <Sun size={18} className={styles.titleIcon} />
            <span>Appearance</span>
          </h3>
          <p className={styles.cardDesc}>Select your preferred interface theme.</p>
          
          <div className={styles.themeGrid}>
            <button 
              onClick={() => theme !== "light" && onToggleTheme()} 
              className={`${styles.themeBtn} ${theme === "light" ? styles.activeTheme : ""}`}
            >
              <Sun size={16} />
              <span>Light Mode</span>
            </button>
            <button 
              onClick={() => theme !== "dark" && onToggleTheme()} 
              className={`${styles.themeBtn} ${theme === "dark" ? styles.activeTheme : ""}`}
            >
              <Moon size={16} />
              <span>Dark Mode</span>
            </button>
          </div>
        </div>

        {/* AI Credentials Settings */}
        <div className={`${styles.card} glass`}>
          <h3 className={styles.cardTitle}>
            <Key size={18} className={styles.titleIcon} />
            <span>AI Settings</span>
          </h3>
          <p className={styles.cardDesc}>Provide your personal Google Gemini API Key.</p>

          <form onSubmit={handleSaveSettings} className={styles.keyForm}>
            <div className={styles.inputWrapper}>
              <input 
                type={showKey ? "text" : "password"} 
                placeholder="AIzaSy..." 
                className={styles.keyInput}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <button 
                type="button" 
                className={styles.eyeBtn}
                onClick={() => setShowKey(!showKey)}
                aria-label={showKey ? "Hide key" : "Show key"}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className={styles.saveBtn}>
              <Save size={14} />
              <span>Save Credentials</span>
            </button>
          </form>
          {saveStatus && <p className={styles.saveStatus}>{saveStatus}</p>}
        </div>

        {/* Region and Localization */}
        <div className={`${styles.card} glass`}>
          <h3 className={styles.cardTitle}>
            <Globe size={18} className={styles.titleIcon} />
            <span>Localization</span>
          </h3>
          <p className={styles.cardDesc}>Set your recipe generation language.</p>
          
          <div className={styles.selectWrapper}>
            <Globe size={16} className={styles.selectIcon} />
            <select 
              className={styles.selectLang}
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="English">English (Default)</option>
              <option value="Spanish">Spanish (Español)</option>
              <option value="French">French (Français)</option>
              <option value="German">German (Deutsch)</option>
              <option value="Hindi">Hindi (हिंदी)</option>
            </select>
          </div>
        </div>

        {/* Privacy & Account Actions */}
        <div className={`${styles.card} glass`}>
          <h3 className={styles.cardTitle} style={{ color: "var(--error)" }}>
            <Trash2 size={18} className={styles.titleIcon} />
            <span>Data & Privacy</span>
          </h3>
          <p className={styles.cardDesc}>Clear locally saved history caches.</p>
          
          <div className={styles.dangerZone}>
            <button onClick={handleClearHistory} className={styles.clearBtn}>
              <Trash2 size={14} />
              <span>Reset Application Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
