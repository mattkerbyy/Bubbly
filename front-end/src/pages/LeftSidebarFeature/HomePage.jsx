import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, User, MessageCircle, Users, LogOut, Search } from "lucide-react";
import { useSuggestedUsers } from "@/hooks/FollowFeature/useFollow";
import { useFollowUser } from "@/hooks/FollowFeature/useFollow";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState } from "react";
import ThemeToggle from "@/components/Others/ThemeToggle";
import NotificationBell from "@/components/NotifFeature/NotificationBell";
import { Skeleton } from "@/components/ui/skeleton";
import HamburgerMenu from "@/components/Others/HamburgerMenu";
import SearchBar from "@/components/SearchFeature/SearchBar";
import CreatePost from "@/components/CreatePostFeature/CreatePost";
import Feed from "@/components/FeedFeature/Feed";
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const { data: suggestedUsersData, isLoading: loadingSuggested } =
    useSuggestedUsers(3);
  const followMutation = useFollowUser();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFollow = async (userId) => {
    try {
      await followMutation.mutateAsync(userId);
    } catch (error) {
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http")) return imagePath;
    return `${API_URL}${imagePath}`;
  };

  const sidebarItems = [
    {
      icon: Home,
      label: "Home",
      active: true,
      onClick: () => navigate("/home"),
    },
    {
      icon: User,
      label: "Profile",
      onClick: () => navigate(`/profile/${user?.username}`),
    },
    {
      icon: Users,
      label: "Connections",
      onClick: () => navigate("/connections"),
    },
    {
      icon: MessageCircle,
      label: "Messages",
      onClick: () => navigate("/messages"),
    },
  ];

  const suggestedUsers = suggestedUsersData?.data || [];
  const currentYear = new Date().getFullYear();

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
                onClick={() => navigate("/home")}
              />
            </motion.div>

            {/* Search Bar - Centered on desktop, hidden on mobile */}
            <div className="flex-1 hidden md:flex justify-center">
              <div className="w-full max-w-md">
                <SearchBar />
              </div>
            </div>

            {/* Spacer for mobile - pushes right items to the right */}
            <div className="flex-1 md:hidden"></div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              {/* Mobile Search Button - Only visible on mobile */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowMobileSearch(true)}
                className="md:hidden text-muted-foreground hover:text-primary"
              >
                <Search className="h-5 w-5" />
              </Button>

              {/* Desktop - Theme toggle */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
              </div>

              {/* Notification Bell - Always visible */}
              <NotificationBell />

              {/* Profile Avatar - Always visible */}
              <Avatar
                className="h-9 w-9 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate(`/profile/${user?.username}`)}
              >
                <AvatarImage src={getImageUrl(user?.avatar)} />
                <AvatarFallback className="bg-primary text-white text-sm">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              {/* Logout Button - Desktop only */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoutDialog(true)}
                className="hidden md:flex text-muted-foreground hover:text-destructive"
              >
                <LogOut className="h-5 w-5" />
              </Button>

              {/* Hamburger Menu - Mobile only */}
              <HamburgerMenu />
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
                    <p className="font-semibold text-sm truncate">
                      {user?.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      @{user?.username || "username"}
                    </p>
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
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
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
                <h3 className="font-semibold text-sm mb-4">
                  Suggested for you
                </h3>
                {loadingSuggested ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-8 w-16 rounded" />
                      </div>
                    ))}
                  </div>
                ) : suggestedUsers.length > 0 ? (
                  <div className="space-y-4">
                    {suggestedUsers.map((suggestedUser) => (
                      <div
                        key={suggestedUser.id}
                        className="flex items-center gap-3"
                      >
                        <Avatar
                          className="h-10 w-10 cursor-pointer"
                          onClick={() =>
                            navigate(`/profile/${suggestedUser.username}`)
                          }
                        >
                          <AvatarImage
                            src={getImageUrl(suggestedUser.avatar)}
                          />
                          <AvatarFallback className="bg-muted text-muted-foreground">
                            {getInitials(suggestedUser.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() =>
                            navigate(`/profile/${suggestedUser.username}`)
                          }
                        >
                          <p className="text-sm font-medium truncate">
                            {suggestedUser.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{suggestedUser.username}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => handleFollow(suggestedUser.id)}
                          disabled={followMutation.isPending}
                        >
                          Follow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No suggestions available
                  </p>
                )}
              </motion.div>

              {/* Footer links */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="px-4 text-xs text-muted-foreground space-y-2"
              >
                <div className="flex flex-wrap gap-2">
                  <a href="/about" className="hover:underline">
                    About
                  </a>
                  <span>•</span>
                  <a href="/terms" className="hover:underline">
                    Terms
                  </a>
                  <span>•</span>
                  <a href="/privacy" className="hover:underline">
                    Privacy
                  </a>
                </div>
                <p>© {currentYear} Bubbly. All rights reserved.</p>
              </motion.div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile bottom nav - Only visible on mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t z-40">
        <div className="flex items-center justify-around h-16 px-2">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                item.active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Search Dialog */}
      <Dialog open={showMobileSearch} onOpenChange={setShowMobileSearch}>
        <DialogContent
          hideClose
          className="p-0 gap-0 max-w-lg top-[4.5rem] translate-y-0 sm:top-[4.5rem]"
        >
          <div className="w-full p-4">
            <SearchBar />
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout? You'll need to login again to
              access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
