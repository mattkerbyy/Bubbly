import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Home, User, MessageCircle, Bell, Search } from 'lucide-react'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const menuItems = [
    { icon: Home, label: 'Home', active: true },
    { icon: User, label: 'Profile', active: false },
    { icon: MessageCircle, label: 'Messages', active: false },
    { icon: Bell, label: 'Notifications', active: false },
    { icon: Search, label: 'Search', active: false },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <img 
              src="/images/bubbly-logo-clearbg.png" 
              alt="Bubbly Logo" 
              className="h-10 w-auto"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden sm:block">
                <p className="text-sm font-medium">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground">@{user?.username || 'username'}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </header>

      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-3"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {menuItems.map((item, index) => (
                  <motion.button
                    key={item.label}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-primary text-white'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.aside>

          {/* Main Content */}
          <motion.main
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Welcome to Bubbly! 🎉</CardTitle>
                <CardDescription>
                  You're successfully authenticated and viewing the home feed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Success Message */}
                  <div className="p-6 rounded-lg bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
                    <h3 className="font-semibold text-lg mb-2">
                      🎊 Authentication Complete!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      You've successfully completed Phase 1 of Bubbly. The authentication flow is working perfectly!
                    </p>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>✅ User registration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>✅ User login</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>✅ Protected routes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>✅ User state management</span>
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="p-4 rounded-lg bg-muted/50 border border-border">
                    <h4 className="font-medium mb-3">Your Account Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{user?.name || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Username:</span>
                        <span className="font-medium">@{user?.username || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Email:</span>
                        <span className="font-medium">{user?.email || 'Not set'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-green-600 font-medium">Active</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Next Steps */}
                  <div className="p-4 rounded-lg bg-accent/50 border border-accent">
                    <h4 className="font-medium mb-3">🚀 Next Steps (Phase 2)</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Create and view posts</li>
                      <li>• Like and comment on posts</li>
                      <li>• Build user feed with infinite scroll</li>
                      <li>• Implement real-time updates</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.main>

          {/* Right Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-3"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Suggested</CardTitle>
                <CardDescription>People you might know</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted">U{i}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">User {i}</p>
                        <p className="text-xs text-muted-foreground">@user{i}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.aside>
        </div>
      </div>
    </div>
  )
}
