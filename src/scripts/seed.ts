/**
 * Seed script — populates the database with demo users and financial records.
 * Run with:  npm run seed
 */
import "dotenv/config";
import { connectDB, disconnectDB } from "../config/database";
import { User } from "../models/user.model";
import { FinancialRecord } from "../models/record.model";
import { Role, TransactionType, UserStatus } from "../types";

// ── Demo users ───────────────────────────────────────────────────────────────

const USERS = [
  {
    name: "Alice Admin",
    email: "admin@finance.dev",
    password: "Admin@1234",
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Bob Analyst",
    email: "analyst@finance.dev",
    password: "Analyst@1234",
    role: Role.ANALYST,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Carol Viewer",
    email: "viewer@finance.dev",
    password: "Viewer@1234",
    role: Role.VIEWER,
    status: UserStatus.ACTIVE,
  },
];

// ── Record generation helpers ────────────────────────────────────────────────

const INCOME_CATS = ["salary", "freelance", "investment"] as const;
const EXPENSE_CATS = [
  "rent",
  "utilities",
  "groceries",
  "healthcare",
  "entertainment",
  "transport",
] as const;

function rand(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function randDate(daysBack: number) {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await connectDB();
  console.log("\n🌱  Seeding database…\n");

  await User.deleteMany({});
  await FinancialRecord.deleteMany({});

  const users = await User.create(USERS);
  console.log(`👤  Created ${users.length} users`);

  const records: object[] = [];
  for (const user of users) {
    if (user.role === Role.VIEWER) continue; // viewers cannot create records
    for (let i = 0; i < 50; i++) {
      const isIncome = Math.random() > 0.45;
      const type = isIncome ? TransactionType.INCOME : TransactionType.EXPENSE;
      records.push({
        amount: isIncome ? rand(500, 12000) : rand(20, 3500),
        type,
        category: isIncome ? pick(INCOME_CATS) : pick(EXPENSE_CATS),
        date: randDate(180),
        notes: `${type} entry #${i + 1} for ${user.name}`,
        createdBy: user._id,
        isDeleted: false,
      });
    }
  }

  await FinancialRecord.insertMany(records);
  console.log(`Created ${records.length} financial records`);

  console.log("\nSeed complete!\n");
  console.log("─────────────────────────────────────────────");
  console.log("  Demo credentials");
  console.log("  Admin   → admin@finance.dev   / Admin@1234");
  console.log("  Analyst → analyst@finance.dev / Analyst@1234");
  console.log("  Viewer  → viewer@finance.dev  / Viewer@1234");
  console.log("─────────────────────────────────────────────\n");

  await disconnectDB();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
