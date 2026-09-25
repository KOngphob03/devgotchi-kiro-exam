// src/db/schema.ts
import { pgTable, serial, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const pets = pgTable("pets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().default("Devgotchi"),
  level: integer("level").notNull().default(1),
  exp: integer("exp").notNull().default(0),
  outfit: varchar("outfit", { length: 50 }).default("default"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});