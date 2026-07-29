"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  ChefHat, Sun, Moon, Menu, X, Trash2, Send, AlertTriangle, Plus, RefreshCw, 
  BookOpen, ShoppingBag, Settings as SettingsIcon, Play, Check, Sparkles, HelpCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./page.module.css";
import RecipePlanner from "@/components/RecipePlanner";
import SavedRecipes from "@/components/SavedRecipes";
import ShoppingList from "@/components/ShoppingList";
import Settings from "@/components/Settings";
import CookMode from "@/components/CookMode";
import { repairJson } from "@/utils/jsonRepair";

export default function Home() {
  // Landing Page state - matches Panel 1
  const [hasStarted, setHasStarted] = useState(false);

  // Navigation states: 'dashboard', 'saved', 'shopping', 'settings'
  const [activeView, setActiveView] = useState("dashboard");
  const [theme, setTheme] = useState("light"); // Default to light mode as in mockup images
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ingredient Tags chips state (Mockup 2)
  const [tagInput, setTagInput] = useState("");
  const [ingredientsTags, setIngredientsTags] = useState([]);

  // Active Recipe and Cook Mode states
  const [recipeData, setRecipeData] = useState(null);
  const [activeCookSteps, setActiveCookSteps] = useState(null);

  // Loading, progress, and error states
  const [isLoading, setIsLoading] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [error, setError] = useState(null);

  // Multi-Step checkoff loading state (Mockup 3)
  const [loadingSteps, setLoadingSteps] = useState([
    { label: "Detecting ingredients", status: "pending" },
    { label: "Finding best combinations", status: "pending" },
    { label: "Checking nutrition", status: "pending" },
    { label: "Generating recipes", status: "pending" },
    { label: "Calculating servings", status: "pending" },
    { label: "Preparing cooking steps", status: "pending" }
  ]);

  // API Key state check
  const [hasApiKey, setHasApiKey] = useState(true);

  // Saved Recipe Sessions
  const [sessions, setSessions] = useState([]);
  const activeRequestId = useRef(null);

  // Quick suggestions cards mapping
  const quickSuggestions = [
    { label: "Breakfast", icon: "🍳", items: ["eggs", "spinach", "bread", "cheddar cheese", "butter"] },
    { label: "Lunch", icon: "🥪", items: ["chicken breast", "lettuce", "tomato", "avocado", "olive oil"] },
    { label: "Dinner", icon: "🍝", items: ["salmon", "asparagus", "garlic", "lemon", "quinoa"] },
    { label: "Healthy", icon: "🥗", items: ["tofu", "broccoli", "carrots", "soy sauce", "ginger"] }
  ];

  // Assign chip dot color based on category
  const getTagColor = (name) => {
    const n = name.toLowerCase();
    if (n.includes("egg") || n.includes("bread") || n.includes("pasta") || n.includes("rice")) return "#f97316"; // Orange
    if (n.includes("cheese") || n.includes("milk") || n.includes("butter") || n.includes("cream")) return "#eab308"; // Yellow
    if (n.includes("spinach") || n.includes("lettuce") || n.includes("broccoli") || n.includes("avocado") || n.includes("lime") || n.includes("basil") || n.includes("onion")) return "#10b981"; // Green
    if (n.includes("sauce") || n.includes("pepper") || n.includes("tomato") || n.includes("chili") || n.includes("beef") || n.includes("chicken") || n.includes("meat")) return "#ef4444"; // Red
    return "#8b5cf6"; // Purple default
  };

  // Load configuration and saved history on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light"; // Default light theme
    setTheme(savedTheme);
    document.documentElement.setAttribute("data-theme", savedTheme);

    const savedSessions = localStorage.getItem("recipe_planner_sessions");
    if (savedSessions) {
      try {
        setSessions(JSON.parse(savedSessions));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }

    checkApiKeyConfig();
  }, []);

  // Multi-step loading checklist animation interval
  useEffect(() => {
    if (!isLoading) {
      setLoadingSteps(steps => steps.map(s => ({ ...s, status: "pending" })));
      return;
    }

    let currentStep = 0;
    const interval = setInterval(() => {
      setLoadingSteps(steps => steps.map((s, i) => {
        if (i < currentStep) return { ...s, status: "done" };
        if (i === currentStep) return { ...s, status: "loading" };
        return { ...s, status: "pending" };
      }));

      currentStep++;
      if (currentStep > 5) {
        clearInterval(interval);
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [isLoading]);

  const checkApiKeyConfig = async () => {
    try {
      const customKey = localStorage.getItem("custom_gemini_key") || "";
      const headers = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-gemini-key"] = customKey;
      }

      const res = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: "ping-test" })
      });
      if (res.status === 500) {
        const data = await res.json();
        if (data.error && data.error.includes("Gemini API key is not configured")) {
          setHasApiKey(false);
          return;
        }
      }
      setHasApiKey(true);
    } catch (e) {
      // Ignore initial offline errors
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
    localStorage.setItem("theme", nextTheme);
  };

  // Add tags chips helpers
  const handleAddTagChip = (val) => {
    const trimmed = val.trim().toLowerCase();
    if (trimmed && !ingredientsTags.includes(trimmed)) {
      setIngredientsTags([...ingredientsTags, trimmed]);
    }
    setTagInput("");
  };

  const handleRemoveTagChip = (indexToRemove) => {
    setIngredientsTags(ingredientsTags.filter((_, i) => i !== indexToRemove));
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTagChip(tagInput);
    } else if (e.key === "Backspace" && !tagInput && ingredientsTags.length > 0) {
      setIngredientsTags(ingredientsTags.slice(0, -1));
    }
  };

  const handleSuggestionClick = (items) => {
    setIngredientsTags(items);
  };

  const handleLoadSession = (session) => {
    setRecipeData(session.data);
    setActiveView("recipe-detail");
    setSidebarOpen(false);
  };

  const handleDeleteSession = (e, sessionId) => {
    e.stopPropagation();
    const updated = sessions.filter(s => s.id !== sessionId);
    setSessions(updated);
    localStorage.setItem("recipe_planner_sessions", JSON.stringify(updated));
  };

  const handleNewSession = () => {
    setRecipeData(null);
    setIngredientsTags([]);
    setActiveView("dashboard");
    setSidebarOpen(false);
  };

  // Main Fetch logic
  const handleGenerateRecipe = async () => {
    if (ingredientsTags.length === 0 || isLoading) return;

    setError(null);
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingStatus("AI Chef is thinking...");
    setRecipeData(null);

    const promptText = ingredientsTags.join(", ");
    const reqId = Date.now();
    activeRequestId.current = reqId;

    try {
      const customKey = localStorage.getItem("custom_gemini_key") || "";
      const headers = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-gemini-key"] = customKey;
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt: promptText })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}: Failed to reach server.`);
      }

      setLoadingProgress(35);
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";
      let hasReceivedData = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          accumulated += chunk;
          hasReceivedData = true;

          if (activeRequestId.current !== reqId) {
            return;
          }

          const repairedObj = repairJson(accumulated);
          setRecipeData(repairedObj);
          setLoadingProgress(prev => Math.min(prev + 5, 95));
        }
      }

      if (!hasReceivedData) {
        throw new Error("No data received from the AI model.");
      }

      const finalObj = repairJson(accumulated);
      if (!finalObj || Object.keys(finalObj).length === 0) {
        throw new Error("AI returned invalid data structure. Please try a different query.");
      }

      setLoadingProgress(100);
      setIsLoading(false);

      // Save session
      const title = finalObj.recipeName || "New Recipe";
      const newSession = {
        id: `recipe_${Date.now()}`,
        title,
        data: finalObj,
        rawPrompt: promptText,
        timestamp: new Date().toISOString()
      };
      
      const updatedSessions = [newSession, ...sessions];
      setSessions(updatedSessions);
      localStorage.setItem("recipe_planner_sessions", JSON.stringify(updatedSessions));
      
      setActiveView("recipe-detail");

    } catch (err) {
      if (activeRequestId.current === reqId) {
        setError(err.message || "An unknown error occurred.");
        setIsLoading(false);
      }
    }
  };

  const handleRefineRecipe = async (refinementText) => {
    if (!recipeData || !refinementText.trim() || isRefining) return;

    setError(null);
    setIsRefining(true);

    const reqId = Date.now();
    activeRequestId.current = reqId;

    try {
      const customKey = localStorage.getItem("custom_gemini_key") || "";
      const headers = { "Content-Type": "application/json" };
      if (customKey) {
        headers["x-gemini-key"] = customKey;
      }

      const response = await fetch("/api/ai", {
        method: "POST",
        headers,
        body: JSON.stringify({ 
          prompt: ingredientsTags.join(", "), 
          refinementPrompt: refinementText,
          currentData: recipeData 
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP error ${response.status}: Failed to refine.`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulated = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value);
          accumulated += chunk;

          if (activeRequestId.current !== reqId) {
            return;
          }

          const repairedObj = repairJson(accumulated);
          setRecipeData(repairedObj);
        }
      }

      const finalObj = repairJson(accumulated);
      if (finalObj && Object.keys(finalObj).length > 0) {
        setRecipeData(finalObj);
        
        // Update session
        const title = finalObj.recipeName || "New Recipe";
        const newSession = {
          id: `recipe_${Date.now()}`,
          title,
          data: finalObj,
          rawPrompt: ingredientsTags.join(", "),
          timestamp: new Date().toISOString()
        };
        const filtered = sessions.filter(s => s.title !== title);
        const updatedSessions = [newSession, ...filtered];
        setSessions(updatedSessions);
        localStorage.setItem("recipe_planner_sessions", JSON.stringify(updatedSessions));
      }

      setIsRefining(false);
    } catch (err) {
      if (activeRequestId.current === reqId) {
        setError(`Refinement failed: ${err.message}`);
        setIsRefining(false);
      }
    }
  };

  return (
    <div className={styles.appContainer}>
      
      {/* Immersive Full Screen Cook Mode Layer (Panel 6) */}
      {activeCookSteps && (
        <CookMode 
          recipeName={recipeData?.recipeName}
          steps={activeCookSteps}
          onExit={() => setActiveCookSteps(null)}
        />
      )}

      {/* VIEW A: LANDING PAGE VIEW (Panel 1 Mockup) */}
      {!hasStarted && (
        <div className={styles.landingWrapper}>
          {/* Landing Header */}
          <header className={styles.landingHeader}>
            <div className={styles.logoRow}>
              <div className={styles.logoIcon}>
                <ChefHat size={20} />
              </div>
              <span className={styles.logoText}>FridgeToRecipe</span>
            </div>
            <nav className={styles.landingNav}>
              <a href="#features">Features</a>
              <a href="#howitworks">How It Works</a>
              <button onClick={() => setHasStarted(true)} className={styles.getStartedBtn}>
                Get Started
              </button>
            </nav>
          </header>

          {/* Landing Hero Split */}
          <main className={styles.landingHero}>
            <div className={styles.heroLeft}>
              <h1 className={styles.heroMainTitle}>
                Turn What You Have Into Something <span className={styles.greenText}>Delicious</span>
              </h1>
              <p className={styles.heroMainDesc}>
                AI-powered recipe planner that transforms your fridge ingredients into amazing meals. Zero waste, infinite taste.
              </p>
              <div className={styles.heroBtnGroup}>
                <button onClick={() => setHasStarted(true)} className={styles.ctaStartBtn}>
                  Start Cooking
                </button>
                <button onClick={() => alert("Watch demo video context loaded!")} className={styles.ctaDemoBtn}>
                  Watch Demo
                </button>
              </div>
            </div>

            {/* Premium CSS-Styled Food Plate Graphic */}
            <div className={styles.heroRight}>
              <div className={styles.spaghettiPlate}>
                <div className={styles.spaghettiNoodles}>
                  {/* Decorative noodles */}
                  <div className={`${styles.noodle} ${styles.noodle1}`} />
                  <div className={`${styles.noodle} ${styles.noodle2}`} />
                  <div className={`${styles.noodle} ${styles.noodle3}`} />
                  {/* Tomatoes and leaf garnishes */}
                  <div className={`${styles.tomatoGarnish} ${styles.t1}`} />
                  <div className={`${styles.tomatoGarnish} ${styles.t2}`} />
                  <div className={`${styles.basilGarnish} ${styles.b1}`} />
                  <div className={`${styles.basilGarnish} ${styles.b2}`} />
                </div>
              </div>
            </div>
          </main>

          {/* Landing Footer Info */}
          <footer className={styles.landingFooter} id="howitworks">
            <h3 className={styles.howItWorksTitle}>How It Works</h3>
            <div className={styles.stepsRow}>
              <div className={styles.stepCol}>
                <div className={styles.stepNum}>1</div>
                <h4>Add Ingredients</h4>
                <p>Tell us what's in your fridge.</p>
              </div>
              <div className={styles.stepCol}>
                <div className={styles.stepNum}>2</div>
                <h4>AI Creates Recipe</h4>
                <p>Our AI finds the best recipes.</p>
              </div>
              <div className={styles.stepCol}>
                <div className={styles.stepNum}>3</div>
                <h4>Cook & Enjoy</h4>
                <p>Follow steps and enjoy!</p>
              </div>
            </div>
          </footer>
        </div>
      )}

      {/* VIEW B: MAIN WEB APP WORKSPACE (Dashboard & Pages) */}
      {hasStarted && (
        <>
          {/* SIDEBAR NAVIGATION (Panel 2) */}
          <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
            <div className={styles.sidebarHeader} onClick={() => setHasStarted(false)} style={{ cursor: "pointer" }}>
              <div className={styles.logoIcon}>
                <ChefHat size={20} />
              </div>
              <div className={styles.logoInfo}>
                <span className={styles.logoText}>FridgeToRecipe</span>
                <span className={styles.logoSub}>AI Chef Studio</span>
              </div>
            </div>

            {/* Navigation Section */}
            <div className={styles.navSection}>
              <span className={styles.sectionLabel}>Select Page</span>
              <button 
                className={`${styles.navButton} ${activeView === "dashboard" || activeView === "recipe-detail" ? styles.activeNav : ""}`}
                onClick={() => { setActiveView("dashboard"); setRecipeData(null); setSidebarOpen(false); }}
              >
                <ChefHat size={18} />
                Dashboard
              </button>
              <button 
                className={`${styles.navButton} ${activeView === "saved" ? styles.activeNav : ""}`}
                onClick={() => { setActiveView("saved"); setSidebarOpen(false); }}
              >
                <Play size={18} />
                Recipes (Saved)
              </button>
              <button 
                className={`${styles.navButton} ${activeView === "shopping" ? styles.activeNav : ""}`}
                onClick={() => { setActiveView("shopping"); setSidebarOpen(false); }}
              >
                <ShoppingBag size={18} />
                Shopping List
              </button>
              <button 
                className={`${styles.navButton} ${activeView === "settings" ? styles.activeNav : ""}`}
                onClick={() => { setActiveView("settings"); setSidebarOpen(false); }}
              >
                <SettingsIcon size={18} />
                Settings
              </button>
            </div>

            {/* Sidebar Footer Theme toggle */}
            <div className={styles.sidebarFooter}>
              <button 
                className={styles.themeToggle} 
                onClick={toggleTheme}
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Made with 🤍 in Gemini
              </span>
            </div>
          </aside>

          {/* MAIN CONTENT CONTAINER */}
          <main className={styles.mainContent}>
            
            {/* Top Header status indicator */}
            <div className={styles.topBar}>
              <button 
                className={styles.menuButton} 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle sidebar menu"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <div style={{ flexGrow: 1 }} />

              <div className={`${styles.apiKeyIndicator} ${hasApiKey ? styles.apiKeyIndicatorConnected : ""}`}>
                <span className={styles.apiKeyIndicatorDot} />
                <span>{hasApiKey ? "Gemini API Connected" : "No API Key"}</span>
              </div>
            </div>

            {/* View Router Display Wrapper */}
            <div className={styles.contentContainer}>
              <AnimatePresence mode="wait">
                
                {/* VIEW 1: Main Dashboard Ingredients Input (Panel 2) */}
                {activeView === "dashboard" && !isLoading && !error && (
                  <motion.div 
                    className={styles.dashboardView}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    key="dashboard"
                  >
                    <div className={styles.heroRow}>
                      <h2 className={styles.heroTitle}>Welcome back, Chef! 🧑‍🍳</h2>
                      <p className={styles.heroSub}>What are we cooking today? Tell us what is in your fridge.</p>
                    </div>

                    {/* Main ingredients tag input card */}
                    <div className={`${styles.formCard} glass`}>
                      <div className={styles.inputGroup}>
                        <label className={styles.inputLabel}>What's in your fridge?</label>
                        
                        <div className={styles.tagInputWrapper}>
                          {ingredientsTags.map((tag, i) => (
                            <span key={i} className={styles.tagChip}>
                              <span 
                                className={styles.tagChipDot} 
                                style={{ backgroundColor: getTagColor(tag) }} 
                              />
                              {tag}
                              <button 
                                type="button" 
                                className={styles.removeTagBtn}
                                onClick={() => handleRemoveTagChip(i)}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                          <input 
                            type="text" 
                            placeholder={ingredientsTags.length === 0 ? "Type ingredients (e.g. eggs, cheese) and press Enter..." : "Add more..."}
                            className={styles.tagInput}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={handleInputKeyDown}
                          />
                        </div>
                      </div>

                      <button 
                        onClick={handleGenerateRecipe} 
                        className={styles.submitButton}
                        disabled={ingredientsTags.length === 0}
                      >
                        <Send size={16} />
                        <span>Generate Recipe ✨</span>
                      </button>
                    </div>

                    {/* Suggestions Section matching Panel 2 */}
                    <div className={styles.suggestionsSection}>
                      <h3 className={styles.suggestionsTitle}>Quick Suggestions</h3>
                      <div className={styles.suggestionsGrid}>
                        {quickSuggestions.map((suggestion, idx) => (
                          <motion.div 
                            key={idx}
                            className={`${styles.suggestionCard} glass`}
                            onClick={() => handleSuggestionClick(suggestion.items)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className={styles.suggestionIcon}>{suggestion.icon}</span>
                            <div>
                              <h4 style={{ fontWeight: 700, fontSize: "14px" }}>{suggestion.label}</h4>
                              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{suggestion.items.length} ingredients</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* VIEW 2: Checkoff Checklist Loading State (Panel 3 Mockup) */}
                {isLoading && (
                  <motion.div 
                    className={`${styles.loadingContainer} glass`}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    key="loading"
                  >
                    <div className={styles.loadingFlex}>
                      
                      {/* Left Column: Robot chef visualization placeholder */}
                      <div className={styles.robotChefCard}>
                        {/* Premium CSS-Animated Mascot Robot */}
                        <div className={styles.robotContainer}>
                          <div className={styles.robotChefGraphic}>🤖</div>
                          <div className={styles.robotPulsar} />
                        </div>
                      </div>

                      {/* Right Column: Steps Checkbox Log */}
                      <div className={styles.checklistCard}>
                        <h3 className={styles.loadingHeader}>AI Chef is thinking...</h3>
                        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "16px" }}>
                          Analyzing your ingredients and creating the perfect recipe...
                        </p>
                        
                        <div className={styles.loadingStepsList}>
                          {loadingSteps.map((step, idx) => (
                            <div key={idx} className={styles.loadingStepItem}>
                              <div className={`${styles.loadingCheckbox} ${step.status === "done" ? styles.loadingCheckboxDone : ""} ${step.status === "loading" ? styles.loadingCheckboxPulse : ""}`}>
                                {step.status === "done" && <Check size={10} strokeWidth={4} />}
                                {step.status === "loading" && <div className={styles.miniSpinner} />}
                              </div>
                              <span className={`${styles.loadingStepLabel} ${step.status === "done" ? styles.loadingStepLabelDone : ""} ${step.status === "loading" ? styles.loadingStepLabelActive : ""}`}>
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* VIEW 3: Error fallback */}
                {error && (
                  <motion.div 
                    className={styles.errorCard}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    key="error"
                  >
                    <div className={styles.errorHeader}>
                      <AlertTriangle size={20} />
                      <span>An Error Occurred</span>
                    </div>
                    <div className={styles.errorMessage}>{error}</div>
                    <button 
                      className={styles.retryButton} 
                      onClick={handleGenerateRecipe}
                    >
                      <RefreshCw size={14} /> Retry Generation
                    </button>
                  </motion.div>
                )}

                {/* VIEW 4: Recipe Overview (Panel 4) */}
                {activeView === "recipe-detail" && recipeData && !isLoading && !error && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="recipe-result"
                  >
                    <RecipePlanner 
                      recipeData={recipeData} 
                      onRefine={handleRefineRecipe}
                      isRefining={isRefining}
                      onStartCook={(steps) => setActiveCookSteps(steps)}
                    />
                  </motion.div>
                )}

                {/* VIEW 5: Saved Recipes Grid (Panel 7) */}
                {activeView === "saved" && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="saved-recipes"
                  >
                    <SavedRecipes 
                      sessions={sessions}
                      onLoadSession={handleLoadSession}
                      onDeleteSession={handleDeleteSession}
                    />
                  </motion.div>
                )}

                {/* VIEW 6: Shopping list (Panel 8) */}
                {activeView === "shopping" && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="shopping-list"
                  >
                    <ShoppingList />
                  </motion.div>
                )}

                {/* VIEW 7: Settings configurations (Panel 10) */}
                {activeView === "settings" && !isLoading && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    key="settings-page"
                  >
                    <Settings 
                      theme={theme}
                      onToggleTheme={toggleTheme}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </main>
        </>
      )}
    </div>
  );
}
