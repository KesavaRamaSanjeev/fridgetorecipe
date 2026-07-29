import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, ChefHat, Flame, Check, Plus, Minus, Info, Sparkles, Heart, HeartOff, ShoppingCart, Play 
} from "lucide-react";
import styles from "./RecipePlanner.module.css";

export default function RecipePlanner({ recipeData, onRefine, isRefining, onStartCook }) {
  const [servings, setServings] = useState(2);
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  const [refinementText, setRefinementText] = useState("");
  
  // Interactive Swaps State: { originalIngredientName: selectedReplacementName }
  const [activeSwaps, setActiveSwaps] = useState({});
  const [isSaved, setIsSaved] = useState(false);
  const [isAddedToCart, setIsAddedToCart] = useState(false);

  useEffect(() => {
    if (recipeData?.servings) {
      setServings(recipeData.servings);
    }
    // Check if current recipe is saved in localStorage history
    const saved = localStorage.getItem("recipe_planner_sessions");
    if (saved && recipeData?.recipeName) {
      try {
        const parsed = JSON.parse(saved);
        const exists = parsed.some(s => s.title === recipeData.recipeName);
        setIsSaved(exists);
      } catch (e) {}
    }
    setActiveSwaps({});
    setCheckedIngredients(new Set());
    setCheckedSteps(new Set());
  }, [recipeData]);

  if (!recipeData || Object.keys(recipeData).length === 0) {
    return null;
  }

  const baseServings = recipeData.servings || 2;
  const recipeName = recipeData.recipeName || "AI Recipe";
  const description = recipeData.description || "";
  const prepTime = recipeData.prepTime || "10 mins";
  const cookTime = recipeData.cookTime || "15 mins";
  const difficulty = recipeData.difficulty || "Easy";
  const rating = recipeData.rating || 4.7;
  const reviewsCount = recipeData.reviewsCount || 88;
  const calories = recipeData.calories || 360;
  const blocks = recipeData.blocks || [];

  const handleIngredientToggle = (index) => {
    const updated = new Set(checkedIngredients);
    if (updated.has(index)) {
      updated.delete(index);
    } else {
      updated.add(index);
    }
    setCheckedIngredients(updated);
  };

  const scaleAmount = (amount, standardAmount, unit) => {
    if (!amount) return "";
    let baseVal = standardAmount;
    if (!baseVal) {
      const parsed = parseFloat(amount);
      if (!isNaN(parsed)) {
        baseVal = parsed;
      }
    }

    if (baseVal) {
      const scaled = (baseVal / baseServings) * servings;
      const formatted = Number(scaled.toFixed(scaled % 1 === 0 ? 0 : 1));
      return `${formatted}${unit ? " " + unit : ""}`;
    }
    return `${amount}${unit ? " " + unit : ""}`;
  };

  const handleSwapChange = (originalName, val) => {
    setActiveSwaps(prev => ({
      ...prev,
      [originalName]: val === originalName ? null : val
    }));
  };

  const handleSaveToggle = () => {
    const saved = localStorage.getItem("recipe_planner_sessions");
    let list = [];
    if (saved) {
      try { list = JSON.parse(saved); } catch (e) {}
    }
    
    if (isSaved) {
      const updated = list.filter(s => s.title !== recipeName);
      localStorage.setItem("recipe_planner_sessions", JSON.stringify(updated));
      setIsSaved(false);
    } else {
      const newSession = {
        id: `recipe_${Date.now()}`,
        title: recipeName,
        data: recipeData,
        rawPrompt: recipeData.recipeName,
        timestamp: new Date().toISOString()
      };
      const updated = [newSession, ...list];
      localStorage.setItem("recipe_planner_sessions", JSON.stringify(updated));
      setIsSaved(true);
    }
  };

  const handleAddToShoppingList = () => {
    const ingredientsBlock = blocks.find(b => b.type === "checklist" && b.title.toLowerCase().includes("ingredient"));
    if (!ingredientsBlock || !ingredientsBlock.items) return;

    const saved = localStorage.getItem("shopping_list");
    let currentList = [];
    if (saved) {
      try { currentList = JSON.parse(saved); } catch (e) {}
    }

    // Format and append ingredients
    const newItems = ingredientsBlock.items.map((item, index) => {
      const originalName = typeof item === "object" ? item.name : item;
      const swappedName = activeSwaps[originalName] || originalName;
      const rawAmount = typeof item === "object" ? item.amount : "";
      const standardAmount = typeof item === "object" ? item.standardAmount : null;
      const unit = typeof item === "object" ? item.unit : "";
      
      return {
        id: `ing_${Date.now()}_${index}`,
        name: swappedName,
        quantity: scaleAmount(rawAmount, standardAmount, unit),
        checked: false
      };
    });

    localStorage.setItem("shopping_list", JSON.stringify([...newItems, ...currentList]));
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  const handleRefineSubmit = (e) => {
    e.preventDefault();
    if (!refinementText.trim() || isRefining) return;
    onRefine(refinementText);
    setRefinementText("");
  };

  // Find blocks
  const ingredientsBlock = blocks.find(b => b.type === "checklist" && b.title.toLowerCase().includes("ingredient"));
  const swapsBlock = blocks.find(b => b.type === "card" && b.swaps);
  const nutritionBlock = blocks.find(b => b.type === "chart" && b.data);
  const stepsBlock = blocks.find(b => b.type === "checklist" && (b.title.toLowerCase().includes("step") || b.title.toLowerCase().includes("direction")));

  return (
    <div className={styles.recipeWrapper}>
      {/* HEADER SECTION (Full Width) */}
      <div className={styles.topControlRow}>
        <button className={styles.backLink} onClick={() => window.location.reload()}>
          ➔ Back to Dashboard
        </button>
        <div className={styles.headerActions}>
          <button 
            onClick={handleSaveToggle} 
            className={`${styles.actionBtn} ${isSaved ? styles.savedBtnActive : ""}`}
            aria-label="Save recipe to history"
          >
            <Heart size={16} fill={isSaved ? "currentColor" : "none"} />
            <span>{isSaved ? "Saved" : "Save Recipe"}</span>
          </button>
          <button 
            onClick={handleAddToShoppingList} 
            className={styles.actionBtn}
            disabled={isAddedToCart}
          >
            <ShoppingCart size={16} />
            <span>{isAddedToCart ? "Added!" : "Add to Shopping List"}</span>
          </button>
        </div>
      </div>

      {/* MAIN LAYOUT GRID (Linear/SaaS Style) */}
      <div className={styles.layoutGrid}>
        
        {/* ROW 1 LEFT: RECIPE CARD (Span 4) */}
        <div className={`${styles.recipeCard} glass`}>
          {/* Styled banner placeholder with high aesthetics */}
          <div className={styles.bannerImagePlaceholder}>
            <ChefHat size={48} className={styles.bannerIcon} />
            <div className={styles.ratingBadge}>
              ⭐ <strong>{rating}</strong> ({reviewsCount} reviews)
            </div>
          </div>
          
          <div className={styles.heroBody}>
            <h1 className={styles.recipeTitle}>{recipeName}</h1>
            <p className={styles.recipeDesc}>{description}</p>
            
            <div className={styles.metaRow}>
              <div className={styles.metaBadge}>
                <Clock size={13} />
                <span>Prep: {prepTime}</span>
              </div>
              <div className={styles.metaBadge}>
                <Clock size={13} />
                <span>Cook: {cookTime}</span>
              </div>
              <div className={styles.metaBadge}>
                <ChefHat size={13} />
                <span>{difficulty}</span>
              </div>
            </div>

            {/* Servings control nested inside the primary recipe card */}
            <div className={styles.scalerContainerInline}>
              <span className={styles.scalerLabelInline}>Portions:</span>
              <div className={styles.scalerControlsInline}>
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  disabled={servings <= 1}
                  className={styles.scalerBtnInline}
                >
                  <Minus size={12} />
                </button>
                <span className={styles.scalerValueInline}>{servings}</span>
                <button 
                  onClick={() => setServings(servings + 1)}
                  className={styles.scalerBtnInline}
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 1 RIGHT: SMART SUBSTITUTIONS (Span 6) */}
        {swapsBlock && swapsBlock.swaps && (
          <div className={`${styles.swapsBlock} glass`}>
            <h3 className={styles.cardSectionLabel}>Smart Substitutions</h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginBottom: "8px" }}>
              Select ingredients below to swap them in your checklist.
            </p>
            <div className={styles.swapsDropdownList}>
              {swapsBlock.swaps.map((swap, index) => {
                const chosenVal = activeSwaps[swap.original] || swap.original;
                const replacements = swap.replacements || [swap.replacement];

                return (
                  <div key={index} className={styles.swapDropdownRow}>
                    <span className={styles.swapOriginalName}>{swap.original}</span>
                    <span className={styles.arrowIcon}>➔</span>
                    <div className={styles.swapSelectWrapper}>
                      <select 
                        className={styles.swapSelect}
                        value={chosenVal}
                        onChange={(e) => handleSwapChange(swap.original, e.target.value)}
                      >
                        <option value={swap.original}>{swap.original} (Original)</option>
                        {replacements.map(rep => (
                          <option key={rep} value={rep}>{rep}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ROW 2 LEFT: INGREDIENTS CHECKLIST (Span 4) */}
        {ingredientsBlock && (
          <div className={`${styles.ingredientsBlock} glass`}>
            <h3 className={styles.cardSectionLabel}>Ingredients Checklist</h3>
            <div className={styles.ingredientsList}>
              {ingredientsBlock.items?.map((item, index) => {
                const isChecked = checkedIngredients.has(index);
                const originalName = typeof item === "object" ? item.name : item;
                const swappedName = activeSwaps[originalName] || originalName;
                const rawAmount = typeof item === "object" ? item.amount : "";
                const standardAmount = typeof item === "object" ? item.standardAmount : null;
                const unit = typeof item === "object" ? item.unit : "";

                return (
                  <div 
                    key={index} 
                    className={`${styles.checkRow} ${isChecked ? styles.checkRowChecked : ""}`}
                    onClick={() => handleIngredientToggle(index)}
                  >
                    <div className={styles.checkbox}>
                      {isChecked && <Check size={12} strokeWidth={3} />}
                    </div>
                    <div className={styles.checkText}>
                      <div className={styles.ingredientRowContent}>
                        <span className={styles.ingName}>
                          {swappedName}
                          {activeSwaps[originalName] && (
                            <span className={styles.swapNotice}>
                              (Swapped)
                            </span>
                          )}
                        </span>
                        <span className={styles.ingAmount}>
                          {scaleAmount(rawAmount, standardAmount, unit)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ROW 2 RIGHT: NUTRITION BREAKDOWN (Span 6) */}
        {nutritionBlock && (
          <div className={`${styles.nutritionBlock} glass`}>
            <h3 className={styles.cardSectionLabel}>Nutrition Breakdown (per serving)</h3>
            
            <div className={styles.nutritionGrid}>
              {/* Circular Calorie tracker */}
              <div className={styles.caloriesCircleCard}>
                <div className={styles.caloriesProgressRing}>
                  <span className={styles.calValue}>{calories}</span>
                  <span className={styles.calLabel}>kcal</span>
                </div>
              </div>

              {/* Macro bars */}
              <div className={styles.gaugesContainer}>
                {nutritionBlock.data.map((item, index) => {
                  const fillPct = Math.min((item.value / 40) * 100, 100);
                  const labelColor = index === 0 ? "#16a34a" : index === 1 ? "#3b82f6" : "#f59e0b";
                  return (
                    <div key={index} className={styles.gaugeRow}>
                      <div className={styles.gaugeHeader}>
                        <span className={styles.gaugeLabel}>{item.label}</span>
                        <span className={styles.gaugeVal} style={{ color: labelColor }}>{item.value}{item.unit || ""}</span>
                      </div>
                      <div className={styles.gaugeTrack}>
                        <motion.div 
                          className={styles.gaugeFill} 
                          style={{ backgroundColor: labelColor }}
                          initial={{ width: 0 }}
                          animate={{ width: `${fillPct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ROW 3: COOKING STEPS SUMMARY (Span 10 - Full Width) */}
        {stepsBlock && (
          <div className={`${styles.stepsBlock} glass`}>
            <div className={styles.stepsBlockHeader}>
              <div>
                <h3 className={styles.cardSectionLabel}>Cooking Steps Summary</h3>
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
                  Overview of the cooking directions. Click below to start full screen Cook Mode.
                </span>
              </div>
              <button 
                className={styles.cookModeBtnInline}
                onClick={() => onStartCook(stepsBlock.items)}
              >
                <Play size={14} fill="currentColor" />
                <span>Start Interactive Cook Mode</span>
              </button>
            </div>

            <div className={styles.stepsSummaryList}>
              {stepsBlock.items.map((step, index) => (
                <div key={index} className={styles.stepSummaryItem}>
                  <span className={styles.stepNumberBadge}>{index + 1}</span>
                  <span className={styles.stepSummaryText}>{step.instruction}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refinement Query input loop (Full Width) */}
      <motion.div 
        className={styles.refinementBox}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className={styles.refinementHeader}>
          <Sparkles size={16} />
          <span>Refine this Recipe Plan</span>
        </div>
        <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", marginTop: "-6px" }}>
          Tell the AI to make changes, add side dishes, remove a specific ingredient, or adjust style.
        </p>
        <form onSubmit={handleRefineSubmit} className={styles.refinementForm}>
          <input 
            type="text" 
            placeholder="e.g. Make it low carb / Add garlic / Give a baking alternative" 
            className={styles.refinementInput}
            value={refinementText}
            onChange={(e) => setRefinementText(e.target.value)}
            disabled={isRefining}
          />
          <button 
            type="submit" 
            className={styles.refinementSubmit}
            disabled={isRefining || !refinementText.trim()}
          >
            {isRefining ? "Refining..." : "Send Request"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
