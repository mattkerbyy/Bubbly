import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ForgotPassword from '@/components/ForgotPassword'

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-lg">
          <CardHeader className="space-y-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="flex justify-center"
            >
              <img 
                src="/images/bubbly-logo-clearbg.png" 
                alt="Bubbly Logo" 
                className="h-16 w-auto"
              />
            </motion.div>
            <div className="text-center">
              <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
              <CardDescription className="mt-2">
                Enter your email to receive a password reset code
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <ForgotPassword />

            {/* Back to Login */}
            <div className="text-center mt-6">
              <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to login
              </Link>
            </div>

            {/* Back to Home */}
            <div className="text-center mt-4">
              <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
                ← Back to home
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
