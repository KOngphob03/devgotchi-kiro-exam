// scripts/run-agent.ts
import { Client } from "pg";
import type { OpenMeteoResponse } from "../src/utils/weather";

const client = new Client({
  connectionString: "postgresql://devgotchi:devgotchipassword@localhost:5432/devgotchi_db",
});

// ============================================================
// ANSI colors & helpers
// ============================================================
const C = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",
  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  brightRed: "\x1b[91m",
  brightGreen: "\x1b[92m",
  brightYellow: "\x1b[93m",
  brightBlue: "\x1b[94m",
  brightMagenta: "\x1b[95m",
  brightCyan: "\x1b[96m",
  bgMagenta: "\x1b[45m",
  bgCyan: "\x1b[46m",
};

/** ลบ ANSI escape code ทั้งหมดออก เพื่อวัดความกว้างจริงของข้อความ */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, "");
}

/**
 * คำนวณความกว้างที่แสดงผลจริงบน terminal
 * emoji / ตัวอักษรกว้าง (CJK, symbol บางตัว) กิน 2 คอลัมน์แทนที่จะเป็น 1
 */
function visibleWidth(str: string): number {
  const clean = stripAnsi(str);
  let width = 0;
  for (const ch of clean) {
    const code = ch.codePointAt(0) ?? 0;
    const isWide =
      (code >= 0x1100 && code <= 0x115f) || // Hangul Jamo
      (code >= 0x2e80 && code <= 0xa4cf) || // CJK, Radicals
      (code >= 0xac00 && code <= 0xd7a3) || // Hangul Syllables
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility
      (code >= 0xff00 && code <= 0xff60) || // Fullwidth Forms
      (code >= 0x1f300 && code <= 0x1faff) || // Emoji / symbols
      (code >= 0x2600 && code <= 0x27bf); // Misc symbols / dingbats
    width += isWide ? 2 : 1;
  }
  return width;
}

/** เติมช่องว่างด้านขวาให้ครบความกว้างที่ต้องการ โดยนับความกว้างจริงบนจอ (รองรับ ANSI + emoji) */
function padVisible(str: string, width: number): string {
  const gap = Math.max(0, width - visibleWidth(str));
  return str + " ".repeat(gap);
}

/** จัดข้อความให้อยู่กึ่งกลางภายในความกว้างที่กำหนด */
function centerVisible(str: string, width: number): string {
  const gap = Math.max(0, width - visibleWidth(str));
  const left = Math.floor(gap / 2);
  const right = gap - left;
  return " ".repeat(left) + str + " ".repeat(right);
}

const BOX_WIDTH = 71; // ความกว้างภายในกรอบ (ไม่รวมเส้นขอบซ้าย/ขวา)

function boxLine(content: string): void {
  console.log(`${C.brightCyan}║${C.reset} ${padVisible(content, BOX_WIDTH)} ${C.brightCyan}║${C.reset}`);
}

function boxTop(): void {
  console.log(`${C.brightCyan}╔${"═".repeat(BOX_WIDTH + 2)}╗${C.reset}`);
}

function boxDivider(): void {
  console.log(`${C.brightCyan}╠${"═".repeat(BOX_WIDTH + 2)}╣${C.reset}`);
}

function boxBottom(): void {
  console.log(`${C.brightCyan}╚${"═".repeat(BOX_WIDTH + 2)}╝${C.reset}`);
}

function boxBlank(): void {
  boxLine("");
}

/** ตัดข้อความยาวให้พอดีความกว้างกรอบ แล้วพิมพ์ทีละบรรทัดพร้อม indent ต่อเนื่อง */
function boxWrapped(text: string, indent: string = "  ", wrapColor: string = ""): void {
  const words = text.split(" ");
  const maxWidth = BOX_WIDTH - visibleWidth(indent);
  let line = "";

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (visibleWidth(candidate) > maxWidth && line) {
      boxLine(`${indent}${wrapColor}${line}${line ? C.reset : ""}`);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) {
    boxLine(`${indent}${wrapColor}${line}${C.reset}`);
  }
}

/** progress bar สำหรับแสดง EXP */
function renderProgressBar(current: number, max: number = 100, length: number = 26): string {
  const ratio = Math.max(0, Math.min(1, current / max));
  const filledLength = Math.round(ratio * length);
  const emptyLength = Math.max(0, length - filledLength);
  const filled = "█".repeat(filledLength);
  const empty = "░".repeat(emptyLength);
  return `${C.brightGreen}${filled}${C.dim}${empty}${C.reset} ${C.bright}${current}/${max} EXP${C.reset}`;
}

/** จัด rank ตามเลเวลปัจจุบันของ Devgotchi */
function rankForLevel(level: number): string {
  if (level >= 50) return "Legendary Architect";
  if (level >= 30) return "Senior Engineer";
  if (level >= 20) return "Full-Stack Wizard";
  if (level >= 10) return "Code Journeyman";
  if (level >= 5) return "Code Apprentice";
  return "Junior Hatchling";
}

/** หน่วงเวลาสั้นๆ เพื่อสร้าง animation ระหว่างบูตระบบ */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** จำลอง boot sequence แบบพิมพ์ทีละบรรทัดให้ดูมีชีวิตชีวา */
async function bootSequence(): Promise<void> {
  const steps = [
    "Establishing neural link to workspace...",
    "Authenticating agent credentials [@DevgotchiBrain]...",
    "Syncing PostgreSQL telemetry channel...",
    "Calibrating MCP weather sensors (Open-Meteo)...",
  ];

  console.log(`\n${C.brightMagenta}${C.bright}⚡ KIRO SYSTEM AGENT — BOOT SEQUENCE INITIATED ⚡${C.reset}\n`);
  for (const step of steps) {
    console.log(`${C.dim}  [${new Date().toLocaleTimeString()}]${C.reset} ${C.brightCyan}›${C.reset} ${step}`);
    await sleep(150);
  }
  console.log(`${C.brightGreen}${C.bright}  ✔ All systems online.${C.reset}\n`);
}

async function runDevgotchiAgent() {
  console.clear();
  await bootSequence();

  await client.connect();

  // 1. ดึงข้อมูลสถานะสัตว์เลี้ยงจาก PostgreSQL
  const petRes = await client.query("SELECT * FROM pets LIMIT 1;");
  const pet = petRes.rows[0] ?? { id: null, name: "Devgotchi", level: 1, exp: 0, outfit: "default" };

  // 2. ดึงสภาพอากาศกรุงเทพฯ ผ่าน Open-Meteo
  let temp = 32;
  let weatherDesc = "Clear Sky";
  let isCold = false;
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=13.7563&longitude=100.5018&current_weather=true"
    );
    const data = (await res.json()) as OpenMeteoResponse;
    temp = data.current_weather?.temperature ?? 32;
    isCold = temp < 24;
    weatherDesc = isCold ? "Cool Breeze" : "Tropical Heat";
  } catch {
    weatherDesc = "Sensors Offline";
  }

  const outfit = isCold ? "Winter Beanie & Coat ❄️" : "Hacker Cyber Hoodie 👕";
  if (pet.id !== null) {
    await client.query("UPDATE pets SET outfit = $1 WHERE id = $2;", [
      isCold ? "winter" : "normal",
      pet.id,
    ]);
  }

  // ตัวการ์ตูน ASCII Art น้อง Devgotchi (สไตล์หุ่นยนต์พิกเซล)
  const petArt = isCold
    ? [
        `${C.cyan}      [❄️ COLD MODE ❄️]      ${C.reset}`,
        `${C.cyan}         ▲       ▲          ${C.reset}`,
        `${C.cyan}       ╔═══════════╗        ${C.reset}`,
        `${C.cyan}       ║  >     <  ║  ⚡     ${C.reset}  ${C.blue}*chattering teeth*${C.reset}`,
        `${C.cyan}       ║     ~     ║        ${C.reset}`,
        `${C.cyan}       ╚═[▓▓▓▓▓▓▓]═╝        ${C.reset}  ${C.dim}(Thermal Scarf ON)${C.reset}`,
        `${C.cyan}         /▌     ▌\\          ${C.reset}`,
      ]
    : [
        `${C.green}      ⚡ [SYSTEM ONLINE] ⚡  ${C.reset}`,
        `${C.green}         ▲       ▲          ${C.reset}`,
        `${C.green}       ╔═══════════╗        ${C.reset}`,
        `${C.green}       ║  ●     ●  ║  ✨    ${C.reset}  ${C.yellow}*vibing to clean code*${C.reset}`,
        `${C.green}       ║     ▽     ║        ${C.reset}`,
        `${C.green}       ╚═══════════╝        ${C.reset}`,
        `${C.green}         /▌     ▌\\          ${C.reset}`,
      ];

  const petRemark = isCold
    ? "Ooh, a cool breeze in Bangkok! Good thing my automated MCP sensor triggered winter gear."
    : "Your clean commits taste delicious! My neural network is humming happily!";

  const rank = rankForLevel(pet.level);
  const petName = pet.name ?? "Devgotchi";
  const now = new Date();

  // 3. แสดงผล Dashboard อลังการ
  boxTop();
  boxLine(`${C.bright}👾 DEVGOTCHI VIRTUAL COMPANION OS${C.reset} ${C.dim}v2.0.0${C.reset}   ${C.brightMagenta}[Agent: @DevgotchiBrain]${C.reset}`);
  boxLine(`${C.dim}Session: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}${C.reset}`);
  boxDivider();
  boxBlank();

  petArt.forEach((line) => boxLine(`  ${line}`));
  boxBlank();

  boxLine(`${C.brightYellow}${C.bright}► IDENTITY${C.reset}`);
  boxLine(`  • Name        : ${C.bright}${petName}${C.reset}`);
  boxLine(`  • Rank        : ${C.brightYellow}${rank}${C.reset}`);
  boxBlank();

  boxLine(`${C.brightYellow}${C.bright}► STATS & GROWTH${C.reset}`);
  boxLine(`  • Level       : ${C.bright}${C.brightYellow}LVL ${pet.level}${C.reset}`);
  boxLine(`  • Growth Rate : ${renderProgressBar(pet.exp, 100, 26)}`);
  boxLine(`  • Equipped    : ${C.bright}${outfit}${C.reset}`);
  boxBlank();

  boxLine(`${C.brightBlue}${C.bright}► TELEMETRY${C.reset} ${C.dim}(MCP Protocol · Open-Meteo API)${C.reset}`);
  boxLine(`  • Location    : Bangkok, Thailand 🇹🇭`);
  boxLine(`  • Condition   : ${C.bright}${temp}°C${C.reset} (${weatherDesc})`);
  boxBlank();

  boxLine(`${C.brightMagenta}${C.bright}► AGENT THOUGHT DIALOGUE${C.reset}`);
  boxWrapped(`"${petRemark}"`, "  ", `${C.italic}${C.dim}`);
  boxBlank();
  boxBottom();
  console.log();

  await client.end();
}

runDevgotchiAgent().catch(console.error);
