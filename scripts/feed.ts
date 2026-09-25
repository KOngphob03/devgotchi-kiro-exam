// scripts/feed.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { calculateLevel } from "../src/utils/pet-logic";

const client = new Client({
  connectionString: "postgresql://devgotchi:devgotchipassword@localhost:5432/devgotchi_db",
});

// รหัสสี ANSI
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

// ฟังก์ชันสร้างหลอด Progress Bar
function renderProgressBar(current: number, max: number = 100, length: number = 20): string {
  const filledLength = Math.round((current / max) * length);
  const emptyLength = Math.max(0, length - filledLength);
  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(emptyLength);
  return `[${C.green}${filled}${C.dim}${empty}${C.reset}] ${C.bright}${current}/${max} EXP${C.reset}`;
}

async function main() {
  await client.connect();

  console.log(`\n${C.yellow}🍖 [Hook Triggered] Feeding Devgotchi with fresh commit...${C.reset}`);

  // 1. ดึงข้อมูลสัตว์เลี้ยงตัวแรก
  const res = await client.query("SELECT * FROM pets LIMIT 1;");

  if (res.rows.length === 0) {
    await client.query("INSERT INTO pets (name, level, exp) VALUES ('Devgotchi', 1, 50);");
    console.log(`🐣 Hatched a new Devgotchi! ${C.bright}Level 1${C.reset}`);
    console.log(`   Growth: ${renderProgressBar(50, 100)}\n`);
  } else {
    const current = res.rows[0];
    const updated = calculateLevel(current.level, current.exp, 50);

    // 2. อัปเดตข้อมูลลง PostgreSQL
    await client.query(
      "UPDATE pets SET level = $1, exp = $2, updated_at = NOW() WHERE id = $3;",
      [updated.level, updated.exp, current.id]
    );

    console.log(`✨ Devgotchi ate your commit!`);
    console.log(`   Level : ${C.bright}${C.yellow}LVL ${updated.level}${C.reset}`);
    console.log(`   EXP   : ${renderProgressBar(updated.exp, 100)}`);

    if (updated.level > current.level) {
      console.log(`\n${C.magenta}🎉 LEVEL UP! Devgotchi reached Level ${updated.level}! 🚀${C.reset}`);
    }
    console.log("");
  }

  await client.end();
}

main().catch(console.error);