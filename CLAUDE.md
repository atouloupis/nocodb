# CLAUDE.md - NocoDB Development Guide for AI Assistants

This document provides a comprehensive guide for AI assistants working on the NocoDB codebase. It covers architecture, development workflows, conventions, and best practices.

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Technology Stack](#technology-stack)
4. [Development Setup](#development-setup)
5. [Architecture Patterns](#architecture-patterns)
6. [Code Conventions](#code-conventions)
7. [Testing Strategy](#testing-strategy)
8. [Git Workflow](#git-workflow)
9. [Common Development Tasks](#common-development-tasks)
10. [Important Directories and Files](#important-directories-and-files)

## Project Overview

**NocoDB** is an open-source Airtable alternative that transforms databases into smart spreadsheets. It provides a no-code interface for databases with features like multiple view types (Grid, Gallery, Form, Kanban, Calendar), access control, REST APIs, and workflow automations.

- **License**: AGPLv3
- **Primary Language**: TypeScript
- **Repository**: https://github.com/nocodb/nocodb
- **Documentation**: https://docs.nocodb.com/

## Repository Structure

NocoDB is a **monorepo** managed with **pnpm workspaces** and **Lerna**. The repository is organized as follows:

```
nocodb/
├── packages/
│   ├── nocodb/              # Backend (NestJS application)
│   ├── nc-gui/              # Frontend (Nuxt 3 + Vue 3 application)
│   ├── nocodb-sdk/          # TypeScript SDK shared between frontend and backend
│   ├── nocodb-sdk-v2/       # Next version of SDK
│   ├── nc-lib-gui/          # Built frontend assets for backend
│   ├── nc-mail-assets/      # Email templates assets
│   ├── nc-secret-mgr/       # Secret management utilities
│   └── noco-integrations/   # Integration framework
├── tests/
│   ├── playwright/          # End-to-end tests
│   └── docker/              # Docker test configurations
├── docker-compose/          # Docker deployment configurations
├── scripts/                 # Build and utility scripts
├── .github/                 # GitHub workflows and templates
└── charts/                  # Helm charts for Kubernetes deployment
```

### Key Packages

#### 1. **nocodb** (Backend)
- **Framework**: NestJS
- **Location**: `packages/nocodb/`
- **Entry Point**: `src/main.ts`
- **Key Directories**:
  - `src/controllers/` - HTTP request handlers
  - `src/models/` - Data models and business logic
  - `src/modules/` - NestJS modules (auth, jobs, etc.)
  - `src/db/` - Database migrations and schema
  - `src/services/` - Business logic services
  - `src/helpers/` - Utility functions
  - `src/filters/` - Exception filters
  - `src/guards/` - Authentication/authorization guards
  - `src/middlewares/` - Express middlewares
  - `src/interceptors/` - Request/response interceptors

#### 2. **nc-gui** (Frontend)
- **Framework**: Nuxt 3 + Vue 3
- **Location**: `packages/nc-gui/`
- **Key Directories**:
  - `components/` - Vue components
  - `composables/` - Vue composition API functions
  - `pages/` - Nuxt pages/routes
  - `layouts/` - Page layouts
  - `helpers/` - Utility functions
  - `lib/` - Core libraries
  - `assets/` - Static assets (images, styles)
  - `lang/` - Internationalization files

#### 3. **nocodb-sdk**
- **Location**: `packages/nocodb-sdk/`
- Shared TypeScript types, utilities, and helpers
- Used by both frontend and backend for consistency

## Technology Stack

### Backend
- **Runtime**: Node.js (>= 22)
- **Framework**: NestJS 10.x
- **Build Tool**: Rspack (Webpack alternative)
- **Database ORM**: Knex.js 3.1.0
- **Supported Databases**: PostgreSQL, MySQL, SQLite, SQL Server, MariaDB
- **Key Libraries**:
  - `passport` - Authentication
  - `bull` - Job queue management
  - `socket.io` - Real-time communication
  - `ioredis` - Redis client
  - `jsonwebtoken` - JWT handling
  - `knex` - SQL query builder
  - `sharp` - Image processing
  - `multer` - File uploads

### Frontend
- **Framework**: Nuxt 3.17.4
- **UI Framework**: Vue 3 + Ant Design Vue
- **CSS Framework**: WindiCSS
- **State Management**: Pinia
- **Build Tool**: Vite
- **Key Libraries**:
  - `@vueuse/core` - Vue composition utilities
  - `socket.io-client` - Real-time updates
  - `monaco-editor` - Code editor
  - `chart.js` - Charts
  - `xlsx` - Excel import/export
  - `papaparse` - CSV parsing
  - `dayjs` - Date manipulation

### Development Tools
- **Package Manager**: pnpm (required)
- **Monorepo Tool**: Lerna 8.x
- **Testing**:
  - Playwright (E2E tests)
  - Vitest (Unit tests for frontend)
  - Jest (Unit tests for backend)
- **Linting**: ESLint + Prettier
- **Pre-commit**: Husky + lint-staged

## Development Setup

### Prerequisites
- Node.js >= 22 (backend), >= 18 (frontend)
- pnpm (enforced via `preinstall` script)
- Docker and Docker Compose (for database testing)

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/nocodb/nocodb.git
cd nocodb

# Install dependencies and bootstrap
pnpm install
pnpm run bootstrap

# The bootstrap script:
# 1. Builds nocodb-sdk
# 2. Installs dependencies for core packages
# 3. Builds integrations
# 4. Registers integrations
```

### Running Development Servers

#### Backend Only
```bash
pnpm --filter=nocodb run start
# Backend runs on http://localhost:8080
```

#### Frontend Only
```bash
pnpm --filter=nc-gui run dev
# Frontend runs on http://localhost:3000
```

#### Backend with Specific Database

**MySQL**:
```bash
# Start MySQL container
pnpm run start:mysql

# Run backend with MySQL
pnpm --filter=nocodb run watch:run:mysql
```

**PostgreSQL**:
```bash
# Start PostgreSQL container
pnpm run start:pg

# Run backend with PostgreSQL
pnpm --filter=nocodb run watch:run:pg
```

### Building for Production

```bash
# Build SDK first
pnpm --filter=nocodb-sdk run build

# Build backend
pnpm --filter=nocodb run build

# Build frontend
pnpm --filter=nc-gui run build
```

## Architecture Patterns

### Backend Architecture (NestJS)

NocoDB follows **Domain-Driven Design** principles with NestJS modules:

1. **Module-based Organization**: Each feature is organized into modules (`AuthModule`, `JobsModule`, etc.)

2. **Controller → Service → Model Pattern**:
   - **Controllers** (`src/controllers/`) - Handle HTTP requests, validation
   - **Services** (within models or modules) - Business logic
   - **Models** (`src/models/`) - Data access layer, ORM interactions

3. **Dependency Injection**: Heavy use of NestJS DI container

4. **Middleware Chain**:
   ```
   Request → RawBodyMiddleware → JsonBodyMiddleware → UrlEncodeMiddleware
           → GuiMiddleware → GlobalMiddleware → Controller
   ```

5. **Exception Handling**: Global exception filter (`GlobalExceptionFilter`)

6. **Guards and Interceptors**:
   - `ExtractIdsMiddleware` - Extracts IDs from routes
   - Authentication guards for protected routes

### Frontend Architecture (Nuxt 3 + Vue 3)

1. **Composition API**: Prefer Composition API over Options API

2. **Auto-imports**: Components and composables are auto-imported (Nuxt feature)

3. **State Management**:
   - Pinia stores for global state
   - Composables for reusable logic

4. **Component Organization**:
   - **Smart Components**: Connected to stores, handle business logic
   - **Presentational Components**: Pure, receive props, emit events

5. **Layouts**: Multiple layouts for different sections (dashboard, public forms, etc.)

### Data Flow

```
User Action (Frontend)
    ↓
Vue Component → Composable → API Client (nocodb-sdk)
    ↓
HTTP Request
    ↓
Backend Controller → Service/Model → Knex Query → Database
    ↓
Response
    ↓
Frontend State Update → UI Re-render
```

## Code Conventions

### General TypeScript Conventions

1. **Strict TypeScript**: Both frontend and backend use strict mode
2. **No `any` types**: Avoid using `any`; use proper types or `unknown`
3. **Interface over Type**: Prefer interfaces for object shapes
4. **Explicit Return Types**: Always specify return types for functions

### Backend Conventions

1. **File Naming**:
   - Controllers: `*.controller.ts`
   - Services: `*.service.ts`
   - Models: PascalCase (e.g., `User.ts`, `Base.ts`)
   - Modules: `*.module.ts`
   - Tests: `*.spec.ts`

2. **Class Naming**:
   - Controllers: `{Feature}Controller`
   - Services: `{Feature}Service`
   - Models: PascalCase without suffix

3. **Method Naming**:
   - CRUD operations: `create`, `read`, `update`, `delete`, `list`
   - Async methods: Always prefix with `async`

4. **Decorators**:
   ```typescript
   @Controller('api/v1/tables')
   export class TablesController {
     @Get(':tableId')
     async get(@Param('tableId') tableId: string) {
       // ...
     }
   }
   ```

5. **Error Handling**:
   - Use NestJS exception filters
   - Throw `BadRequestException`, `NotFoundException`, etc.
   - Custom error classes extend `NcError`

### Frontend Conventions

1. **File Naming**:
   - Components: PascalCase (e.g., `TableView.vue`)
   - Composables: camelCase starting with `use` (e.g., `useTable.ts`)
   - Pages: kebab-case (Nuxt convention)

2. **Component Structure**:
   ```vue
   <script setup lang="ts">
   // Imports
   // Props
   // Emits
   // Composables
   // Reactive state
   // Computed properties
   // Methods
   // Lifecycle hooks
   // Watchers
   </script>

   <template>
     <!-- Template -->
   </template>

   <style scoped lang="scss">
   /* Styles */
   </style>
   ```

3. **Props and Emits**:
   ```typescript
   interface Props {
     modelValue: string
     disabled?: boolean
   }
   const props = withDefaults(defineProps<Props>(), {
     disabled: false
   })

   const emit = defineEmits<{
     'update:modelValue': [value: string]
   }>()
   ```

4. **Composable Pattern**:
   ```typescript
   export function useFeature() {
     const state = ref()

     const computedValue = computed(() => /* ... */)

     function method() {
       // ...
     }

     return {
       state,
       computedValue,
       method
     }
   }
   ```

### Commit Message Convention

NocoDB follows **Conventional Commits** specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes that don't modify src or test files

**Examples**:
```
feat(api): add support for calendar view filtering
fix(gui): resolve issue with form submission validation
docs: update installation instructions
```

**Breaking Changes**:
```
feat(api)!: change authentication flow

BREAKING CHANGE: JWT token structure has changed
```

### Code Style

1. **Indentation**: 2 spaces (enforced by Prettier)
2. **Quotes**: Single quotes for strings
3. **Semicolons**: Required
4. **Line Length**: Max 120 characters
5. **Trailing Commas**: Always for multi-line

## Testing Strategy

### End-to-End Tests (Playwright)

- **Location**: `tests/playwright/`
- **Configuration**: `tests/playwright/playwright.config.ts`

**Running E2E Tests**:
```bash
# Start backend for testing
cd packages/nocodb
pnpm run watch:run:playwright

# Run tests
cd tests/playwright
pnpm test

# Run specific test
pnpm test tests/db/general/tableOperations.spec.ts

# Run in UI mode
pnpm test --ui
```

**Test Structure**:
```typescript
import { test } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup
  });

  test('should do something', async ({ page }) => {
    // Test steps
  });
});
```

### Unit Tests

**Backend (Jest)**:
```bash
pnpm --filter=nocodb run test
pnpm --filter=nocodb run test:watch
pnpm --filter=nocodb run test:cov
```

**Frontend (Vitest)**:
```bash
pnpm --filter=nc-gui run test
pnpm --filter=nc-gui run test:ui
pnpm --filter=nc-gui run coverage
```

### Test Database Setup

NocoDB provides Docker Compose configurations for test databases:

```bash
# MySQL
pnpm run start:mysql  # Start
pnpm run stop:mysql   # Stop

# PostgreSQL
pnpm run start:pg     # Start
pnpm run stop:pg      # Stop
```

## Git Workflow

NocoDB follows **Gitflow** (modified without release branches):

### Branches

- **`master`**: Stable releases only
- **`develop`**: Main development branch
- **Feature branches**: `feat/feature-name`
- **Fix branches**: `fix/bug-name`
- **Enhancement branches**: `enhancement/improvement-name`

### Pull Request Guidelines

1. **Target Branch**: Always target `develop`, NEVER `master`

2. **Branch Naming**:
   - Features: `feat/descriptive-name`
   - Fixes: `fix/issue-number-or-description`
   - Enhancements: `enhancement/description`

3. **PR Template**: Fill in all sections of `.github/PULL_REQUEST_TEMPLATE.md`

4. **Linking Issues**:
   - Reference: `ref: #123`
   - Closes: `closes: #123`

5. **Multiple Commits**: Allowed; will be squashed on merge

6. **Review Process**:
   - Code review required
   - CI checks must pass
   - No merge conflicts

### Contributor License Agreement

First-time contributors must sign the CLA:
https://cla-assistant.io/nocodb/nocodb

## Common Development Tasks

### Adding a New API Endpoint

1. **Create/Update Controller** (`packages/nocodb/src/controllers/`):
   ```typescript
   @Controller('api/v1/feature')
   export class FeatureController {
     @Post()
     async create(@Body() body: CreateDto) {
       return await Feature.create(body);
     }
   }
   ```

2. **Create/Update Model** (`packages/nocodb/src/models/`):
   ```typescript
   export default class Feature {
     static async create(data: Partial<Feature>) {
       // Implementation
     }
   }
   ```

3. **Update SDK Types** (`packages/nocodb-sdk/src/lib/`):
   - Add TypeScript interfaces
   - Update API client if needed

4. **Write Tests**:
   - Unit tests in `*.spec.ts`
   - E2E tests in `tests/playwright/`

### Adding a New Frontend Component

1. **Create Component** (`packages/nc-gui/components/`):
   ```vue
   <script setup lang="ts">
   // Component logic
   </script>

   <template>
     <!-- UI -->
   </template>

   <style scoped lang="scss">
   /* Styles */
   </style>
   ```

2. **Auto-import**: Components are auto-imported by Nuxt

3. **Add Tests** (if applicable):
   ```typescript
   // packages/nc-gui/test/Component.test.ts
   import { mount } from '@vue/test-utils';
   import Component from '~/components/Component.vue';

   describe('Component', () => {
     it('renders correctly', () => {
       const wrapper = mount(Component);
       expect(wrapper.exists()).toBe(true);
     });
   });
   ```

### Adding Database Migration

1. **Create Migration** (`packages/nocodb/src/db/migrations/`):
   ```typescript
   import type { Knex } from 'knex';

   export async function up(knex: Knex) {
     await knex.schema.createTable('table_name', (table) => {
       table.string('id').primary();
       // ...
     });
   }

   export async function down(knex: Knex) {
     await knex.schema.dropTable('table_name');
   }
   ```

2. **Test Migration**:
   - Test both `up` and `down`
   - Ensure idempotency

### Working with Integrations

1. **Location**: `packages/noco-integrations/`

2. **Build Integrations**:
   ```bash
   pnpm run integrations:build
   ```

3. **Register Integrations**:
   ```bash
   pnpm run registerIntegrations
   ```

### Debugging

**Backend**:
```bash
# Enable debug logging
export DEBUG=*

# Or specific namespaces
export DEBUG=noco:*

# Run with Node inspector
node --inspect-brk packages/nocodb/dist/bundle.js
```

**Frontend**:
```bash
# Nuxt DevTools (built-in)
# Open browser and use DevTools icon

# Vue DevTools browser extension
# Install from browser extension store
```

## Important Directories and Files

### Configuration Files

- **Root**:
  - `package.json` - Root package with workspace scripts
  - `pnpm-workspace.yaml` - Workspace configuration
  - `lerna.json` - Lerna configuration
  - `.npmrc` - npm/pnpm settings
  - `.sops.yaml` - Secrets management

- **Backend**:
  - `packages/nocodb/tsconfig.json` - TypeScript config
  - `packages/nocodb/rspack.config.js` - Build config
  - `packages/nocodb/src/app.config.ts` - NestJS app config

- **Frontend**:
  - `packages/nc-gui/nuxt.config.ts` - Nuxt configuration
  - `packages/nc-gui/tsconfig.json` - TypeScript config
  - `packages/nc-gui/windi.config.ts` - WindiCSS config (if present)

### Documentation

- `.github/CONTRIBUTING.md` - Contribution guidelines
- `.github/COMMIT_CONVENTION.md` - Commit message format
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template
- `README.md` - Main readme
- `SECURITY.md` - Security policy

### CI/CD

- `.github/workflows/` - GitHub Actions workflows
- `docker-compose/` - Docker deployment configurations

### Environment Variables

Common environment variables:

**Backend**:
- `NC_DB` - Database connection string
- `NC_AUTH_JWT_SECRET` - JWT secret
- `NC_PUBLIC_URL` - Public URL
- `NC_DISABLE_TELE` - Disable telemetry (for development)
- `DATABASE_URL` - SQLite database URL
- `DB_TYPE` - Database type (pg, mysql, sqlite)

**Frontend**:
- `NUXT_PUBLIC_NC_BACKEND_URL` - Backend URL
- `NUXT_PAGE_TRANSITION_DISABLE` - Disable page transitions

## Best Practices for AI Assistants

### When Making Changes

1. **Read Before Modifying**: Always read files before making changes
2. **Understand Context**: Review related files and architecture
3. **Follow Patterns**: Match existing patterns in the codebase
4. **Type Safety**: Ensure TypeScript types are correct
5. **Test Changes**: Run relevant tests after modifications
6. **Check Build**: Ensure the project builds successfully

### Code Quality

1. **No Shortcuts**: Don't skip error handling or validation
2. **Security First**: Be aware of security vulnerabilities (SQL injection, XSS, etc.)
3. **Performance**: Consider performance implications
4. **Backwards Compatibility**: Don't break existing APIs without discussion
5. **Documentation**: Update comments and docs when changing behavior

### Working with Models

- Models in `packages/nocodb/src/models/` often have complex relationships
- Always check for existing methods before creating new ones
- Be careful with circular dependencies
- Use Knex query builder; avoid raw SQL when possible

### Working with UI Components

- Reuse existing Ant Design Vue components
- Follow the design system (check existing components for patterns)
- Ensure responsive design (mobile, tablet, desktop)
- Accessibility: Add proper ARIA labels
- I18n: Use `$t()` for all user-facing text

### Database Considerations

- Support all database types (PostgreSQL, MySQL, SQLite, SQL Server)
- Test queries across different database engines
- Use Knex abstractions rather than database-specific SQL
- Consider migration compatibility

### Common Pitfalls to Avoid

1. **Don't use `npm` or `yarn`**: Only use `pnpm`
2. **Don't commit to `master`**: Always target `develop`
3. **Don't skip the bootstrap**: Run `pnpm run bootstrap` after clean install
4. **Don't ignore TypeScript errors**: Fix all type errors
5. **Don't modify generated files**: Files in `dist/`, `.output/`, etc.
6. **Don't commit secrets**: Check `.env` files are in `.gitignore`

### Performance Tips

- Use proper indexing in database queries
- Implement pagination for list endpoints
- Use DataLoader for N+1 query prevention
- Optimize bundle size (code splitting, tree shaking)
- Use caching where appropriate (Redis integration available)

## Quick Reference Commands

```bash
# Install dependencies
pnpm install

# Bootstrap monorepo
pnpm run bootstrap

# Start backend (default SQLite)
pnpm --filter=nocodb run start

# Start frontend
pnpm --filter=nc-gui run dev

# Run tests
pnpm --filter=nocodb run test                    # Backend unit tests
pnpm --filter=nc-gui run test                    # Frontend unit tests
cd tests/playwright && pnpm test                 # E2E tests

# Build
pnpm --filter=nocodb-sdk run build               # SDK
pnpm --filter=nocodb run build                   # Backend
pnpm --filter=nc-gui run build                   # Frontend

# Linting
pnpm --filter=nocodb run lint                    # Backend
pnpm --filter=nc-gui run lint                    # Frontend

# Docker
docker-compose -f docker-compose/2_pg/docker-compose.yml up -d

# Database containers for testing
pnpm run start:mysql
pnpm run start:pg
```

## Getting Help

- **Documentation**: https://docs.nocodb.com/engineering/development-setup
- **Discord**: https://discord.gg/5RgZmkW
- **GitHub Issues**: https://github.com/nocodb/nocodb/issues
- **Community**: https://community.nocodb.com/

---

**Last Updated**: 2025-12-01

This guide is maintained for AI assistants working on NocoDB. For human-readable documentation, refer to the official docs at https://docs.nocodb.com/.
