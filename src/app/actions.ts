"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function initDb() {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      emoji TEXT,
      color TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      UNIQUE(habitId, date)
    );
  `);
}

export async function getHabits() {
  const session = await getServerSession();
  if (!session?.user?.email) return [];

  const userId = session.user.email; // Using email as user identifier for simplicity
  
  const result = await db.execute({
    sql: "SELECT * FROM habits WHERE userId = ? ORDER BY createdAt DESC",
    args: [userId]
  });

  return result.rows as any;
}

export async function addHabit(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const name = formData.get("name") as string;
  const emoji = formData.get("emoji") as string;
  const color = formData.get("color") as string;
  const category = formData.get("category") as string;
  const userId = session.user.email;
  const id = crypto.randomUUID();

  await db.execute({
    sql: "INSERT INTO habits (id, userId, name, category, emoji, color) VALUES (?, ?, ?, ?, ?, ?)",
    args: [id, userId, name, category, emoji, color]
  });

  revalidatePath("/");
}

export async function toggleCompletion(habitId: string, date: string, currentStatus: boolean) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  const newStatus = currentStatus ? 0 : 1;
  const id = crypto.randomUUID();

  // Upsert pattern
  await db.execute({
    sql: `
      INSERT INTO completions (id, habitId, date, completed) 
      VALUES (?, ?, ?, ?)
      ON CONFLICT(habitId, date) DO UPDATE SET completed = excluded.completed
    `,
    args: [id, habitId, date, newStatus]
  });

  revalidatePath("/");
}

export async function getCompletions(startDate: string, endDate: string) {
  const session = await getServerSession();
  if (!session?.user?.email) return [];
  const userId = session.user.email;

  const result = await db.execute({
    sql: `
      SELECT c.* FROM completions c
      JOIN habits h ON c.habitId = h.id
      WHERE h.userId = ? AND c.date >= ? AND c.date <= ?
    `,
    args: [userId, startDate, endDate]
  });

  return result.rows as any;
}

export async function deleteHabit(habitId: string) {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Unauthorized");

  await db.execute({
    sql: "DELETE FROM habits WHERE id = ? AND userId = ?",
    args: [habitId, session.user.email]
  });
  
  await db.execute({
    sql: "DELETE FROM completions WHERE habitId = ?",
    args: [habitId]
  });

  revalidatePath("/");
}
