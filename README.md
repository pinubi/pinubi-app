# Pinubi App Monorepo

This is a monorepo setup for the Pinubi application using Bun workspaces and Turbo for build orchestration.

## Structure

```
pinubi-app/
├── apps/
│   └── mobile/          # React Native mobile app
├── packages/
│   └── types/           # Shared TypeScript types
├── package.json         # Root package.json with workspace configuration
├── turbo.json          # Turbo configuration
└── tsconfig.json       # Root TypeScript configuration
```

## Getting Started

1. Install dependencies from the root:
   ```bash
   bun install
   ```

2. Build all packages:
   ```bash
   bun run build
   ```

3. Start development:
   ```bash
   bun run dev
   ```

## Working with Packages

### Adding a New App

1. Create a new directory under `apps/`
2. Add the app's package.json with name `@pinubi/app-name`
3. The workspace will automatically include it

### Adding a New Package

1. Create a new directory under `packages/`
2. Add the package.json with name `@pinubi/package-name`
3. Export types/utilities from the package
4. Use `workspace:*` to reference it in other apps

### Using Shared Types

In any app, you can import shared types:

```typescript
import { User, CheckIn, ApiResponse } from '@pinubi/types';
```

### Adding New Dependencies

When adding new dependencies, follow these guidelines:

**Shared Dependencies (Root Level):**
```bash
# For dependencies used by multiple apps (TypeScript, ESLint, testing tools)
bun add -d typescript eslint prettier

# For runtime dependencies shared across apps (firebase, dotenv)
bun add firebase dotenv
```

**App-Specific Dependencies:**
```bash
# For dependencies specific to one app
bun add react-native-something --filter @pinubi/mobile
bun add next --filter @pinubi/web
bun add firebase-functions --filter @pinubi/functions
```

**Current Dependency Structure:**
- **Root**: Shared dev tools (`typescript`, `eslint`, `@types/node`) and common runtime deps (`firebase`, `dotenv`)
- **Mobile**: React Native, Expo, and mobile-specific packages
- **Functions**: Firebase Functions, Google Maps, and serverless-specific packages
- **Types**: No dependencies (inherits TypeScript from root)

## Best Practice
Always run `bun install` from the root directory. This ensures:
- All workspaces stay in sync
- Workspace dependencies are properly linked
- You get the performance benefits of Bun's fast installation
- No dependency version conflicts between workspaces

## Scripts

- `bun run build` - Build all packages and apps
- `bun run dev` - Start development mode for all packages
- `bun run lint` - Lint all packages
- `bun run type-check` - Type check all packages
- `bun run clean` - Clean all build artifacts

## Mobile App Development

To work specifically with the mobile app:

```bash
cd apps/mobile
bun run start    # Start Expo development server
bun run android  # Run on Android
bun run ios      # Run on iOS
```