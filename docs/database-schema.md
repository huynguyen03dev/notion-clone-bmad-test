# Database Schema Documentation

## Overview

The Kanban Board application uses PostgreSQL 15 with Prisma ORM for type-safe database operations. The schema is designed for optimal performance with strategic indexing and proper relationships.

## Core Entities

### User
Stores user authentication and profile information.

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Relationships:**
- One-to-many with Board (as owner)
- Many-to-many with Board (through BoardCollaborator)
- One-to-many with Task (as assignee)

### Board
Represents a kanban board container.

```prisma
model Board {
  id          String   @id @default(cuid())
  name        String   @db.VarChar(100)
  description String?  @db.Text
  ownerId     String
  isPublic    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

**Indexes:**
- `ownerId` - For efficient owner queries
- `updatedAt` - For recent boards sorting
- `isPublic` - For public board discovery

### Column
Organizes tasks within a board.

```prisma
model Column {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(100)
  boardId   String
  position  Int
  color     String?  @db.VarChar(7)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Constraints:**
- Unique constraint on `(boardId, position)` for ordering
- Cascade delete when board is deleted

### Task
Individual work items within columns.

```prisma
model Task {
  id          String       @id @default(cuid())
  title       String       @db.VarChar(200)
  description String?      @db.Text
  columnId    String
  boardId     String       // Denormalized for performance
  assigneeId  String?
  priority    TaskPriority @default(MEDIUM)
  dueDate     DateTime?
  position    Int
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}
```

**Performance Features:**
- Denormalized `boardId` for efficient board-level queries
- Composite unique constraint on `(columnId, position)`
- Strategic indexes on `boardId`, `assigneeId`, `dueDate`, `priority`

### BoardCollaborator
Manages user permissions on boards.

```prisma
model BoardCollaborator {
  id       String          @id @default(cuid())
  boardId  String
  userId   String
  role     CollaboratorRole
  invitedAt DateTime       @default(now())
  joinedAt DateTime?
}
```

**Roles:**
- `VIEWER` - Read-only access
- `EDITOR` - Can modify tasks and columns
- `ADMIN` - Full board management

## Enums

### TaskPriority
```prisma
enum TaskPriority {
  LOW
  MEDIUM
  HIGH
}
```

### CollaboratorRole
```prisma
enum CollaboratorRole {
  VIEWER
  EDITOR
  ADMIN
}
```

## Performance Optimizations

### Strategic Indexing
- **Board queries**: Indexed on `ownerId`, `updatedAt`, `isPublic`
- **Task queries**: Indexed on `boardId`, `assigneeId`, `dueDate`, `priority`
- **Collaboration**: Indexed on `userId` for user's boards lookup

### Denormalization
- Tasks include `boardId` for efficient board-level operations
- Avoids expensive joins for common queries

### Connection Pooling
- Configured for 20 connections (development) / 50 connections (production)
- Pool timeout: 20s (development) / 30s (production)
- Connect timeout: 10s

## Data Integrity

### Cascade Behavior
- **Board deletion**: Cascades to columns, tasks, and collaborators
- **User deletion**: Sets task assigneeId to null (preserves task history)
- **Column deletion**: Cascades to tasks

### Constraints
- Unique email addresses
- Unique board collaborations (user can't be added twice)
- Ordered positions within columns and boards

## Migration Strategy

### Development
```bash
# Create and apply migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

### Production
```bash
# Apply migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## Seeding

The database includes a comprehensive seeding script with:
- 4 sample users with realistic profiles
- 3 boards with different collaboration patterns
- 8 columns across boards
- 7 tasks with various priorities and assignments
- 4 board collaborations with different roles

```bash
# Run seeding
pnpm db:seed
```

## Health Monitoring

The `/api/health` endpoint provides comprehensive database monitoring:
- Connection status and response time
- Migration status
- Connection pool metrics
- Error classification and recovery

## Security Considerations

- Environment variables for database credentials
- Connection pooling limits to prevent resource exhaustion
- Proper cascade behavior to maintain data integrity
- Role-based access control through BoardCollaborator

## Backup and Recovery

- Docker volume persistence for local development
- Production databases should implement regular backups
- Migration rollback procedures documented
- Connection recovery mechanisms for transient failures
