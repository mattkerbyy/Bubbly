import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, User, MessageCircle, Users, LogOut } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import ChatList from "../../components/ChatFeature/ChatList";
import ChatWindow from "../../components/ChatFeature/ChatWindow";
import ThemeToggle from "../../components/Others/ThemeToggle";
import NotificationBell from "../../components/NotifFeature/NotificationBell";
import HamburgerMenu from "../../components/Others/HamburgerMenu";
import SearchBar from "../../components/SearchFeature/SearchBar";
import { useAuthStore } from "../../stores/useAuthStore";
import { onUserStatus, offUserStatus } from "../../lib/socket";
import { useGetOrCreateConversation } from "../../hooks/MessageFeature/useMessages";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
const API_URL = rawApiUrl.replace(/\/api\/?$/, "");

export default function MessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeOtherUser, setActiveOtherUser] = useState(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showMobileChatList, setShowMobileChatList] = useState(false);
  const otherUserId = location.state?.otherUserId;
  const stateConversationId = location.state?.conversationId;
  const { data: conversationData, isSuccess } =
    useGetOrCreateConversation(otherUserId);
  useEffect(() => {
    if (stateConversationId) {
      setActiveConversationId(stateConversationId);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (isSuccess && conversationData?.data) {
      const conversation = conversationData.data;
      setActiveConversationId(conversation.id);
      setActiveOtherUser(conversation.otherUser);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [isSuccess, conversationData, stateConversationId]);
  useEffect(() => {
    const handleUserStatus = ({ userId, isOnline }) => {
      if (activeOtherUser && activeOtherUser.id === userId) {
        setActiveOtherUser((prev) => ({
          ...prev,
          isOnline,
        }));
      }
    };

    onUserStatus(handleUserStatus);

    return () => {
      offUserStatus(handleUserStatus);
    };
  }, [activeOtherUser]);

  const handleSelectConversation = (conversationId, otherUser) => {
    setActiveConversationId(conversationId);
    setActiveOtherUser(otherUser);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
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

  return (
    <div className="h-screen bg-background overflow-hidden">
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

            {/* Spacer for mobile */}
            <div className="flex-1 md:hidden"></div>

            {/* Right actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 flex-shrink-0"
            >
              {/* Desktop - Theme toggle */}
              <div className="hidden md:flex items-center gap-2">
                <ThemeToggle />
              </div>

              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile Avatar */}
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

      {/* Main Content */}
      <div className="h-[calc(100vh-64px)] max-w-7xl mx-auto overflow-hidden relative">
        <div className="h-full min-h-0 grid grid-cols-1 md:grid-cols-[360px_1fr] lg:grid-cols-[400px_1fr]">
          {/* Chat List - Left Sidebar */}
          <div
            className={`
            h-full min-h-0
            ${activeConversationId ? "hidden md:block" : "block"}
          `}
          >
            <ChatList
              activeConversationId={activeConversationId}
              onSelectConversation={(convId, user) => {
                handleSelectConversation(convId, user);
                setShowMobileChatList(false);
              }}
            />
          </div>

          {/* Chat Window - Right Panel */}
          <div
            className={`
            h-full min-h-0 border-l
            ${activeConversationId ? "block" : "hidden md:block"}
          `}
          >
            <ChatWindow
              conversationId={activeConversationId}
              otherUser={activeOtherUser}
              onShowChatList={() => setShowMobileChatList(true)}
            />
          </div>
        </div>

        {/* Mobile Chat List Overlay */}
        <AnimatePresence>
          {showMobileChatList && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileChatList(false)}
                className="md:hidden fixed inset-0 bg-black/60 z-40"
              />

              {/* Sliding Chat List */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="md:hidden fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-background z-50 shadow-xl"
              >
                <ChatList
                  activeConversationId={activeConversationId}
                  onSelectConversation={(convId, user) => {
                    handleSelectConversation(convId, user);
                    setShowMobileChatList(false);
                  }}
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Logout?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
