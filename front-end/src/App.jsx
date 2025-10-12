import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from '@/stores/useAuthStore'
import PrivateRoute from '@/components/PrivateRoute'

// Pages
import LandingPage from '@/pages/LandingPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import HomePage from '@/pages/HomePage'
import LearnMorePage from '@/pages/LearnMorePage'
import PrivacyPage from '@/pages/PrivacyPage'
import TermsPage from '@/pages/TermsPage'
import AboutPage from '@/pages/AboutPage'

function App() {
  const { isAuthenticated, getMe } = useAuthStore()

  // Restore user session on app load
  useEffect(() => {
    getMe()
  }, [getMe])

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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

        {/* Catch all - redirect to landing or home based on auth */}
        <Route 
          path="*" 
          element={<Navigate to={isAuthenticated ? "/home" : "/"} replace />} 
        />
      </Routes>
    </Router>
  )
}

export default App
