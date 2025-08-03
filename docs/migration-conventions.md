# Database Migration Conventions

## Migration Naming

Use descriptive names that clearly indicate the change:

```bash
# Initial schema setup
npx prisma migrate dev --name initial_schema

# Adding new features
npx prisma migrate dev --name add_task_priority
npx prisma migrate dev --name add_board_collaborators

# Schema modifications
npx prisma migrate dev --name update_user_avatar_field
npx prisma migrate dev --name add_task_due_date_index

# Performance improvements
npx prisma migrate dev --name optimize_board_queries
npx prisma migrate dev --name add_composite_indexes
```

## Migration Best Practices

### Development
- Always test migrations on a copy of production data
- Use descriptive migration names
- Keep migrations small and focused
- Test rollback scenarios when possible

### Production
- Use `npx prisma migrate deploy` for production
- Never use `migrate dev` in production
- Always backup database before migrations
- Monitor migration performance

### Rollback Strategy
- Prisma doesn't support automatic rollbacks
- Plan manual rollback procedures for critical changes
- Test rollback procedures in staging environment
- Document rollback steps for complex migrations

## Migration Verification

After each migration:

1. **Schema validation**: `npx prisma validate`
2. **Client generation**: `npx prisma generate`
3. **Database inspection**: `npx prisma studio`
4. **Application testing**: Run full test suite
5. **Performance check**: Verify query performance

## Common Migration Patterns

### Adding New Tables
```prisma
model NewEntity {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Adding Relationships
```prisma
// Add foreign key
model Task {
  assigneeId String?
  assignee   User?   @relation(fields: [assigneeId], references: [id])
}
```

### Adding Indexes
```prisma
model Task {
  // Add index for performance
  @@index([boardId, priority])
}
```

### Modifying Constraints
```prisma
model User {
  email String @unique // Adding unique constraint
}
```
