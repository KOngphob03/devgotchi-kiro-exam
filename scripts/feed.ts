// scripts/feed.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { Client } from "pg";
import { calculateLevel } from "../src/utils/pet-logic";

const client = new Client({
  connectionString: "postgresql://devgotchi:devgotchipassword@localhost:5432/devgotchi_db",
});

async function main() {
  await client.connect();
  const db = drizzle(client);

  console.log("🍖 [Hook Triggered] Feeding Devgotchi...");

  // ดึงค่าสัตว์เลี้ยงตัวแรก หรือสร้างใหม่ถ้ายังไม่มี
  const res = await client.query("SELECT * FROM pets LIMIT 1;");
  
  if (res.rows.length === 0) {
    await client.query("INSERT INTO pets (name, level, exp) VALUES ('Devgotchi', 1, 50);");
    console.log("🐣 Hatched a new Devgotchi! Level 1 (EXP: 50/100)");
  } else {
    const current = res.rows[0];
    const updated = calculateLevel(current.level, current.exp, 50);
    
    await client.query(
      "UPDATE pets SET level = $1, exp = $2, updated_at = NOW() WHERE id = $3;",
      [updated.level, updated.exp, current.id]
    );

    console.log(`✨ Devgotchi ate your commit! Level: ${updated.level} | EXP: ${updated.exp}/100`);
    if (updated.level > current.level) {
      console.log(`🎉 LEVEL UP! Devgotchi reached Level ${updated.level}!`);
    }
  }

  await client.end();
}

main().catch(console.error);