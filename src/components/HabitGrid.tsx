"use client";

import { toggleCompletion, deleteHabit, editHabit } from "@/app/actions";
import { Check, Trash2, Edit2, X } from "lucide-react";
import styles from "./HabitGrid.module.css";
import { useOptimistic, useTransition, useState } from "react";

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  category: string;
}

interface Completion {
  habitId: string;
  date: string;
  completed: number;
}

interface HabitGridProps {
  habits: Habit[];
  completions: Completion[];
  dates: string[];
}

export function HabitGrid({ habits, completions, dates }: HabitGridProps) {
  const [, startTransition] = useTransition();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const [optimisticCompletions, addOptimisticCompletion] = useOptimistic(
    completions,
    (state, newCompletion: { habitId: string; date: string; completed: number }) => {
      const existingIndex = state.findIndex(
        (c) => c.habitId === newCompletion.habitId && c.date === newCompletion.date
      );
      if (existingIndex >= 0) {
        const newState = [...state];
        newState[existingIndex] = { ...newState[existingIndex], completed: newCompletion.completed };
        return newState;
      }
      return [...state, newCompletion];
    }
  );

  function handleToggle(habitId: string, date: string, isCompleted: boolean) {
    const newStatus = isCompleted ? 0 : 1;
    
    startTransition(() => {
      addOptimisticCompletion({ habitId, date, completed: newStatus });
      toggleCompletion(habitId, date, isCompleted);
    });
  }

  function handleDelete(habitId: string) {
    if (confirm("Are you sure you want to delete this habit?")) {
      startTransition(() => {
        deleteHabit(habitId);
      });
    }
  }

  async function handleEditSubmit(formData: FormData) {
    await editHabit(formData);
    setEditingHabit(null);
  }

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridHeader}>
        <div className={styles.habitColumn}>Habit</div>
        <div className={styles.datesColumn}>
          {dates.map((dateStr) => {
            const dateObj = new Date(dateStr);
            const dayName = daysOfWeek[dateObj.getDay()];
            const dayNum = dateObj.getDate();
            const isToday = dateStr === dates[dates.length - 1];
            
            return (
              <div key={dateStr} className={`${styles.dateHeader} ${isToday ? styles.today : ''}`}>
                <span className={styles.dayName}>{dayName}</span>
                <span className={styles.dayNum}>{dayNum}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.gridBody}>
        {habits.map((habit) => (
          <div key={habit.id} className={styles.habitRow}>
            <div className={styles.habitInfo}>
              <div className={styles.habitEmoji} style={{ backgroundColor: `${habit.color}20`, border: `1px solid ${habit.color}40` }}>
                {habit.emoji}
              </div>
              <div className={styles.habitText}>
                <div className={styles.habitName}>{habit.name}</div>
                <div className={styles.habitCategory}>{habit.category}</div>
              </div>
              <div className={styles.actionButtons}>
                <button onClick={() => setEditingHabit(habit)} className={styles.editBtn}>
                  <Edit2 size={16} />
                </button>
                <button onClick={() => handleDelete(habit.id)} className={styles.deleteBtn}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className={styles.datesColumn}>
              {dates.map((date) => {
                const isCompleted = optimisticCompletions.some(
                  (c) => c.habitId === habit.id && c.date === date && c.completed === 1
                );
                
                return (
                  <button
                    key={`${habit.id}-${date}`}
                    onClick={() => handleToggle(habit.id, date, isCompleted)}
                    className={`${styles.cellBtn} ${isCompleted ? styles.completed : ''}`}
                    style={isCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                  >
                    {isCompleted && <Check size={14} strokeWidth={3} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {editingHabit && (
        <div className={styles.overlay}>
          <div className={`${styles.modal} glass`}>
            <div className={styles.modalHeader}>
              <h2>Edit Habit</h2>
              <button onClick={() => setEditingHabit(null)} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>
            
            <form action={handleEditSubmit} className={styles.form}>
              <input type="hidden" name="id" value={editingHabit.id} />
              <div className={styles.formGroup}>
                <label htmlFor="name">Habit Name</label>
                <input type="text" id="name" name="name" required defaultValue={editingHabit.name} />
              </div>
              
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label htmlFor="emoji">Emoji</label>
                  <input type="text" id="emoji" name="emoji" maxLength={2} defaultValue={editingHabit.emoji} />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="color">Color</label>
                  <input type="color" id="color" name="color" defaultValue={editingHabit.color} />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <select id="category" name="category" defaultValue={editingHabit.category}>
                  <option value="Health">Health</option>
                  <option value="Productivity">Productivity</option>
                  <option value="Mindfulness">Mindfulness</option>
                  <option value="Learning">Learning</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Save Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
