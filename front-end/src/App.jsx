import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUiStore } from '@/stores/useUiStore'
import { initializeTheme } from '@/lib/theme'
import { initializeSocket, disconnectSocket } from '@/lib/socket'
import PrivateRoute from '@/components/PrivateRouteFeature/PrivateRoute'
import GlobalChatPopup from '@/components/ChatFeature/GlobalChatPopup'

// Pages
import LandingPage from '@/pages/LandingFeature/LandingPage'
import LoginPage from '@/pages/AuthFeature/LoginPage'
import RegisterPage from '@/pages/AuthFeature/RegisterPage'
import ForgotPasswordPage from '@/pages/AuthFeature/ForgotPasswordPage'
import HomePage from '@/pages/LeftSidebarFeature/HomePage'
import ProfilePage from '@/pages/LeftSidebarFeature/ProfilePage'
import PostDetailPage from '@/pages/PostFeature/PostDetailPage'
import SearchResultsPage from '@/pages/SearchFeature/SearchResultsPage'
import ConnectionsPage from '@/pages/LeftSidebarFeature/ConnectionsPage'
import MessagesPage from '@/pages/LeftSidebarFeature/MessagesPage'
import LearnMorePage from '@/pages/LandingFeature/LearnMorePage'
import PrivacyPage from '@/pages/LandingFeature/PrivacyPage'
import TermsPage from '@/pages/LandingFeature/TermsPage'
import AboutPage from '@/pages/LandingFeature/AboutPage'

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
