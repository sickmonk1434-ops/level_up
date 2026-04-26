"use client";

import { toggleCompletion, deleteHabit, editHabit } from "@/app/actions";
import { Check, Trash2, Edit2, X, ChevronLeft, ChevronRight } from "lucide-react";
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
}

export function HabitGrid({ habits, completions }: HabitGridProps) {
  const [, startTransition] = useTransition();
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [weekOffset, setWeekOffset] = useState(0);

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

  // Generate the dates for the currently selected week (starting on Monday)
  const today = new Date();
  today.setHours(0, 0, 0, 0); // reset time for clean date math
  
  // Helper to get local YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Find the Monday of the current week
  const currentDayOfWeek = today.getDay();
  // In JS, Sunday is 0. If it's Sunday, we go back 6 days to Monday. Otherwise, go back (currentDayOfWeek - 1)
  const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
  
  const monday = new Date(today);
  monday.setDate(today.getDate() - daysToMonday);
  
  // Apply the week offset (weekOffset = -1 means last week)
  monday.setDate(monday.getDate() + (weekOffset * 7));

  const weekDates: string[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    weekDates.push(getLocalDateString(d));
  }

  const todayStr = getLocalDateString(today);

  return (
    <div className={styles.gridContainer}>
      <div className={styles.weekControls}>
        <button 
          onClick={() => setWeekOffset(prev => prev - 1)} 
          className={styles.weekBtn}
          title="Previous Week"
        >
          <ChevronLeft size={20} />
        </button>
        <div className={styles.weekLabel}>
          {weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : `${Math.abs(weekOffset)} Weeks Ago`}
        </div>
        <button 
          onClick={() => setWeekOffset(prev => prev + 1)} 
          className={styles.weekBtn}
          disabled={weekOffset >= 0}
          title="Next Week"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className={styles.gridWrapper}>
        <div className={styles.gridHeader}>
          <div className={styles.habitColumn}>Habit</div>
          <div className={styles.datesColumn}>
            {weekDates.map((dateStr) => {
              const dateObj = new Date(dateStr);
              const dayName = daysOfWeek[dateObj.getDay()];
              const dayNum = dateObj.getDate();
              const isToday = dateStr === todayStr;
              
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
                {weekDates.map((date) => {
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
