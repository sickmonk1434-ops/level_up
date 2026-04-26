"use client";

import { useState } from "react";
import { addHabit } from "@/app/actions";
import { Plus, X } from "lucide-react";
import styles from "./HabitManager.module.css";

export function HabitManager() {
  const [isOpen, setIsOpen] = useState(false);

  async function handleSubmit(formData: FormData) {
    await addHabit(formData);
    setIsOpen(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.fab}
      >
        <Plus size={24} />
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <h2>New Habit</h2>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form action={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Habit Name</label>
                <input type="text" id="name" name="name" required placeholder="e.g. Read 10 pages" />
              </div>
              
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="emoji">Emoji</label>
                  <input type="text" id="emoji" name="emoji" maxLength={2} defaultValue="📚" />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="color">Color</label>
                  <input type="color" id="color" name="color" defaultValue="#8b5cf6" />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select id="category" name="category">
                  <option value="Health">Health</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Learning">Learning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="targetWeeks">Target (Weeks)</label>
                <input type="number" id="targetWeeks" name="targetWeeks" min="1" max="52" defaultValue="4" />
                <p className={styles.formHint}>Achieve 7/7 days each week to complete this target.</p>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Create Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
