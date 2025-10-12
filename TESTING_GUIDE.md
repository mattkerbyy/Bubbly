# Testing Guide - Bubbly Authentication Flow

## Prerequisites Checklist

Before testing, ensure you have completed:

- ✅ PostgreSQL database `bubbly_db` created
- ✅ Backend `.env` file configured with `DATABASE_URL` and `JWT_SECRET`
- ✅ Frontend `.env` file configured with `VITE_API_URL=http://localhost:5000/api`
- ✅ Dependencies installed in both `back-end/` and `front-end/`
- ✅ Prisma migrations run

---

## Quick Start Testing

### Step 1: Start the Backend Server

Open a PowerShell terminal in the `back-end/` directory:

```powershell
cd back-end
npm run dev
```

**Expected Output:**
```
Server running on http://localhost:5000
Database connected successfully
```

**Troubleshooting:**
- If you see database connection errors, verify your `DATABASE_URL` in `.env`
- If port 5000 is in use, change `PORT` in `.env` and update frontend `VITE_API_URL`

---

### Step 2: Start the Frontend Development Server

Open a **NEW** PowerShell terminal in the `front-end/` directory:

```powershell
cd front-end
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open your browser:** Navigate to `http://localhost:5173/`

---

## Test Scenarios

### 🧪 Test 1: Landing Page (Unauthenticated)

**Steps:**
1. Open `http://localhost:5173/`
2. You should see the Bubbly landing page with:
   - Hero section with "Connect, Share, Inspire" headline
   - 6 feature cards (Real-time Chat, Share Moments, etc.)
   - "Get Started" and "Learn More" buttons
   - Animated elements using Framer Motion

**Expected Behavior:**
- ✅ All animations load smoothly
- ✅ Clicking "Get Started" → redirects to `/register`
- ✅ Clicking "Log In" → redirects to `/login`
- ✅ Page is fully responsive (test on mobile width)

---

### 🧪 Test 2: User Registration

**Steps:**
1. Navigate to `http://localhost:5173/register`
2. Fill out the registration form:
   - **Full Name:** John Doe
   - **Username:** johndoe
   - **Email:** john@example.com
   - **Password:** TestPass123
   - **Confirm Password:** TestPass123

3. Observe the password strength indicator (should show all 4 checkmarks green)
4. Click "Create Account"

**Expected Behavior:**
- ✅ Password requirements update in real-time (green checkmarks)
- ✅ Form validation works (try submitting with invalid data first)
- ✅ Loading spinner appears on button during submission
- ✅ On success: redirect to `/home` (HomePage)
- ✅ User data is stored in database (check with Prisma Studio or pgAdmin)

**Backend Verification:**
Open Prisma Studio to verify the user was created:
```powershell
cd back-end
npx prisma studio
```
- Check the `User` table for the new user entry
- Verify password is hashed (should NOT be plain text)

---

### 🧪 Test 3: User Login

**Steps:**
1. If already logged in, click "Log Out" in the top right
2. Navigate to `http://localhost:5173/login`
3. Enter credentials:
   - **Email:** john@example.com
   - **Password:** TestPass123
4. Click "Log in"

**Expected Behavior:**
- ✅ Loading skeleton appears during submission
- ✅ Password visibility toggle works (eye icon)
- ✅ On success: redirect to `/home`
- ✅ Error message displays if credentials are wrong
- ✅ JWT token is stored in localStorage (check DevTools → Application → Local Storage → `bubbly-auth`)

---

### 🧪 Test 4: Protected Routes (Home Page)

**Steps:**
1. After logging in, you should be on `http://localhost:5173/home`
2. Verify the HomePage displays:
   - **Header:** Bubbly logo, user avatar, and logout button
   - **Left Sidebar:** Menu with Home, Profile, Messages, Notifications, Search
   - **Main Content:** Welcome message, authentication status, user details
   - **Right Sidebar:** Suggested users

**Expected Behavior:**
- ✅ User avatar shows initials (e.g., "JD" for John Doe)
- ✅ User name and username display correctly
- ✅ All user details match registration data
- ✅ Page layout is responsive (3-column on desktop, stacked on mobile)

---

### 🧪 Test 5: Route Protection

**Steps:**
1. While logged in, try to access:
   - `http://localhost:5173/login` → should redirect to `/home`
   - `http://localhost:5173/register` → should redirect to `/home`
   - `http://localhost:5173/` → should redirect to `/home`

2. Click "Log Out" button (top right)
3. Now try to access:
   - `http://localhost:5173/home` → should redirect to `/login`
   - Any invalid route → should redirect to `/` (landing page)

**Expected Behavior:**
- ✅ Authenticated users can't access login/register pages
- ✅ Unauthenticated users can't access protected pages
- ✅ Redirects happen automatically without errors

---

### 🧪 Test 6: Session Persistence

**Steps:**
1. Log in to your account
2. Navigate to `/home`
3. **Refresh the page** (F5 or Ctrl+R)
4. **Close the browser tab** and reopen `http://localhost:5173/`

**Expected Behavior:**
- ✅ After refresh: user remains logged in
- ✅ After closing/reopening: user remains logged in
- ✅ User data persists in localStorage
- ✅ Token is automatically attached to API requests

---

### 🧪 Test 7: Logout Functionality

**Steps:**
1. While logged in on `/home`, click the logout icon (top right)

**Expected Behavior:**
- ✅ User is immediately redirected to `/login`
- ✅ Attempting to access `/home` redirects back to `/login`
- ✅ localStorage is cleared (check DevTools → Application → Local Storage)
- ✅ Authorization header is removed from axios

---

### 🧪 Test 8: Form Validation

Test all validation rules:

**Registration Page:**
- [ ] Empty name → "Name is required"
- [ ] Name < 2 chars → "Name must be at least 2 characters"
- [ ] Empty username → "Username is required"
- [ ] Username < 3 chars → "Username must be at least 3 characters"
- [ ] Username with spaces → "Username can only contain letters, numbers, and underscores"
- [ ] Invalid email → "Email is invalid"
- [ ] Password < 8 chars → "Password must be at least 8 characters"
- [ ] Password missing uppercase → Password requirements indicator
- [ ] Password missing number → Password requirements indicator
- [ ] Passwords don't match → "Passwords do not match"

**Login Page:**
- [ ] Empty email → "Email is required"
- [ ] Invalid email format → "Email is invalid"
- [ ] Empty password → "Password is required"
- [ ] Wrong credentials → Server error message displays

---

### 🧪 Test 9: API Integration

**Backend Health Check:**
Open a browser or use curl to test:
```
http://localhost:5000/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API is running"
}
```

**Test Auth Endpoints:**

Using your browser's DevTools Console (after logging in), check the Network tab:
1. Filter by "Fetch/XHR"
2. Look for requests to:
   - `POST /api/auth/register` → Status 201 (Created)
   - `POST /api/auth/login` → Status 200 (OK)
   - `GET /api/auth/me` → Status 200 (OK)

**Expected Headers:**
- Request should include `Authorization: Bearer <token>`
- Response should return user data

---

### 🧪 Test 10: Error Handling

**Test Network Errors:**
1. Stop the backend server (Ctrl+C in backend terminal)
2. Try to log in on the frontend

**Expected Behavior:**
- ✅ Error message displays: "Login failed. Please try again."
- ✅ Loading spinner stops
- ✅ Form remains functional

**Test Duplicate Registration:**
1. Register a user with email `test@example.com`
2. Try to register again with the same email

**Expected Behavior:**
- ✅ Backend returns error (400 or 409 status)
- ✅ Error message displays in UI
- ✅ Form allows user to correct and retry

---

## Database Verification

### Using Prisma Studio

```powershell
cd back-end
npx prisma studio
```

**Check:**
1. **User Table:**
   - All registered users appear
   - Passwords are hashed (bcrypt format: `$2b$...`)
   - `createdAt` and `updatedAt` timestamps are correct

2. **Data Integrity:**
   - `id` is a valid CUID
   - `email` and `username` are unique
   - No duplicate entries

### Using pgAdmin (Optional)

1. Open pgAdmin
2. Navigate to: `Servers → bubbly_db → Schemas → public → Tables → User`
3. Right-click → View/Edit Data → All Rows
4. Verify user records match frontend registration

---

## Common Issues & Solutions

### ❌ "Cannot connect to database"
**Solution:**
- Verify PostgreSQL is running: `Get-Service postgresql-*` (PowerShell)
- Check `DATABASE_URL` in `back-end/.env` matches your database credentials
- Test connection: `npx prisma db pull` in `back-end/`

### ❌ "Network Error" / "ERR_CONNECTION_REFUSED"
**Solution:**
- Backend server must be running on port 5000
- Check `VITE_API_URL` in `front-end/.env` is `http://localhost:5000/api`
- Verify CORS settings in `back-end/src/server.js` allow `http://localhost:5173`

### ❌ "Token is not defined" / "Authorization failed"
**Solution:**
- Clear localStorage: DevTools → Application → Local Storage → Delete all
- Log out and log back in
- Verify JWT_SECRET is set in backend `.env`

### ❌ "User already exists"
**Solution:**
- This is expected behavior (email/username must be unique)
- Use a different email/username, or delete the existing user from database

### ❌ Prisma errors / "Table does not exist"
**Solution:**
```powershell
cd back-end
npx prisma migrate reset   # ⚠️ WARNING: Deletes all data
npx prisma migrate dev --name init
npx prisma generate
```

---

## Performance Testing

### Load Time Benchmarks

**Landing Page:**
- Initial load: < 2 seconds
- Animations: smooth 60fps

**Login/Register:**
- Form submission: < 1 second (with local backend)
- Validation: instant feedback

**HomePage:**
- Load time: < 1 second after auth
- User data fetch: < 500ms

---

## Browser Compatibility Testing

Test in multiple browsers:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if on macOS)

**Mobile Testing:**
- [ ] Chrome DevTools device emulation
- [ ] Responsive breakpoints: 375px, 768px, 1024px, 1440px
- [ ] Touch interactions work (buttons, forms)

---

## Next Steps After Testing

Once all tests pass ✅, you've successfully completed **Phase 1: Foundation & Authentication**!

### Phase 2 Preview: Posts & Feed (Weeks 3-4)

Next features to implement:
1. Create Post component with image upload
2. Post feed with infinite scroll
3. Like/unlike functionality
4. Comment system
5. Real-time updates with React Query

---

## Testing Checklist Summary

- [ ] Backend server starts without errors
- [ ] Frontend dev server starts on port 5173
- [ ] Landing page loads with animations
- [ ] Registration creates user in database
- [ ] Login authenticates and redirects to home
- [ ] Protected routes work (home page accessible only when logged in)
- [ ] Logout clears session and redirects
- [ ] Session persists after page refresh
- [ ] Form validation catches all error cases
- [ ] API endpoints respond correctly
- [ ] Error handling displays user-friendly messages
- [ ] Database stores data correctly (verified via Prisma Studio)
- [ ] Responsive design works on mobile/tablet/desktop

---

## Support & Documentation

- **README.md** - Project overview and setup
- **SETUP_GUIDE.md** - Detailed installation instructions
- **bubbly-implementation.md** - 12-week development roadmap
- **Copilot Instructions** - Coding standards and conventions

For issues, check:
1. Browser DevTools Console (F12) for JavaScript errors
2. Network tab for failed API requests
3. Backend terminal for server errors
4. PostgreSQL logs for database issues

---

**🎉 Happy Testing!** You're building something awesome with Bubbly! 🚀
