import React from "react";
import { motion } from "framer-motion";
import { Clock, ChefHat, Flame, Trash2, ArrowRight } from "lucide-react";
import styles from "./SavedRecipes.module.css";

export default function SavedRecipes({ sessions, onLoadSession, onDeleteSession }) {
  if (sessions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>🍳</div>
        <h2>No Saved Recipes Yet</h2>
        <p>Enter ingredients in the dashboard and save a recipe to see it here.</p>
      </div>
    );
  }

  // Predefined food gradient backgrounds for cards to look premium
  const gradients = [
    "linear-gradient(135deg, #f59e0b, #ec4899)",
    "linear-gradient(135deg, #10b981, #3b82f6)",
    "linear-gradient(135deg, #6366f1, #8b5cf6)",
    "linear-gradient(135deg, #ef4444, #f59e0b)",
  ];

  return (
    <div className={styles.container}>
      <h1 className={styles.pageTitle}>Saved Recipes</h1>
      <p className={styles.pageSubtitle}>Your curated collection of AI-crafted culinary creations.</p>

      <div className={styles.grid}>
        {sessions.map((session, index) => {
          const recipe = session.data || {};
          const prepTime = recipe.prepTime || "15 mins";
          const difficulty = recipe.difficulty || "Easy";
          const calories = recipe.calories || 350;
          const bgGradient = gradients[index % gradients.length];

          return (
            <motion.div 
              key={session.id} 
              className={`${styles.card} glass`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
            >
              {/* Card Image Placeholder with Food Gradient */}
              <div className={styles.cardHeader} style={{ background: bgGradient }}>
                <span className={styles.cardEmoji}>🍳</span>
                <span className={styles.cardDifficulty}>{difficulty}</span>
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{recipe.recipeName || session.title}</h3>
                <p className={styles.cardDesc}>{recipe.description || "A custom generated recipe."}</p>
                
                <div className={styles.metaRow}>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{prepTime}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Flame size={14} />
                    <span>{calories} kcal</span>
                  </div>
                </div>

                <div className={styles.actions}>
                  <button 
                    onClick={() => onLoadSession(session)} 
                    className={styles.viewBtn}
                  >
                    <span>View Details</span>
                    <ArrowRight size={14} />
                  </button>
                  <button 
                    onClick={(e) => onDeleteSession(e, session.id)} 
                    className={styles.deleteBtn}
                    aria-label="Delete recipe"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
