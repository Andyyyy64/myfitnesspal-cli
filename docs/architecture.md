# Architecture

## Overview

myfitnesspal-cli is a two-layer architecture: a Core SDK that handles all API communication, and a CLI layer that provides the user interface.

```
┌─────────────────────────────────────┐
│          CLI Layer                   │
│   src/commands/*.ts                  │
│   (commander, inquirer, cli-table3)  │
│                                      │
│   - Parses arguments & options       │
│   - Calls MFPClient methods          │
│   - Formats output (table or JSON)   │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│          Core SDK                    │
│   src/client/index.ts (MFPClient)    │
│   src/client/*.ts (domain modules)   │
│                                      │
│   - Typed API calls via fetch        │
│   - Session management               │
│   - buildId caching                  │
│   - Response parsing                 │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│   MyFitnessPal Internal Web API      │
│   https://www.myfitnesspal.com       │
└─────────────────────────────────────┘
```

## Directory Structure

```
src/
├── client/              # Core SDK - reusable API layer
│   ├── index.ts         # MFPClient facade class
│   ├── constants.ts     # BASE_URL, makeHeaders helpers
│   ├── types.ts         # TypeScript interfaces
│   ├── auth.ts          # Authentication (login, session)
│   ├── food.ts          # Food search (buildId handling)
│   ├── foods.ts         # Food CRUD, top foods
│   ├── diary.ts         # Diary CRUD, notes, copy, complete, report
│   ├── exercise.ts      # Exercise search, CRUD, lookup
│   ├── measurement.ts   # Weight & measurement types
│   ├── water.ts         # Water intake
│   ├── goals.ts         # Nutrient goals
│   ├── meals.ts         # Saved meals
│   └── account.ts       # Profile, settings, digest, export, reports
├── commands/            # CLI layer - thin wrappers
│   ├── auth.ts          # login, auth set-cookie, auth status
│   ├── search.ts        # search
│   ├── log.ts           # log (interactive + programmatic)
│   ├── diary.ts         # diary subcommands
│   ├── food.ts          # food management subcommands
│   ├── meals.ts         # meals subcommands
│   ├── weight.ts        # weight + measurement type subcommands
│   ├── water.ts         # water
│   ├── exercise.ts      # exercise subcommands
│   ├── goals.ts         # goals view + update
│   └── account.ts       # account subcommands
├── utils/
│   ├── config.ts        # ~/.config/mfp-cli/ read/write
│   └── output.ts        # Table/JSON formatting, todayStr
└── index.ts             # CLI entrypoint
```

## Design Decisions

### Core SDK separated from CLI

The `MFPClient` class and all `src/client/` modules can be imported directly for programmatic use. This enables:
- Future MCP server (import MFPClient, expose as tools)
- Integration into other tools
- Testing without CLI overhead

### Shared constants and headers

`src/client/constants.ts` exports `BASE_URL`, `SESSION_COOKIE_NAME`, `makeHeaders()`, and `makeReadHeaders()` to avoid duplication across client modules.

### buildId caching

MFP's food search uses a Next.js `/_next/data/{buildId}/` URL. The buildId changes on each MFP deployment. We:
1. Extract it from the homepage HTML via regex
2. Cache in `auth.json` with a 24-hour TTL
3. Auto-retry with fresh buildId on 404

### Output formatting

Every command supports `--json` for structured output. The `outputResult()` helper handles the branching:
- `--json` -> `{ success: true, data: ... }` to stdout
- default -> table or formatted text via callback

### Authentication storage

Session token stored at `~/.config/mfp-cli/auth.json` with `0600` file permissions (owner read/write only) since it contains credentials.

## Future: MCP Server

The architecture is designed for easy MCP server addition:

```
src/
├── client/   # Already exists - reuse as-is
├── commands/ # CLI layer
├── mcp/      # Future: MCP server layer
│   └── server.ts  # Import MFPClient, expose as MCP tools
└── ...
```

The MCP server would import `MFPClient` and expose each method as a tool, with the same typed inputs/outputs the CLI uses.
