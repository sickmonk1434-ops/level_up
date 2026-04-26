import { getServerSession } from "next-auth";
import { getHabits, getCompletions, initDb, getUserSettings, getWeights } from "./actions";
import { HabitManager } from "@/components/HabitManager";
import { HabitGrid } from "@/components/HabitGrid";
import { AuthButtons } from "@/components/AuthButtons";
import { UserSettings } from "@/components/UserSettings";
import { WeightTracker } from "@/components/WeightTracker";
import styles from "./page.module.css";
import { Flame, CheckCircle, TrendingUp, Scale } from "lucide-react";
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
  const settings = await getUserSettings();
  const dailyGoal = settings?.dailyGoal || 7;
  const targetWeeks = settings?.targetWeeks || 4;
  const heightCm = settings?.height || 170;
  
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
  const weightLogs = await getWeights(formattedStart90, formattedToday);
  const latestWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;

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

  // 4. Global Streak (Consecutive days hitting the dailyGoal)
  const calculateGlobalStreak = () => {
    let streak = 0;
    let checkDate = new Date(today);
    
    // Group completions by date
    const completionsByDate: Record<string, number> = {};
    allCompletions.forEach((c: any) => {
      if (c.completed) {
        completionsByDate[c.date] = (completionsByDate[c.date] || 0) + 1;
      }
    });

    const todayStr = getLocalDateString(checkDate);
    // If goal not met today, start from yesterday
    if ((completionsByDate[todayStr] || 0) < dailyGoal) {
      checkDate.setDate(checkDate.getDate() - 1);
    }

    while (true) {
      const dateStr = getLocalDateString(checkDate);
      if ((completionsByDate[dateStr] || 0) >= dailyGoal) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak;
  };

  const globalStreak = calculateGlobalStreak();

  // 5. Global Week Progress (Weeks hitting 7/7 days of dailyGoal)
  const calculateGlobalWeekProgress = () => {
    let perfectWeeks = 0;
    
    // Find the Monday of the current week
    const currentDayOfWeek = today.getDay();
    const daysToMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const actualCurrentMonday = new Date(today);
    actualCurrentMonday.setDate(today.getDate() - daysToMonday);

    // Group completions by date
    const completionsByDate: Record<string, number> = {};
    allCompletions.forEach((c: any) => {
      if (c.completed) {
        completionsByDate[c.date] = (completionsByDate[c.date] || 0) + 1;
      }
    });

    for (let i = 1; i <= 52; i++) {
      let perfect = true;
      for (let j = 0; j < 7; j++) {
        const d = new Date(actualCurrentMonday);
        d.setDate(actualCurrentMonday.getDate() - (i * 7) + j);
        if ((completionsByDate[getLocalDateString(d)] || 0) < dailyGoal) {
          perfect = false;
          break;
        }
      }
      if (perfect) perfectWeeks++;
      else break;
    }
    return perfectWeeks;
  };

  const perfectWeeksCount = calculateGlobalWeekProgress();

  // 6. BMI Calculation
  const heightM = heightCm / 100;
  const bmi = latestWeight && heightCm ? (latestWeight / (heightM * heightM)).toFixed(1) : null;
  
  const getBmiCategory = (val: number) => {
    if (val < 18.5) return { label: "Underweight", color: "#60a5fa" };
    if (val < 25) return { label: "Normal", color: "#10b981" };
    if (val < 30) return { label: "Overweight", color: "#f59e0b" };
    return { label: "Obese", color: "#ef4444" };
  };
  
  const bmiInfo = bmi ? getBmiCategory(parseFloat(bmi)) : null;

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.greeting}>Welcome back, {session.user?.name?.split(" ")[0] || "User"}</h1>
          <p className={styles.subtitle}>Let's keep the momentum going.</p>
        </div>
        <div className={styles.headerActions}>
          <WeightTracker latestWeight={latestWeight} />
          <UserSettings currentTarget={targetWeeks} currentGoal={dailyGoal} currentHeight={heightCm} />
          <AuthButtons session={session} />
        </div>
      </header>

      <section className={styles.statsRow}>
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--danger)' }}>
            <Flame size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Global Streak</p>
            <h3>{globalStreak} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>days</span></h3>
          </div>
        </div>
        
        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <CheckCircle size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Target Progress</p>
            <h3>{perfectWeeksCount} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>/ {targetWeeks} weeks</span></h3>
          </div>
        </div>

        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(139, 92, 246, 0.2)', color: 'var(--primary)' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Daily Goal</p>
            <h3>{todayCompletions} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>/ {dailyGoal} habits</span></h3>
          </div>
        </div>

        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--success)' }}>
            <Scale size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>Current Weight</p>
            <h3>{latestWeight ? latestWeight : '--'} <span style={{fontSize: '1rem', color: '#a3a3a3'}}>KG</span></h3>
          </div>
        </div>

        <div className={`${styles.statCard} glass`}>
          <div className={styles.statIcon} style={{ background: bmiInfo ? `${bmiInfo.color}20` : 'rgba(255, 255, 255, 0.1)', color: bmiInfo ? bmiInfo.color : 'white' }}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <p>BMI Index</p>
            <h3>{bmi ? bmi : '--'} <span style={{fontSize: '0.8rem', color: bmiInfo ? bmiInfo.color : '#a3a3a3', marginLeft: '0.5rem'}}>{bmiInfo?.label}</span></h3>
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
