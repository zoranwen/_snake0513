<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Neon Snake

A neon-inspired Snake game built with Vite and React.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Start the development server:
   `npm run dev`

Then open the local URL shown in the terminal.

## GitHub Pages Deployment

This project is configured for GitHub Pages via GitHub Actions.

- The Vite base path is set to `/_snake0513/`
- The workflow builds the app and publishes the `dist` folder to the `gh-pages` branch
- The site will be available at `https://zoranwen.github.io/_snake0513/`

The workflow runs automatically when changes are pushed to `main`.

## Project Structure

- `src/App.tsx` — main application shell
- `src/components/SnakeGame.tsx` — game logic and UI
- `vite.config.ts` — Vite configuration
