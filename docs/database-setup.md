# Database Setup Guide

## Prerequisites

1. **Docker Desktop** must be running for local development
2. **PostgreSQL 15** via Docker Compose configuration

## Database Startup

Start the PostgreSQL database:

```bash
# Start database container
docker-compose up -d

# Verify database is running
docker-compose ps

# Check database health
docker-compose logs postgres
```

## Migration Commands

```bash
# Generate Prisma client (after schema changes)
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View database in Prisma Studio
npx prisma studio
```

## Database Connection

- **Local Development**: `postgresql://kanban_user:kanban_password@localhost:5432/kanban_db`
- **Docker Container**: Configured in `docker-compose.yml`
- **Health Check**: Available at `/api/health` endpoint

## Troubleshooting

### Database Connection Issues

1. **Docker not running**: Start Docker Desktop
2. **Port conflicts**: Check if port 5432 is available
3. **Container issues**: Run `docker-compose down && docker-compose up -d`

### Migration Issues

1. **Schema conflicts**: Use `npx prisma migrate reset` for development
2. **Connection timeout**: Verify database is healthy
3. **Permission errors**: Check database user permissions

## Schema Overview

The database includes:
- **Users**: Authentication and user management
- **Boards**: Kanban board containers
- **Columns**: Board organization structure
- **Tasks**: Individual work items
- **BoardCollaborators**: User permissions and access control
- **NextAuth tables**: Session and account management
