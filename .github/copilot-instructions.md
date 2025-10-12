# GitHub Copilot Instructions for Bubbly

## Project Overview

**Bubbly** is a full-stack social media platform project built with the PERN stack (PostgreSQL, Express.js, React, Node.js) plus Tailwind CSS, Shadcn UI, and Prisma ORM.

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework for REST API
- **PostgreSQL** - Relational database
- **Prisma** - ORM for database management
- **JWT** - Authentication & authorization
- **Bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library
- **Axios** - HTTP client for API requests

## Code Style & Conventions

### General
- Use ES6+ syntax and modern JavaScript features
- Use ESLint for linting
- Write clean, readable, and maintainable code
- Add comments for complex logic
- Use meaningful variable and function names

### Backend (Express.js)
- Use ES modules (`import`/`export`) instead of CommonJS
- Keep route handlers in separate controller files
- Use middleware for authentication, validation, and error handling
- Follow RESTful API conventions
- Structure: `routes → controllers → services → Prisma`
- Use async/await for asynchronous operations
- Implement proper error handling with try-catch blocks
- Validate all incoming data with express-validator

### Frontend (React)
- Use functional components with hooks
- Keep components small and focused (single responsibility)
- Use custom hooks for reusable logic
- Follow React best practices (avoid prop drilling, use context when needed)
- Use Tailwind CSS for styling (no inline styles)
- Use Shadcn UI components for consistent UI
- Organize components: `/components/ui` for Shadcn, `/components` for custom
- Use the `cn()` utility for conditional classNames

### File Naming
- Backend: camelCase for files (e.g., `userController.js`, `authMiddleware.js`)
- Frontend: PascalCase for components (e.g., `UserProfile.jsx`, `PostCard.jsx`)
- Lowercase for utilities and configs (e.g., `utils.js`, `api.js`)

### API Design
- Base URL: `/api`
- RESTful endpoints:
  - `GET /api/users` - Get all users
  - `GET /api/users/:id` - Get single user
  - `POST /api/users` - Create user
  - `PUT /api/users/:id` - Update user
  - `DELETE /api/users/:id` - Delete user
- Use proper HTTP status codes (200, 201, 400, 401, 404, 500)
- Return consistent JSON responses with `{ success, data, error }` structure

### Database (Prisma)
- Define all models in `schema.prisma`
- Use descriptive model and field names
- Always include `createdAt` and `updatedAt` timestamps
- Use proper relations (@relation, @id, @unique, @@index)
- Run migrations after schema changes
- Use Prisma Client for all database operations

### State Management
- Use React Context API for global state (auth, theme, etc.)
- Use local state (useState) for component-specific state
- Consider useReducer for complex state logic

### Authentication
- Implement JWT-based authentication
- Store tokens in httpOnly cookies (recommended) or localStorage
- Protect routes on both frontend and backend
- Implement refresh token strategy for better security

## Project Structure

```
Bubbly/
├── .github/
│   └── copilot-instructions.md
├── back-end/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── server.js
│   ├── .env
│   ├── .gitignore
│   └── package.json
├── front-end/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   └── ui/
│   │   ├── pages/
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── context/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── components.json
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Features to Implement

### Core Features
- User authentication (register, login, logout)
- User profiles (view, edit)
- Create, read, update, delete posts
- Like/unlike posts
- Comment on posts
- Follow/unfollow users
- User feed (posts from followed users)
- Search users and posts

### Nice-to-Have Features
- Real-time notifications
- Image upload for posts and avatars
- Dark mode toggle
- Infinite scroll for feeds
- Post sharing
- Hashtags
- Direct messaging

## Important Reminders

1. **Security First**: Always validate and sanitize user inputs
2. **Performance**: Optimize database queries with proper indexes
3. **Accessibility**: Use semantic HTML and ARIA labels
4. **Responsive Design**: Ensure mobile-first approach with Tailwind
5. **Error Handling**: Provide clear error messages to users
6. **Code Reusability**: Create reusable components and utilities
7. **Testing**: Write tests for critical functionality (when applicable)

## Getting Started

1. Install dependencies in both `/back-end` and `/front-end`
2. Set up PostgreSQL database
3. Configure environment variables
4. Run Prisma migrations
5. Start backend server (`npm run dev`)
6. Start frontend dev server (`npm run dev`)

## Useful Commands

### Backend
```bash
npm run dev              # Start development server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

### Frontend
```bash
npm run dev              # Start development server
npm run build            # Build for production
npx shadcn@latest add    # Add Shadcn UI component
```

---

When generating code for this project, please follow these instructions to maintain consistency and quality across the codebase.
