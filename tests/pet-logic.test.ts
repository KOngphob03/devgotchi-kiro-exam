import { test, expect } from "bun:test";
import fc from "fast-check";
import { calculateLevel } from "../src/utils/pet-logic";

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