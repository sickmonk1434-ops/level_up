"use client";

import { toggleCompletion, deleteHabit } from "@/app/actions";
import { Check, Trash2 } from "lucide-react";
import styles from "./HabitGrid.module.css";
import { useTransition } from "react";

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
  const [isPending, startTransition] = useTransition();

  function handleToggle(habitId: string, date: string, isCompleted: boolean) {
    startTransition(() => {
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
              <div>
                <div className={styles.habitName}>{habit.name}</div>
                <div className={styles.habitCategory}>{habit.category}</div>
              </div>
              <button onClick={() => handleDelete(habit.id)} className={styles.deleteBtn}>
                <Trash2 size={16} />
              </button>
            </div>
            
            <div className={styles.datesColumn}>
              {dates.map((date) => {
                const isCompleted = completions.some(
                  (c) => c.habitId === habit.id && c.date === date && c.completed === 1
                );
                
                return (
                  <button
                    key={`${habit.id}-${date}`}
                    onClick={() => handleToggle(habit.id, date, isCompleted)}
                    className={`${styles.cellBtn} ${isCompleted ? styles.completed : ''}`}
                    style={isCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                    disabled={isPending}
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
  );
}
