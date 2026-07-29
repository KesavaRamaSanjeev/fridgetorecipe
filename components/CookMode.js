import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, X, ArrowLeft, ArrowRight, Check, Award, HelpCircle, Keyboard, Clock } from "lucide-react";
import styles from "./CookMode.module.css";

export default function CookMode({ recipeName, steps, onExit }) {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState(new Set());
  
  // Timer settings
  const [timerSeconds, setTimerSeconds] = useState(180);
  const [timerRunning, setTimerRunning] = useState(false);

  // Return step-specific durations
  const getStepDuration = (index) => {
    const durations = [180, 120, 60, 240]; // 3:00, 2:00, 1:00, 4:00
    return durations[index % durations.length];
  };

  const formatDurationString = (index) => {
    const sec = getStepDuration(index);
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  // Reset timer on step change
  useEffect(() => {
    setTimerSeconds(getStepDuration(activeStepIndex));
    setTimerRunning(false);
  }, [activeStepIndex]);

  // Timer countdown hook
  useEffect(() => {
    let interval = null;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(s => s - 1);
      }, 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowLeft") {
        handlePrev();
      } else if (e.key === "ArrowRight") {
        if (activeStepIndex === steps.length - 1) {
          onExit();
        } else {
          handleNext();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeStepIndex, steps]);

  if (!steps || steps.length === 0) {
    return (
      <div className={styles.fullscreenOverlay}>
        <div style={{ color: "white", padding: "40px", textAlign: "center" }}>
          <h2>No cooking steps found for this recipe.</h2>
          <button onClick={onExit} className={styles.exitBtn}>Exit Cook Mode</button>
        </div>
      </div>
    );
  }

  const activeStep = steps[activeStepIndex] || {};
  const instruction = activeStep.instruction || "";
  const tip = activeStep.tip || "";

  // Split instruction into bold header and detailed description paragraph
  const sentenceParts = instruction.split(". ");
  const stepHeader = sentenceParts[0] ? sentenceParts[0] + "." : "";
  const stepDescription = sentenceParts.slice(1).join(". ") || "Follow the cooking step as indicated.";

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleNext = () => {
    if (activeStepIndex < steps.length - 1) {
      const updated = new Set(checkedSteps);
      updated.add(activeStepIndex);
      setCheckedSteps(updated);
      setActiveStepIndex(activeStepIndex + 1);
    }
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className={styles.fullscreenOverlay}>
      
      {/* HEADER SECTION (Mockup Logo & Subtitle) */}
      <header className={styles.header}>
        <div className={styles.headerTitleRow}>
          {/* Frying pan with egg icon */}
          <div className={styles.logoCircle}>🍳</div>
          <div>
            <h2 className={styles.recipeTitle}>{recipeName}</h2>
            <span className={styles.stepIndicatorHeader}>
              COOK MODE — STEP {activeStepIndex + 1} OF {steps.length}
            </span>
          </div>
        </div>
        <button onClick={onExit} className={styles.exitBtn} aria-label="Exit Cook Mode">
          <X size={14} />
          <span>Exit Cook Mode</span>
        </button>
      </header>

      {/* SPLIT VIEWPORT */}
      <div className={styles.content}>
        
        {/* LEFT COLUMN: Cooking steps list cards */}
        <div className={styles.leftColumn}>
          <h3 className={styles.sidebarTitle}>Cooking Steps</h3>
          <div className={styles.stepsList}>
            {steps.map((s, index) => {
              const isChecked = checkedSteps.has(index);
              const isActive = index === activeStepIndex;
              return (
                <div 
                  key={index} 
                  className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ""}`}
                  onClick={() => setActiveStepIndex(index)}
                >
                  <div className={`${styles.numberBadge} ${isActive ? styles.numberBadgeActive : ""}`}>
                    {index + 1}
                  </div>
                  <div className={styles.stepCardContent}>
                    <p className={styles.stepCardText}>{s.instruction.substring(0, 50)}...</p>
                    <div className={styles.stepCardMeta}>
                      <Clock size={11} />
                      <span>{formatDurationString(index)}</span>
                    </div>
                  </div>
                  {isActive && <div className={styles.activeIndicatorDot} />}
                </div>
              );
            })}
          </div>

          {/* Overall progress block */}
          <div className={styles.progressCard}>
            <div className={styles.progressCardHeader}>
              <span className={styles.progressTitle}>Overall Progress</span>
              <span className={styles.progressPct}>
                {checkedSteps.size} of {steps.length} steps completed
              </span>
            </div>
            <div className={styles.progressBarWrapper}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${(checkedSteps.size / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Keyboard shortcuts block */}
          <div className={styles.shortcutsCard}>
            <h4 className={styles.shortcutsTitle}>
              <Keyboard size={14} />
              <span>Keyboard Shortcuts</span>
            </h4>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutKey}>←</span>
              <span className={styles.shortcutDesc}>Previous step</span>
            </div>
            <div className={styles.shortcutRow}>
              <span className={styles.shortcutKey}>→</span>
              <span className={styles.shortcutDesc}>Next step</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Focus step view */}
        <div className={styles.rightColumn}>
          <div className={styles.focusContainer}>
            
            {/* Step text detail area */}
            <div className={styles.stepTextDetail}>
              <span className={styles.stepLabelBadge}>STEP {activeStepIndex + 1} OF {steps.length}</span>
              <h1 className={styles.stepHeaderMain}>{stepHeader}</h1>
              <p className={styles.stepDescParagraph}>{stepDescription}</p>

              {/* Chef's Tip Card */}
              {tip && (
                <div className={styles.tipCard}>
                  <div className={styles.tipIconBadge}>
                    <Award size={16} />
                  </div>
                  <div className={styles.tipCardBody}>
                    <h4 className={styles.tipTitle}>Chef's Tip</h4>
                    <p className={styles.tipText}>{tip}</p>
                  </div>
                </div>
              )}

              {/* Step Timer box */}
              <div className={styles.timerCard}>
                <div className={styles.timerInfo}>
                  <Clock size={16} className={styles.timerIconGreen} />
                  <div>
                    <span className={styles.timerLabelSmall}>Step Timer</span>
                    <span className={styles.timerValBig}>{formatTime(timerSeconds)}</span>
                  </div>
                </div>
                <div className={styles.timerControlsRow}>
                  <button onClick={() => setTimerRunning(!timerRunning)} className={styles.timerPlayBtn}>
                    {timerRunning ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button onClick={() => setTimerSeconds(getStepDuration(activeStepIndex))} className={styles.timerResetBtn}>
                    <RotateCcw size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Frying Pan Cooking Graphic Area */}
            <div className={styles.graphicCard}>
              <div className={styles.panGraphicWrapper}>
                {/* Burner gas flames */}
                <div className={styles.stoveBurnerFlames}>
                  <span className={styles.burnerFlame} />
                  <span className={styles.burnerFlame} />
                  <span className={styles.burnerFlame} />
                  <span className={styles.burnerFlame} />
                  <span className={styles.burnerFlame} />
                </div>
                {/* Cooking Skillet */}
                <div className={styles.skilletPanBody}>
                  <div className={styles.skilletNoodleCurls}>
                    {/* Melting butter pat */}
                    <div className={styles.meltingButterPat} />
                    <div className={styles.oilBubble1} />
                    <div className={styles.oilBubble2} />
                  </div>
                  <div className={styles.skilletPanHandle} />
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* BOTTOM CONTROL BAR */}
      <footer className={styles.footer}>
        <button 
          onClick={handlePrev} 
          disabled={activeStepIndex === 0}
          className={styles.prevBtn}
        >
          <ArrowLeft size={16} />
          <span>Previous Step</span>
        </button>

        {/* Dotted progress stepper indicator */}
        <div className={styles.stepperDotsRow}>
          {steps.map((_, index) => {
            const isCompleted = checkedSteps.has(index) || index < activeStepIndex;
            const isActive = index === activeStepIndex;
            return (
              <React.Fragment key={index}>
                <div className={`${styles.stepperDot} ${isActive ? styles.stepperDotActive : ""} ${isCompleted ? styles.stepperDotCompleted : ""}`}>
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div className={`${styles.stepperLine} ${isCompleted ? styles.stepperLineCompleted : ""}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>

        <button 
          onClick={activeStepIndex === steps.length - 1 ? onExit : handleNext} 
          className={styles.nextBtn}
        >
          <span>{activeStepIndex === steps.length - 1 ? "Finish Cooking" : "Next Step"}</span>
          <ArrowRight size={16} />
        </button>
      </footer>

    </div>
  );
}
