import { PrismaClient, TaskPriority, CollaboratorRole } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean existing data in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 Cleaning existing data...')
    await prisma.task.deleteMany()
    await prisma.column.deleteMany()
    await prisma.boardCollaborator.deleteMany()
    await prisma.board.deleteMany()
    await prisma.user.deleteMany()
  }

  // Create sample users
  console.log('👥 Creating users...')
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john.doe@example.com',
        name: 'John Doe',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'jane.smith@example.com',
        name: 'Jane Smith',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'mike.johnson@example.com',
        name: 'Mike Johnson',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sarah.wilson@example.com',
        name: 'Sarah Wilson',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      },
    }),
  ])

  console.log(`✅ Created ${users.length} users`)

  // Create sample boards
  console.log('📋 Creating boards...')
  const boards = await Promise.all([
    prisma.board.create({
      data: {
        name: 'Website Redesign Project',
        description: 'Complete redesign of the company website with modern UI/UX',
        ownerId: users[0].id,
        isPublic: false,
      },
    }),
    prisma.board.create({
      data: {
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android platforms',
        ownerId: users[1].id,
        isPublic: true,
      },
    }),
    prisma.board.create({
      data: {
        name: 'Marketing Campaign Q1',
        description: 'First quarter marketing initiatives and campaigns',
        ownerId: users[0].id,
        isPublic: false,
      },
    }),
  ])

  console.log(`✅ Created ${boards.length} boards`)

  // Create board collaborators
  console.log('🤝 Creating board collaborators...')
  const collaborators = await Promise.all([
    // Website Redesign Project collaborators
    prisma.boardCollaborator.create({
      data: {
        boardId: boards[0].id,
        userId: users[1].id,
        role: CollaboratorRole.EDITOR,
        joinedAt: new Date(),
      },
    }),
    prisma.boardCollaborator.create({
      data: {
        boardId: boards[0].id,
        userId: users[2].id,
        role: CollaboratorRole.VIEWER,
        joinedAt: new Date(),
      },
    }),
    // Mobile App Development collaborators
    prisma.boardCollaborator.create({
      data: {
        boardId: boards[1].id,
        userId: users[0].id,
        role: CollaboratorRole.ADMIN,
        joinedAt: new Date(),
      },
    }),
    prisma.boardCollaborator.create({
      data: {
        boardId: boards[1].id,
        userId: users[3].id,
        role: CollaboratorRole.EDITOR,
        joinedAt: new Date(),
      },
    }),
  ])

  console.log(`✅ Created ${collaborators.length} collaborators`)

  // Create columns for each board
  console.log('📝 Creating columns...')
  const columns = []

  // Standard Kanban columns for Website Redesign
  const websiteColumns = await Promise.all([
    prisma.column.create({
      data: {
        name: 'Backlog',
        boardId: boards[0].id,
        position: 0,
        color: '#6B7280',
      },
    }),
    prisma.column.create({
      data: {
        name: 'In Progress',
        boardId: boards[0].id,
        position: 1,
        color: '#3B82F6',
      },
    }),
    prisma.column.create({
      data: {
        name: 'Review',
        boardId: boards[0].id,
        position: 2,
        color: '#F59E0B',
      },
    }),
    prisma.column.create({
      data: {
        name: 'Done',
        boardId: boards[0].id,
        position: 3,
        color: '#10B981',
      },
    }),
  ])

  // Development-focused columns for Mobile App
  const mobileColumns = await Promise.all([
    prisma.column.create({
      data: {
        name: 'Planning',
        boardId: boards[1].id,
        position: 0,
        color: '#8B5CF6',
      },
    }),
    prisma.column.create({
      data: {
        name: 'Development',
        boardId: boards[1].id,
        position: 1,
        color: '#3B82F6',
      },
    }),
    prisma.column.create({
      data: {
        name: 'Testing',
        boardId: boards[1].id,
        position: 2,
        color: '#F59E0B',
      },
    }),
    prisma.column.create({
      data: {
        name: 'Deployed',
        boardId: boards[1].id,
        position: 3,
        color: '#10B981',
      },
    }),
  ])

  columns.push(...websiteColumns, ...mobileColumns)
  console.log(`✅ Created ${columns.length} columns`)

  // Create sample tasks
  console.log('📋 Creating tasks...')
  const tasks = await Promise.all([
    // Website Redesign tasks
    prisma.task.create({
      data: {
        title: 'Design new homepage layout',
        description: 'Create wireframes and mockups for the new homepage design',
        columnId: websiteColumns[0].id,
        boardId: boards[0].id,
        assigneeId: users[1].id,
        priority: TaskPriority.HIGH,
        position: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      },
    }),
    prisma.task.create({
      data: {
        title: 'Implement responsive navigation',
        description: 'Build mobile-friendly navigation component with hamburger menu',
        columnId: websiteColumns[1].id,
        boardId: boards[0].id,
        assigneeId: users[2].id,
        priority: TaskPriority.MEDIUM,
        position: 0,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Optimize page load speed',
        description: 'Implement lazy loading and optimize images for better performance',
        columnId: websiteColumns[2].id,
        boardId: boards[0].id,
        assigneeId: users[0].id,
        priority: TaskPriority.HIGH,
        position: 0,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Set up analytics tracking',
        description: 'Configure Google Analytics and conversion tracking',
        columnId: websiteColumns[3].id,
        boardId: boards[0].id,
        assigneeId: users[1].id,
        priority: TaskPriority.LOW,
        position: 0,
      },
    }),
    // Mobile App tasks
    prisma.task.create({
      data: {
        title: 'User authentication flow',
        description: 'Design and implement login/signup screens with social auth',
        columnId: mobileColumns[0].id,
        boardId: boards[1].id,
        assigneeId: users[3].id,
        priority: TaskPriority.HIGH,
        position: 0,
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      },
    }),
    prisma.task.create({
      data: {
        title: 'Push notifications setup',
        description: 'Integrate Firebase Cloud Messaging for push notifications',
        columnId: mobileColumns[1].id,
        boardId: boards[1].id,
        assigneeId: users[1].id,
        priority: TaskPriority.MEDIUM,
        position: 0,
      },
    }),
    prisma.task.create({
      data: {
        title: 'App store submission',
        description: 'Prepare app store listings and submit for review',
        columnId: mobileColumns[2].id,
        boardId: boards[1].id,
        priority: TaskPriority.LOW,
        position: 0,
      },
    }),
  ])

  console.log(`✅ Created ${tasks.length} tasks`)

  console.log('🎉 Database seeding completed successfully!')
  console.log(`
📊 Summary:
- Users: ${users.length}
- Boards: ${boards.length}
- Collaborators: ${collaborators.length}
- Columns: ${columns.length}
- Tasks: ${tasks.length}
  `)
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
