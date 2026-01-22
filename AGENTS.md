# Anihost Development Guide

This repository hosts a modern anime streaming application named **Anihost**. It consists of a Next.js frontend and a Hono-based Node.js API backend. This guide provides essential information for AI agents and developers to work effectively within this codebase.

## 🏗️ Project Structure

The project is organized as a monorepo-style structure:

- **Root (`/`)**: Next.js 15+ frontend application (App Router).
  - `src/app`: Application routes and pages.
  - `src/components`: React components (UI library, feature-specific).
  - `src/lib`: Utility functions and API clients.
  - `src/types`: TypeScript definitions.
- **API (`/api`)**: Node.js backend using Hono framework.
  - `src/routes`: API route definitions.
  - `src/config`: Configuration and environment variables.
  - `__tests__`: Vitest test suites.

## ⚠️ Requirements

- **Runtime/Package Manager:** **Bun** is required for this project.
- **Lockfile:** This project uses `bun.lock`. Always use `bun install` instead of `npm install`.

## 🛠️ Build, Lint, & Test Commands

### Root (Frontend)

| Command | Description |
| :--- | :--- |
| `bun install` | Install frontend dependencies. |
| `bun run dev` | Starts **both** the frontend (port 3000) and API (port 4000) in development mode. |
| `bun run build` | Builds the Next.js application and the API. |
| `bun run lint` | Runs ESLint to check for code quality and style issues. |
| `bun start` | Starts the production server for both frontend and API. |

### API (`/api`)

To run these commands, first change directory: `cd api`

| Command | Description |
| :--- | :--- |
| `bun install` | Install backend dependencies. |
| `bun run dev` | Starts the API server in watch mode. |
| `bun test` | Runs all tests using Vitest. |
| `bun run typecheck`| Runs TypeScript compiler to check for type errors without emitting files. |
| `bun run format` | Formats code using Prettier. |

#### 🧪 Running Single Tests

To run a specific test file or a specific test case in the API:

```bash
# Run tests in a specific file
cd api && bun test -- animeSearch

# Run tests matching a specific name pattern
cd api && bun test -- -t "should return search results"
```

## 🎨 Code Style & Conventions

### General Principles
- **Strict TypeScript:** Always use strict typing. Avoid `any` types; define interfaces in `src/types` or adjacent to usage if private.
- **Functional Programming:** Prefer pure functions and immutability where possible.
- **Clean Code:** Keep components and functions small and focused (Single Responsibility Principle).

### Frontend (Next.js)
- **Framework:** Next.js 15 (App Router).
- **Component Style:**
  - Use Functional Components with named exports: `export function MyComponent() { ... }`.
  - Use `"use client"` directive only when necessary (e.g., using hooks like `useState`, `useEffect`).
  - Prefer Server Components for data fetching and initial rendering.
- **Styling:**
  - **Tailwind CSS:** Use utility classes for styling.
  - **`cn()` Utility:** Use `lib/utils.ts`'s `cn` function for conditional class merging.
  - **Icons:** Use `lucide-react` for all icons.
  - **Animations:** Use `framer-motion` for complex animations.
- **Imports:**
  - Use absolute paths with the `@/` alias.
  - Order: React/Next imports -> External libraries -> Internal components -> Utils/Types -> CSS.
  - Example: `import { Button } from "@/components/ui/button";`
- **Data Fetching:**
  - Use `fetch` within Server Components or Server Actions.
  - Handle loading and error states gracefully.

### Backend (Hono)
- **Framework:** Hono (Node.js adapter).
- **Architecture:**
  - Routes should be defined in `src/routes`.
  - Business logic should be separated from route handlers where complex.
- **Error Handling:**
  - Use `try/catch` blocks.
  - Return standardized JSON error responses: `{ success: false, message: "..." }`.
  - Log errors using `pino`.

### 📝 Naming Conventions

| Entity | Convention | Example |
| :--- | :--- | :--- |
| **Files/Directories** | kebab-case | `search-trigger.tsx`, `api.ts`, `user-profile/` |
| **Components** | PascalCase | `SearchTrigger`, `UserProfile` |
| **Functions** | camelCase | `getHomePageData`, `validateInput` |
| **Variables** | camelCase | `isLoading`, `userData` |
| **Interfaces/Types** | PascalCase | `HomePageData`, `AnimeBasic` |
| **Constants** | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |

## 🛡️ Error Handling Patterns

### Frontend
- **API Calls:** Wrap `fetch` calls in `try/catch`.
- **UI Feedback:** Display user-friendly error messages (e.g., Toasts or fallback UI) instead of crashing.
- **Fallbacks:** Provide default empty states for arrays to prevent map errors (e.g., `(data.items || []).map(...)`).

```typescript
// Example API call wrapper
export async function getData() {
  try {
    const res = await fetch(...);
    if (!res.ok) throw new Error("Failed");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null; // or default value
  }
}
```

### Backend
- **Input Validation:** Validate all incoming request parameters (query, body, params).
- **Async Handling:** Ensure all Promises are awaited or returned.

## 🔍 Common Issues & Solutions

1.  **"Failed to fetch" in Client Components:**
    - **Cause:** Browsers cannot access `http://localhost:4000` inside some containerized environments or due to CORS if configured strictly.
    - **Solution:** Use **Server Actions** (`'use server'`) in `src/lib/api.ts` to proxy requests through the Next.js server, or configure a proper proxy in `next.config.ts`.

2.  **Hydration Mismatch:**
    - **Cause:** Rendering random data (dates, math.random) or mismatched HTML structure between server and client.
    - **Solution:** Use `useEffect` for client-only data or suppress warning (last resort).

## 📦 Dependency Management
- **Frontend:** `npm` (in root)
- **Backend:** `npm` (in `/api`)
- **New Packages:** Always verify if a package is already installed before adding a new one. Prefer standard libraries or existing lightweight alternatives.

## 🤖 Agent Workflow
1.  **Explore:** Use `ls -R` or `glob` to understand the current structure.
2.  **Read:** Read `AGENTS.md` (this file) and `package.json` to understand constraints.
3.  **Plan:** Formulate a plan before editing code.
4.  **Implement:** Adhere to the code style guidelines above.
5.  **Verify:** Run `bun run build` to check for type errors and build issues. Run tests if modifying the API.
