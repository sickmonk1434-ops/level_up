"use client";

import { useState } from "react";
import { updateUserSettings } from "@/app/actions";
import { Settings, X } from "lucide-react";
import styles from "./HabitManager.module.css"; // Reuse modal styles

export function UserSettings({ currentTarget, currentGoal }: { currentTarget: number, currentGoal: number }) {
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
