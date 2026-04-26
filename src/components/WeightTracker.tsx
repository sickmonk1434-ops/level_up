"use client";

import { useState } from "react";
import { logWeight } from "@/app/actions";
import { Scale, Save, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./HabitManager.module.css"; // Reuse modal styles for consistency

export function WeightTracker({ latestWeight }: { latestWeight?: number }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const today = new Date().toISOString().split('T')[0];

  async function handleSubmit(formData: FormData) {
    await logWeight(formData);
    setIsOpen(false);
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={styles.settingsBtn}
        style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.2)' }}
        title="Log Weight"
      >
        <Scale size={20} />
      </button>

      {isOpen && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <h2>Daily Weight (KG)</h2>
              <button onClick={() => setIsOpen(false)} className={styles.closeBtn}>
                <Save size={20} />
              </button>
            </div>
            
            <form action={handleSubmit} className={styles.form}>
              <input type="hidden" name="date" value={today} />
              
              <div className={styles.formGroup}>
                <label htmlFor="weight">Weight (KG)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input 
                    type="number" 
                    id="weight" 
                    name="weight" 
                    step="0.1" 
                    required 
                    autoFocus
                    defaultValue={latestWeight || 70.0} 
                    style={{ fontSize: '2rem', textAlign: 'center', padding: '1rem' }}
                  />
                  <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#a3a3a3' }}>KG</span>
                </div>
                <p className={styles.formHint}>Track your progress daily for the best results.</p>
              </div>

              <button type="submit" className={styles.submitBtn} style={{ background: 'var(--success)' }}>
                Log Weight
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
