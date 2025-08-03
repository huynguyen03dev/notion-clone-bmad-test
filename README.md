# Kanban Board Application

A modern, collaborative kanban board application built with Next.js 14+, TypeScript, and TailwindCSS. This application provides real-time collaboration capabilities for distributed teams with a clean, accessible UI.

## 🚀 Features

- **Modern Tech Stack**: Next.js 14+ with App Router, TypeScript, TailwindCSS
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations
- **UI Components**: shadcn/ui component library for consistent design
- **Code Quality**: ESLint, Prettier, and pre-commit hooks
- **Testing**: Vitest with React Testing Library
- **Package Management**: pnpm with workspace configuration
- **Build Optimization**: Turborepo for monorepo build caching

## 📋 Prerequisites

- Node.js 18+
- pnpm 8.14+
- Docker and Docker Compose (for local database)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Configuration

Copy the environment variables:

```bash
cp .env.example .env
```

Required environment variables:
- `DATABASE_URL`: PostgreSQL connection string

### 3. Database Setup

Start the local PostgreSQL database:

```bash
docker-compose up -d
```

Run database migrations:

```bash
npx prisma migrate dev
```

Generate Prisma client:

```bash
npx prisma generate
```

### 4. Development Server

Start the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🧪 Testing

Run tests:

```bash
# Run tests once
pnpm test:run

# Run tests in watch mode
pnpm test

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage
```

## 🔧 Development Workflow

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type checking
pnpm type-check
```

### Database Operations

```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## 📁 Project Structure

```
src/
├── app/                 # Next.js App Router pages and layouts
│   ├── api/            # API routes
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # Reusable React components
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── lib/                # Utility functions and configurations
│   ├── db.ts           # Database connection
│   └── utils.ts        # Utility functions
├── test/               # Test utilities and setup
└── types/              # TypeScript type definitions
```

## 🐳 Docker Support

The project includes Docker Compose configuration for local development:

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs postgres
```

## 🔍 Health Checks

The application includes a health check endpoint:

- **Endpoint**: `/api/health`
- **Purpose**: Verify database connectivity and application status

## 📚 Technology Stack

- **Frontend**: Next.js 14.1+, React 18+, TypeScript 5.3+
- **Styling**: TailwindCSS 3.4+, shadcn/ui components
- **Database**: PostgreSQL 15+, Prisma ORM 5.8+
- **Testing**: Vitest 1.2+, React Testing Library 14+
- **Build Tools**: Turborepo 1.11+, pnpm 8.14+
- **Code Quality**: ESLint, Prettier, Husky, lint-staged

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Ensure all tests pass before submitting
4. Use conventional commit messages

## 📄 License

This project is licensed under the MIT License.
