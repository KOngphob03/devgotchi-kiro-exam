import { test, expect } from "bun:test";
import fc from "fast-check";
// สมมติว่ามีฟังก์ชันคำนวณเลเวลอยู่ที่ src/utils/pet-logic.ts
// import { calculateLevel } from "../src/utils/pet-logic";

// Mock function สำหรับการทดสอบเบื้องต้น
const calculateLevel = (currentLevel: number, currentExp: number, gainedExp: number) => {
  let totalExp = currentExp + gainedExp;
  let newLevel = currentLevel;
  while (totalExp >= 100) {
    newLevel += 1;
    totalExp -= 100;
  }
  return { level: newLevel, exp: totalExp };
};

test("Level should never decrease and EXP should wrap correctly regardless of input size", () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 1, max: 99 }),      
      fc.integer({ min: 0, max: 99 }),      
      fc.integer({ min: 0, max: 1000000 }), 
      (currentLevel, currentExp, gainedExp) => {
        const result = calculateLevel(currentLevel, currentExp, gainedExp);
        
        expect(result.level).toBeGreaterThanOrEqual(currentLevel); 
        expect(result.exp).toBeGreaterThanOrEqual(0);              
        expect(result.exp).toBeLessThan(100);                      
      }
    )
  );
});