import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUiStore } from '@/stores/useUiStore'
import { initializeTheme } from '@/lib/theme'
import { initializeSocket, disconnectSocket } from '@/lib/socket'
import PrivateRoute from '@/components/PrivateRoute'
import GlobalChatPopup from '@/components/GlobalChatPopup'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import HomePage from '@/pages/HomePage'
import ProfilePage from '@/pages/ProfilePage'
import PostDetailPage from '@/pages/PostDetailPage'
// import ShareDetailPage from '@/pages/ShareDetailPage'
import SearchResultsPage from '@/pages/SearchResultsPage'
import ConnectionsPage from '@/pages/ConnectionsPage'
import MessagesPage from '@/pages/MessagesPage'
import LearnMorePage from '@/pages/LearnMorePage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import AboutPage from '@/pages/AboutPage'

function App() {
  const { isAuthenticated, getMe, token } = useAuthStore()
  const theme = useUiStore((state) => state.theme)

  // Initialize theme immediately
  useEffect(() => {
    initializeTheme()
  }, [])

  // Apply theme changes
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark')
    document.documentElement.classList.add(theme)
  }, [theme])

  // Restore user session on app load
  useEffect(() => {
    getMe()
  }, [getMe])

  // Initialize Socket.io when authenticated
  useEffect(() => {
    if (isAuthenticated && token) {
      initializeSocket(token)
      return () => {
        disconnectSocket()
      }
    }
  }, [isAuthenticated, token])

  return (
    <>
      <Toaster position="top-center" richColors />
      <Router
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
      {isAuthenticated && <GlobalChatPopup />}
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginPage />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <RegisterPage />} 
        />
        <Route 
          path="/forgot-password" 
          element={isAuthenticated ? <Navigate to="/home" replace /> : <ForgotPasswordPage />} 
        />
        <Route path="/learn-more" element={<LearnMorePage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Protected Routes */}
        <Route
          path="/home"
          element={
            <PrivateRoute>
              <HomePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile/:username"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route
          path="/post/:postId"
          element={
            <PrivateRoute>
              <PostDetailPage />
            </PrivateRoute>
          }
        />
        {/* <Route
          path="/share/:shareId"
          element={
            <PrivateRoute>
              <ShareDetailPage />
            </PrivateRoute>
          }
        /> */}
        <Route
          path="/search"
          element={
            <PrivateRoute>
              <SearchResultsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/connections"
          element={
            <PrivateRoute>
              <ConnectionsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <PrivateRoute>
              <MessagesPage />
            </PrivateRoute>
          }
        />

        {/* Catch all - redirect to landing or home based on auth */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} 
        />
      </Routes>
    </Router>
    </>
  )
}

export default App
