# Development Workflow

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8.14+
- Docker and Docker Compose

### Initial Setup
1. Clone the repository
2. Install dependencies: `pnpm install`
3. Copy environment variables: `cp .env.example .env`
4. Start database: `docker-compose up -d`
5. Run migrations: `npx prisma migrate dev`
6. Start development server: `pnpm dev`

## Development Commands

### Core Development
- `pnpm dev` - Start development server with Turbo
- `pnpm build` - Build for production
- `pnpm start` - Start production server

### Code Quality
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint issues
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm type-check` - Run TypeScript type checking

### Testing
- `pnpm test` - Run tests in watch mode
- `pnpm test:run` - Run tests once
- `pnpm test:ui` - Run tests with UI
- `pnpm test:coverage` - Run tests with coverage

### Database
- `npx prisma migrate dev` - Create and apply migration
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio
- `npx prisma migrate reset` - Reset database

## Code Standards

### TypeScript
- Use strict mode
- Define proper types for all functions and components
- Avoid `any` type unless absolutely necessary

### React Components
- Use functional components with hooks
- Follow naming conventions (PascalCase for components)
- Use proper prop types

### Styling
- Use TailwindCSS utility classes
- Follow shadcn/ui component patterns
- Maintain consistent spacing and typography

### Testing
- Write tests for all new components and functions
- Use React Testing Library for component tests
- Maintain good test coverage

## Git Workflow

### Commit Messages
Follow conventional commit format:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Test changes
- `chore:` - Build/tooling changes

### Pre-commit Hooks
The project uses Husky and lint-staged to run:
- ESLint with auto-fix
- Prettier formatting
- Type checking

## Project Structure

### Key Directories
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - Reusable React components
- `src/lib/` - Utility functions and configurations
- `src/types/` - TypeScript type definitions
- `src/test/` - Test utilities and setup
- `prisma/` - Database schema and migrations
- `docs/` - Project documentation

### Component Organization
- `components/ui/` - Basic UI components (shadcn/ui)
- `components/layout/` - Layout components
- `components/features/` - Feature-specific components

## Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Authentication secret
- `NEXTAUTH_URL` - Application URL

### Development vs Production
- Use `.env.local` for local overrides
- Never commit sensitive environment variables
- Use proper environment validation

## Troubleshooting

### Common Issues
1. **Database connection errors**: Check Docker container status
2. **Type errors**: Run `npx prisma generate` after schema changes
3. **Build errors**: Clear `.next` cache with `pnpm clean`
4. **Test failures**: Check test setup and mocks

### Performance
- Use Next.js built-in optimizations
- Implement proper caching strategies
- Monitor bundle size with `pnpm build`

## Deployment

### Production Build
1. Run `pnpm build` to create production build
2. Test with `pnpm start`
3. Ensure all environment variables are set
4. Run database migrations in production

### Docker Deployment
The project includes Docker Compose for easy deployment:
1. Update environment variables
2. Run `docker-compose up -d`
3. Access application at configured port
