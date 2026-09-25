// src/utils/pet-logic.ts
export const calculateLevel = (currentLevel: number, currentExp: number, gainedExp: number) => {
  let totalExp = currentExp + gainedExp;
  let newLevel = currentLevel;
  
  // ลูปเพื่ออัปเลเวลถ้ายอด EXP ปัจจุบันเกิน 100
  while (totalExp >= 100) {
    newLevel += 1;
    totalExp -= 100;
  }
  
  return { level: newLevel, exp: totalExp };
};