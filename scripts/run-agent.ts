// scripts/run-agent.ts
import { Client } from "pg";
import type { OpenMeteoResponse } from "../src/utils/weather";

const client = new Client({
  connectionString: "postgresql://devgotchi:devgotchipassword@localhost:5432/devgotchi_db",
});

async function runDevgotchiAgent() {
  console.log("🧠 Initializing @DevgotchiBrain...");
  await client.connect();

  // 1. ดึงข้อมูลสถานะสัตว์เลี้ยงจาก DB
  const petRes = await client.query("SELECT * FROM pets LIMIT 1;");
  const pet = petRes.rows[0] ?? { level: 1, exp: 0, outfit: "default" };

  // 2. เรียกดูสภาพอากาศผ่าน API (จำลอง MCP Execution)
  let weatherText = "Normal weather";
  let isCold = false;
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=35.6895&longitude=139.6917&current_weather=true"
    );
    const data = (await res.json()) as OpenMeteoResponse;
    const temp = data.current_weather?.temperature ?? 20;
    isCold = temp < 15;
    weatherText = `Tokyo Temp: ${temp}°C`;
  } catch {
    weatherText = "Could not fetch weather";
  }

  // 3. กำหนดชุดตามอุณหภูมิ
  const currentOutfit = isCold ? "Winter Clothes ❄️" : "Normal 👕";
  await client.query("UPDATE pets SET outfit = $1 WHERE id = $2;", [
    isCold ? "winter" : "normal",
    pet.id,
  ]);

  // 4. แสดงผลตาม Persona สไตล์ Devgotchi
  console.log("\n-------------------------------------------");
  console.log(`👾 Devgotchi Status [Agent: @DevgotchiBrain]`);
  console.log(`📊 Level: ${pet.level} | EXP: ${pet.exp}/100`);
  console.log(`🌤️  Environment: ${weatherText}`);
  console.log(`👗 Outfit equipped: ${currentOutfit}`);
  console.log("💬 Pet remarks:");
  if (isCold) {
    console.log('   "Brrr! It\'s freezing outside! I put on my warm winter coat."');
  } else {
    console.log('   "Tastes like fresh commits! Keep feeding me clean TypeScript!"');
  }
  console.log("-------------------------------------------\n");

  await client.end();
}

runDevgotchiAgent().catch(console.error);