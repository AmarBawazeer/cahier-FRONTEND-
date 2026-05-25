# Frontend Notes

## Overview

The frontend is being rebuilt from a static prototype into a React app.

Its job is to provide:

- the main game experience
- vault browsing
- player profile views
- leaderboards
- competitive lobby screens
- Airin chat UI

## Frontend Stack

| Area | Technology |
|---|---|
| App framework | React |
| Build tool | Vite |
| Styling | Tailwind CSS |
| Motion | Framer Motion |
| Deployment | Vercel |

Main frontend config files:

- [frontend/package.json](/d:/development/go-code/webapps/Cahier/frontend/package.json)
- [frontend/vite.config.ts](/d:/development/go-code/webapps/Cahier/frontend/vite.config.ts)
- [frontend/tailwind.config.ts](/d:/development/go-code/webapps/Cahier/frontend/tailwind.config.ts)
- [frontend/vercel.json](/d:/development/go-code/webapps/Cahier/frontend/vercel.json)

## Planned Routes

- `/` for the landing page and mode selection
- `/game` for solo play
- `/game/comp/:lobby` for competitive matches
- `/vault` for browsing titles
- `/vault/:id` for a single title page
- `/airin` for chat
- `/leaderboard` for rankings
- `/profile` for user stats and preferences

Page files:

- [frontend/src/pages/Landing.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Landing.tsx)
- [frontend/src/pages/Game.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Game.tsx)
- [frontend/src/pages/CompLobby.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/CompLobby.tsx)
- [frontend/src/pages/Vault.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Vault.tsx)
- [frontend/src/pages/VaultItem.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/VaultItem.tsx)
- [frontend/src/pages/Airin.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Airin.tsx)
- [frontend/src/pages/Leaderboard.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Leaderboard.tsx)
- [frontend/src/pages/Profile.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/pages/Profile.tsx)

## Main Components

- `GameCard` for title comparison cards
- `RoundSelector` for choosing round count
- `AirinPanel` for embedded chat access
- `LobbyRoom` for multiplayer status
- `VaultBrowser` for title browsing and filtering
- `Navbar` for app navigation

Relevant files:

- [frontend/src/components/GameCard.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/GameCard.tsx)
- [frontend/src/components/RoundSelector.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/RoundSelector.tsx)
- [frontend/src/components/AirinPanel.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/AirinPanel.tsx)
- [frontend/src/components/LobbyRoom.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/LobbyRoom.tsx)
- [frontend/src/components/VaultBrowser.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/VaultBrowser.tsx)
- [frontend/src/components/Navbar.tsx](/d:/development/go-code/webapps/Cahier/frontend/src/components/Navbar.tsx)

## Frontend Data Layer

The frontend already has API and hook folders for app data flow:

- [frontend/src/api/game.ts](/d:/development/go-code/webapps/Cahier/frontend/src/api/game.ts)
- [frontend/src/api/vault.ts](/d:/development/go-code/webapps/Cahier/frontend/src/api/vault.ts)
- [frontend/src/api/users.ts](/d:/development/go-code/webapps/Cahier/frontend/src/api/users.ts)
- [frontend/src/api/airin.ts](/d:/development/go-code/webapps/Cahier/frontend/src/api/airin.ts)
- [frontend/src/hooks/useGame.ts](/d:/development/go-code/webapps/Cahier/frontend/src/hooks/useGame.ts)
- [frontend/src/hooks/useVault.ts](/d:/development/go-code/webapps/Cahier/frontend/src/hooks/useVault.ts)
- [frontend/src/hooks/useAirin.ts](/d:/development/go-code/webapps/Cahier/frontend/src/hooks/useAirin.ts)
- [frontend/src/hooks/useWebSocket.ts](/d:/development/go-code/webapps/Cahier/frontend/src/hooks/useWebSocket.ts)

## Frontend Goals

- Replace the older single-page prototype
- Add proper routing and reusable components
- Connect to the Go and Python APIs cleanly
- Support solo mode, competitive mode, vault browsing, and Airin
- Stay deployable on Vercel

## Current Frontend State

- Static root prototype exists in [index.html](/d:/development/go-code/webapps/Cahier/index.html)
- React/Vite frontend structure exists in [frontend](/d:/development/go-code/webapps/Cahier/frontend)
- Core pages and components are scaffolded
- API integration files are present
- Frontend is in transition from prototype to full app
