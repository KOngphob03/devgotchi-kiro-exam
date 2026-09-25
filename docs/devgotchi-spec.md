# Devgotchi System Specification

This document defines the core mechanics of the Devgotchi system using EARS (Easy Approach to Requirements Syntax) notation to guide the AI and property-based testing.

## 1. Core Mechanics (EXP & Leveling)
- **WHEN** the developer executes a successful `git commit`, **THE SYSTEM SHALL** increase the pet's EXP by 50 points.
- **WHEN** the pet's EXP reaches the maximum threshold of the current level, **THE SYSTEM SHALL** increment the pet's level by 1, reset the current EXP to 0, and increase the maximum HP by 10.
- **IF** the developer writes code without syntax or linting errors, **THE SYSTEM SHALL** trigger a "Happy" animation for the pet.

## 2. Survival Mechanics (Hunger & HP)
- **WHILE** the developer is inactive (no commits or builds) for more than 4 hours, **THE SYSTEM SHALL** decrease the pet's Hunger level by 10%.
- **WHEN** the pet's Hunger level drops below 20%, **THE SYSTEM SHALL** display a "Starving" warning indicator in the UI.
- **IF** the pet's HP reaches 0, **THE SYSTEM SHALL** set the pet's status to "Fainted" and require a manual reset.

## 3. Environmental Interactions
- **WHEN** the system fetches weather data from the Thailand Weather API indicating a temperature below 24°C, **THE SYSTEM SHALL** render a "Winter Clothes" sprite for the pet.
- **WHEN** the external MCP server detects a deployed production build, **THE SYSTEM SHALL** grant the pet an "Evolution" item.