import { getServerSession } from "next-auth";
import { getHabits, getCompletions, initDb } from "./actions";
import { HabitManager } from "@/components/HabitManager";
import { HabitGrid } from "@/components/HabitGrid";
import { AuthButtons } from "@/components/AuthButtons";
import styles from "./page.module.css";
import { Flame, CheckCircle, TrendingUp } from "lucide-react";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  // Try to initialize the DB automatically on load (in a real app, do this securely)
  try {
    await initDb();
  } catch (e) {
    console.error("DB Init error", e);
  }

  const session = await getServerSession(authOptions);

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
  
  // Helper to get local YYYY-MM-DD
  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calculate date range for stats and client history (90 days)
  const today = new Date();
  const formattedToday = getLocalDateString(today);
  
  const ninetyDaysAgo = new Date(today);
  ninetyDaysAgo.setDate(today.getDate() - 89);
  const formattedStart90 = getLocalDateString(ninetyDaysAgo);
  
  const thirtyDaysInFuture = new Date(today);
  thirtyDaysInFuture.setDate(today.getDate() + 30);
  const formattedEnd = getLocalDateString(thirtyDaysInFuture);
  
  // Fetch full 90 days for stats, and up to 30 days in future to support future checks
  const allCompletions = await getCompletions(formattedStart90, formattedEnd);

  // Calculate Goals
  // 1. Daily Completions (today)
  const todayCompletions = allCompletions.filter((c: any) => c.date === formattedToday && c.completed).length;
  
  // 2. Weekly Completions (last 7 days)
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);
  const formattedStart7 = getLocalDateString(sevenDaysAgo);
  const weeklyCompletions = allCompletions.filter((c: any) => c.date >= formattedStart7 && c.date <= formattedToday && c.completed).length;
  
  // 3. Monthly Completion Rate (last 30 days)
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);
  const formattedStart30 = getLocalDateString(thirtyDaysAgo);
  const monthlyCompletions = allCompletions.filter((c: any) => c.date >= formattedStart30 && c.date <= formattedToday && c.completed);
  
  const monthlyTotalPossible = habits.length * 30;
  const monthlyCompleted = monthlyCompletions.length;
  const monthlyRate = habits.length > 0 ? Math.round((monthlyCompleted / monthlyTotalPossible) * 100) : 0;

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
            <p>Daily Goal</p>
            <h3>{todayCompletions} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>/ 7</span></h3>
          </div>
        </div>
        
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Weekly Goal</p>
            <h3>{weeklyCompletions} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>/ 55</span></h3>
          </div>
        </div>

        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Monthly Goal</p>
            <h3>{monthlyRate}% <span style={{fontSize: '1rem', color: '#a3a3a3'}}>/ 90%</span></h3>
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
          <HabitGrid habits={habits} completions={allCompletions} />
        )}
      </section>

      <HabitManager />
    </main>
  );
}
