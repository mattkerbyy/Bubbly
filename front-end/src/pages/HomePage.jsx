import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/useAuthStore'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Home, User, MessageCircle, Bell, Users, Bookmark } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import NotificationBell from '@/components/NotificationBell'
import SearchBar from '@/components/SearchBar'
import CreatePost from '@/components/CreatePost'
import Feed from '@/components/Feed'

// Normalize backend origin so uploaded image paths work correctly
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const sidebarItems = [
    { icon: Home, label: 'Home', active: true, onClick: () => navigate('/home') },
    { icon: User, label: 'Profile', onClick: () => navigate(`/profile/${user?.username}`) },
    { icon: Users, label: 'Friends' },
    { icon: MessageCircle, label: 'Messages' },
    { icon: Bell, label: 'Notifications' },
    { icon: Bookmark, label: 'Saved' },
  ]

  const suggestedUsers = [
    { id: 1, name: 'Sarah Johnson', username: 'sarahj', avatar: null },
    { id: 2, name: 'Mike Chen', username: 'mikechen', avatar: null },
    { id: 3, name: 'Emma Davis', username: 'emmad', avatar: null },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
        <div className="container max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <img 
                src="/images/bubbly-logo-clearbg.png" 
                alt="Bubbly" 
                className="h-10 w-auto cursor-pointer"
                onClick={() => navigate('/home')}
              />
            </motion.div>

            {/* Search Bar - Centered */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="w-full max-w-md">
                <SearchBar />
              </div>
            </div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <ThemeToggle />
              
              <NotificationBell />

              <div className="flex items-center gap-3 ml-2">
                <Avatar 
                  className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity"
                  onClick={() => navigate(`/profile/${user?.username}`)}
                >
                  <AvatarImage src={getImageUrl(user?.avatar)} />
                  <AvatarFallback className="bg-primary text-white text-sm">
                    {getInitials(user?.name)}
                  </AvatarFallback>
                </Avatar>
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
        </div>
      </header>

      {/* Main content - 3 column layout */}
      <div className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Hidden on mobile */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              {/* User profile card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-card border rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/profile/${user?.username}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={getImageUrl(user?.avatar)} />
                    <AvatarFallback className="bg-primary text-white">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user?.username || 'username'}</p>
                  </div>
                </div>
              </motion.div>

              {/* Navigation */}
              <motion.nav
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-card border rounded-lg p-2 space-y-1"
              >
                {sidebarItems.map((item, index) => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      item.active
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">{item.label}</span>
                  </button>
                ))}
              </motion.nav>
            </div>
          </aside>

          {/* Main Feed */}
          <main className="lg:col-span-6 space-y-4">
            <CreatePost />
            <Feed />
          </main>

          {/* Right Sidebar - Hidden on mobile/tablet */}
          <aside className="hidden xl:block lg:col-span-3">
            <div className="sticky top-20 space-y-4">
              {/* Suggested Users */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-card border rounded-lg p-4"
              >
                <h3 className="font-semibold text-sm mb-4">Suggested for you</h3>
                <div className="space-y-4">
                  {suggestedUsers.map((suggestedUser) => (
                    <div key={suggestedUser.id} className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-muted text-muted-foreground">
                          {getInitials(suggestedUser.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{suggestedUser.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{suggestedUser.username}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs h-8">
                        Follow
                      </Button>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Footer links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-4 text-xs text-muted-foreground space-y-2"
              >
                <div className="flex flex-wrap gap-2">
                  <a href="/about" className="hover:underline">About</a>
                  <span>•</span>
                  <a href="/terms" className="hover:underline">Terms</a>
                  <span>•</span>
                  <a href="/privacy" className="hover:underline">Privacy</a>
                </div>
                <p>© 2024 Bubbly. All rights reserved.</p>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav - Only visible on mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {sidebarItems.slice(0, 5).map((item) => (
            <button
              key={item.label}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg ${
                item.active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
