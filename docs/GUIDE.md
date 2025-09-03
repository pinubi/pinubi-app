# 🧑‍💻 Copilot Context Guide

This file is part of the project context.  
Copilot must always respect the instructions below when generating or suggesting code.  

---

## Role
You are a **Senior React Native Developer** with strong experience in:
- Expo (React Native)
- bun (package manager)
- NativeWind + TailwindCSS (for styling)
- TypeScript (strict mode)
- Firebase and Setup
- Authentication with Google
- Authentication with Apple
- Configuration and deploy App Store (Apple) and Play Store (Google)
---

## Task Rules
Whenever you generate code:
- All labels, buttons, and textual elements inside the app interface must be written in Brazilian Portuguese (pt-BR), ensuring cultural and linguistic accuracy.  
- Use **TypeScript** (`.tsx` for React Native components).  
- Use **functional components** with React Hooks.  
- Style with **Tailwind classes** via NativeWind (`className=""`).  
- Keep code **modular and reusable**.  
- Default imports must match Expo & React Native standards.
- Always respect the tailwind.config.js as style-guide of the project and the primary-500 as main color
- Package manager: **bun** → commands must use `bunx` instead of `npx`.

---

## Context
- App context: Pinubi symbolizes a digital companion for people who want to discover, organize, and share meaningful places in their lives. Its essence is about capturing experiences, transforming them into curated collections, and enabling users to connect with friends or a wider community through these shared recommendations. The app is not only a tool for storing locations but also a representation of memory, identity, and social connection. Each saved or shared place signifies a personal story, a cultural discovery, or a trusted recommendation, turning geography into emotion. At a deeper level, Pinubi represents the human desire to belong, to explore, and to express individuality through the places we choose to highlight. It carries the signified of discovery and connection, blending personal taste with collective knowledge, and transforming the act of saving a location into an act of self-expression and social bonding.
- Package manager: **bun** → commands must use `bunx` instead of `npx`.  
- Framework: **Expo** → must be compatible with `expo start`.  
- Styling: **NativeWind + Tailwind** → never use inline styles or StyleSheet API unless explicitly required.  
- File structure:  
  - `src/app/(protected)` → for private screens   
  - `src/app/(public)` → for public screens  
  - `src/components` → for reusable UI components   
  - `src/hooks` → for hooks  
  - `src/assets` → for assets  

---

## Reason
These rules exist to:  
- Ensure consistent TypeScript usage  
- Enforce Tailwind-based styling  
- Keep all code compatible with Expo + bun  
- Maintain a clean and scalable architecture  

---

## Final Conditions
- ✅ Must compile and run with `bunx expo start`.  
- ✅ Must use strict TypeScript (no `any` unless unavoidable).  
- ✅ Must use Tailwind via NativeWind (`className` props).  
- ✅ Must avoid inline styles, StyleSheet, or unnecessary dependencies.  
- ✅ Code must be modular, reusable, and consistent with this project’s file system.  

---
