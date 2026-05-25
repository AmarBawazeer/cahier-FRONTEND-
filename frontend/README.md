# Cahier

Cahier is a movie, TV, and anime guessing game.

You are shown two titles and have to guess which one is ranked higher. The goal is to build a score by getting as many answers right as possible before the rounds run out.

The project is meant to feel bigger than just a quiz. It is a place for people who love stories on screen, want to test their taste, and eventually compare opinions with friends.

## What You Can Do

- Play solo rounds with movies, TV shows, or a mixed set
- Compare titles and try to predict which one ranks higher
- Explore a growing collection of films, shows, and anime
- Challenge friends in live competitive rounds with a countdown timer
- Get recommendations and hints from Airin, an AI companion built into the game

## Big Ideas Behind Cahier

- A curated collection of titles instead of an endless catalog
- A game that rewards memory, taste, and instinct
- A space for discussion, discovery, and friendly competition

## Current Direction

The core guessing game is in place. The longer-term plan is to expand it into a full entertainment platform with a richer collection, live competitive modes, personal profiles, and deeper discovery tools powered by Airin.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Vite — deployed on Vercel |
| Main API | Go + Gin — deployed on Railway |
| Competitive server | Rust + axum/tokio — deployed on Railway |
| AI companion | Python + FastAPI — deployed on Railway |
| Database | Turso / libSQL — shared across all services |

## Project Docs

- [backend.md](/backend.md)
- [frontend.md](/frontend.md)