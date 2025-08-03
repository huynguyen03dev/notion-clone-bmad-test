# Database Connection Pooling Configuration

## Overview

The application uses Prisma Client with PostgreSQL connection pooling to handle 100+ concurrent users efficiently.

## Configuration

### Environment Variables

Connection pooling is configured via DATABASE_URL parameters:

```bash
# Development (local)
DATABASE_URL="postgresql://kanban_user:kanban_password@localhost:5432/kanban_db?schema=public&connection_limit=20&pool_timeout=20"

# Production (recommended settings)
DATABASE_URL="postgresql://user:pass@host:port/db?schema=public&connection_limit=50&pool_timeout=30&connect_timeout=10"
```

### Connection Pool Parameters

| Parameter | Development | Production | Description |
|-----------|-------------|------------|-------------|
| `connection_limit` | 20 | 50 | Maximum number of database connections |
| `pool_timeout` | 20s | 30s | Time to wait for available connection |
| `connect_timeout` | 10s | 10s | Time to wait for initial connection |

## Monitoring

### Connection Pool Status

Use the built-in monitoring utilities:

```typescript
import { getConnectionPoolStatus } from '@/lib/db'

const status = await getConnectionPoolStatus()
console.log(status)
```

### Health Check Integration

The `/api/health` endpoint includes connection pool monitoring:

```bash
curl http://localhost:3000/api/health
```

Response includes:
- Connection status
- Pool metrics (if available)
- Response time
- Error details (if any)

## Performance Optimization

### Best Practices

1. **Connection Reuse**: Use the singleton Prisma client instance
2. **Graceful Shutdown**: Call `disconnectDatabase()` on app termination
3. **Retry Logic**: Use `withRetry()` for transient connection failures
4. **Monitoring**: Regular health checks and metrics collection

### Load Testing

Test connection pool under concurrent load:

```bash
# Install artillery for load testing
npm install -g artillery

# Create load test configuration
artillery quick --count 100 --num 10 http://localhost:3000/api/health
```

### Scaling Guidelines

| Concurrent Users | Connection Limit | Pool Timeout | Notes |
|------------------|------------------|--------------|-------|
| 1-50 | 10-20 | 20s | Development/small teams |
| 50-100 | 20-30 | 25s | Medium applications |
| 100-500 | 30-50 | 30s | Production applications |
| 500+ | 50+ | 30s+ | Consider read replicas |

## Troubleshooting

### Common Issues

1. **Connection Pool Exhausted**
   - Increase `connection_limit`
   - Reduce `pool_timeout`
   - Check for connection leaks

2. **Slow Queries**
   - Monitor query performance
   - Add database indexes
   - Optimize query patterns

3. **Connection Timeouts**
   - Increase `connect_timeout`
   - Check network connectivity
   - Verify database server health

### Error Handling

The application includes automatic retry logic for:
- Connection timeouts
- Network interruptions
- Database server restarts
- Pool exhaustion (with exponential backoff)

### Monitoring Alerts

Set up alerts for:
- Connection pool utilization > 80%
- Average response time > 1000ms
- Connection failures > 5% error rate
- Database server CPU/memory usage
