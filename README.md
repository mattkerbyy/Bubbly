# Bubbly

**Built With:** PostgreSQL · Express.js · React · Node.js · Tailwind CSS · Shadcn UI · Prisma · VS Code (Full‑stack social media platform project showcasing modern web development practices, RESTful APIs, and responsive design.)

---

## 📋 Project Overview

Bubbly is a full-stack social media platform that allows users to connect, share posts, interact with content, and build their social network. This project demonstrates proficiency in the PERN stack (PostgreSQL, Express, React, Node.js) along with modern tools like Prisma ORM, Tailwind CSS, and Shadcn UI.

## 🚀 Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Prisma** - Next-generation ORM
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing

### Frontend
- **React** - UI library
- **Vite** - Fast build tool
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Accessible component library
- **Axios** - HTTP client

## 📁 Project Structure

```
Bubbly/
├── .github/
│   └── copilot-instructions.md    # GitHub Copilot coding guidelines
├── back-end/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── controllers/           # Route controllers
│   │   ├── routes/                # API routes
│   │   ├── middleware/            # Custom middleware
│   │   ├── utils/                 # Helper functions
│   │   └── server.js              # Entry point
│   ├── .env.example               # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── README.md                  # Backend documentation
├── front-end/
│   ├── src/
│   │   ├── components/            # React components
│   │   │   └── ui/               # Shadcn UI components
│   │   ├── pages/                # Page components
│   │   ├── lib/                  # Utilities
│   │   ├── hooks/                # Custom hooks
│   │   ├── services/             # API services
│   │   ├── context/              # Context providers
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── components.json           # Shadcn UI config
│   ├── tailwind.config.js        # Tailwind config
│   ├── vite.config.js            # Vite config
│   ├── .env.example              # Environment variables template
│   ├── .gitignore
│   ├── package.json
│   └── README.md                 # Frontend documentation
└── README.md                     # Main documentation
```

## 🛠️ Setup Instructions

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **npm** or **yarn** package manager
- **Git** for version control

### Step 1: Clone the Repository

```powershell
git clone https://github.com/mattkerbyy/Bubbly.git
cd Bubbly
```

### Step 2: Backend Setup

1. Navigate to the backend directory:
```powershell
cd back-end
```

2. Install dependencies:
```powershell
npm install
```

3. Set up environment variables:
```powershell
cp .env.example .env
```

4. Edit `.env` file with your configuration:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/bubbly_db?schema=public"
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

5. Create PostgreSQL database:
```sql
CREATE DATABASE bubbly_db;
```

6. Generate Prisma Client:
```powershell
npm run prisma:generate
```

7. Run database migrations:
```powershell
npm run prisma:migrate
```

8. Start the development server:
```powershell
npm run dev
```

Backend will run on `http://localhost:5000`

### Step 3: Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
```powershell
cd front-end
```

2. Install dependencies:
```powershell
npm install
```

3. Set up environment variables:
```powershell
cp .env.example .env
```

4. Edit `.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

5. Start the development server:
```powershell
npm run dev
```

Frontend will run on `http://localhost:5173`

### Step 4: Verify Setup

1. Open your browser and go to `http://localhost:5173`
2. You should see the Bubbly welcome page
3. Check backend health: `http://localhost:5000/api/health`

## 📚 Development Guide

### Backend Development

#### Adding New Routes

1. Create a controller in `src/controllers/`:
```javascript
// src/controllers/userController.js
export const getUsers = async (req, res) => {
  // Implementation
};
```

2. Create a route in `src/routes/`:
```javascript
// src/routes/userRoutes.js
import express from 'express';
import { getUsers } from '../controllers/userController.js';

const router = express.Router();
router.get('/', getUsers);

export default router;
```

3. Register route in `server.js`:
```javascript
import userRoutes from './routes/userRoutes.js';
app.use('/api/users', userRoutes);
```

#### Working with Prisma

1. Modify schema in `prisma/schema.prisma`
2. Create migration:
```powershell
npm run prisma:migrate
```

3. Use Prisma Studio to view data:
```powershell
npm run prisma:studio
```

### Frontend Development

#### Adding Shadcn UI Components

```powershell
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add input
npx shadcn@latest add avatar
npx shadcn@latest add dialog
```

#### Creating New Pages

1. Create component in `src/pages/`:
```jsx
// src/pages/Home.jsx
export default function Home() {
  return <div>Home Page</div>;
}
```

2. Add route in `App.jsx`:
```jsx
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

<Routes>
  <Route path="/" element={<Home />} />
</Routes>
```

#### Making API Calls

1. Create service in `src/services/`:
```javascript
// src/services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
});

export const getUsers = () => api.get('/users');
```

## 🎯 Features to Implement

- [ ] User authentication (register, login, logout)
- [ ] User profiles (view, edit)
- [ ] Create, read, update, delete posts
- [ ] Like/unlike posts
- [ ] Comment on posts
- [ ] Follow/unfollow users
- [ ] User feed (posts from followed users)
- [ ] Search functionality
- [ ] Image uploads
- [ ] Dark mode
- [ ] Notifications

## 📖 Available Scripts

### Backend (`/back-end`)
```powershell
npm run dev              # Start development server with nodemon
npm start                # Start production server
npm run prisma:generate  # Generate Prisma Client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

### Frontend (`/front-end`)
```powershell
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
```

## 🔧 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Check database exists: `psql -l`

### Port Already in Use
- Backend: Change PORT in `back-end/.env`
- Frontend: Change port in `front-end/vite.config.js`

### Prisma Issues
- Delete `node_modules` and reinstall
- Run `npm run prisma:generate` again
- Clear Prisma cache: `npx prisma generate --clear-cache`

## 📝 Documentation

- [Backend Documentation](./back-end/README.md)
- [Frontend Documentation](./front-end/README.md)
- [GitHub Copilot Instructions](./.github/copilot-instructions.md)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Shadcn UI Documentation](https://ui.shadcn.com)

## 🤝 Contributing

This is a personal learning project, but suggestions and feedback are welcome!

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Matt Kerby**
- GitHub: [@mattkerbyy](https://github.com/mattkerbyy)

---

**Happy Coding! 🎉**
