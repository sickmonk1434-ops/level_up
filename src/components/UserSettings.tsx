"use client";

import { useState } from "react";
import { updateUserSettings } from "@/app/actions";
import { Settings, X } from "lucide-react";
import styles from "./HabitManager.module.css"; // Reuse modal styles

export function UserSettings({ currentTarget, currentGoal, currentHeight, currentTargetWeight }: { currentTarget: number, currentGoal: number, currentHeight: number, currentTargetWeight: number }) {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await updateUserSettings(formData);
    setIsOpen(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.settingsBtn}
        title="Settings"
      >
        <Settings size={20} />
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <h2>Goal Settings</h2>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form action={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="dailyGoal">Daily Habit Goal</label>
                <input type="number" id="dailyGoal" name="dailyGoal" min="1" max="20" defaultValue={currentGoal} />
                <p className={styles.formHint}>How many habits do you want to complete each day?</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="height">Height (CM)</label>
                <input type="number" id="height" name="height" step="0.1" min="50" max="250" defaultValue={currentHeight || 170} />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="targetWeight">Target Weight (KG)</label>
                <input type="number" id="targetWeight" name="targetWeight" step="0.1" min="30" max="300" defaultValue={currentTargetWeight || 70} />
                <p className={styles.formHint}>Your goal weight to reach.</p>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="targetWeeks">Target Duration (Weeks)</label>
                <input type="number" id="targetWeeks" name="targetWeeks" min="1" max="52" defaultValue={currentTarget} />
                <p className={styles.formHint}>How many weeks do you want to maintain this streak?</p>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Save Settings
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
