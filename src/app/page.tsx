import { getServerSession } from "next-auth";
import { getHabits, getCompletions, initDb } from "./actions";
import { HabitManager } from "@/components/HabitManager";
import { HabitGrid } from "@/components/HabitGrid";
import { AuthButtons } from "@/components/AuthButtons";
import styles from "./page.module.css";
import { Flame, CheckCircle, TrendingUp } from "lucide-react";

export default async function Home() {
  // Try to initialize the DB automatically on load (in a real app, do this securely)
  try {
    await initDb();
  } catch (e) {
    console.error("DB Init error", e);
  }

  const session = await getServerSession();

  if (!session) {
    return (
      <main className={styles.unauthMain}>
        <div className={`${styles.heroCard} glass`}>
          <h1>Level Up Your Life</h1>
          <p>Track your daily habits, build streaks, and achieve your goals with our premium gamified tracker.</p>
          <AuthButtons />
        </div>
      </main>
    );
  }

  const habits = await getHabits();
  
  // Calculate date range (last 14 days for the grid)
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 13);
  
  const formattedStart = startDate.toISOString().split("T")[0];
  const formattedEnd = today.toISOString().split("T")[0];
  
  const completions = await getCompletions(formattedStart, formattedEnd);

  // Generate date array for the last 14 days
  const dates = [];
  for (let i = 0; i <= 13; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  // Calculate some simple stats
  const totalCompleted = completions.filter((c: any) => c.completed).length;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, {session.user?.name?.split(" ")[0] || "User"}</h1>
          <p className={styles.subtitle}>Let's keep the momentum going.</p>
        </div>
        <AuthButtons session={session} />
      </header>

      <section className={styles.statsRow}>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <Flame size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Active Streaks</p>
            <h3>{habits.length > 0 ? '🔥 On Fire' : 'No Habits'}</h3>
          </div>
        </div>
        
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>14-Day Completions</p>
            <h3>{totalCompleted}</h3>
          </div>
        </div>

        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Completion Rate</p>
            <h3>{habits.length > 0 ? Math.round((totalCompleted / (habits.length * 14)) * 100) : 0}%</h3>
          </div>
        </div>
      </section>

      <section className={`${styles.trackerSection} glass`}>
        <div className={styles.trackerHeader}>
          <h2>Habit Matrix</h2>
        </div>
        
        {habits.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You haven't tracked any habits yet. Click the + button to start leveling up!</p>
          </div>
        ) : (
          <HabitGrid habits={habits} completions={completions} dates={dates} />
        )}
      </section>

      <HabitManager />
    </main>
  );
}
