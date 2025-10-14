import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Grid3x3, Bookmark, Heart } from 'lucide-react'
import { useUserProfile } from '@/hooks/useUsers'
import { useAuthStore } from '@/stores/useAuthStore'
import ProfileHeader from '@/components/ProfileHeader'
import ProfilePosts from '@/components/ProfilePosts'
import EditProfileModal from '@/components/EditProfileModal'
import { ProfilePageSkeleton } from '@/components/skeletons/ProfileSkeleton'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { username } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [activeTab, setActiveTab] = useState('posts')
  const [showEditModal, setShowEditModal] = useState(false)

  const {
    data: profileData,
    isLoading,
    isError,
    error,
  } = useUserProfile(username)

  if (isLoading) {
    return <ProfilePageSkeleton />
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="text-6xl">😕</div>
          <h2 className="text-2xl font-bold text-foreground">Profile Not Found</h2>
          <p className="text-muted-foreground">
            {error?.response?.data?.error || "The profile you're looking for doesn't exist."}
          </p>
          <Button onClick={() => navigate('/home')} variant="outline">
            Go Back Home
          </Button>
        </motion.div>
      </div>
    )
  }

  const profile = profileData?.data
  const isOwnProfile = currentUser?.id === profile?.id

  const tabs = [
    { id: 'posts', label: 'Posts', icon: Grid3x3 },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-40 w-full border-b bg-card shadow-sm"
      >
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg">{profile?.name || profile?.username}</h1>
              <p className="text-xs text-muted-foreground">
                {profile?._count?.posts || 0} posts
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="container max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          {/* Profile Header */}
          <ProfileHeader
            profile={profile}
            isOwnProfile={isOwnProfile}
            onEditProfile={() => setShowEditModal(true)}
          />

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary font-semibold'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'posts' && <ProfilePosts username={username} />}
            
            {activeTab === 'likes' && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">Liked Posts</h3>
                <p className="text-muted-foreground">
                  This feature is coming soon!
                </p>
              </div>
            )}
            
            {activeTab === 'saved' && (
              <div className="bg-card border border-border rounded-lg p-12 text-center">
                <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/40" />
                <h3 className="text-lg font-semibold mb-2">Saved Posts</h3>
                <p className="text-muted-foreground">
                  This feature is coming soon!
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          profile={profile}
        />
      )}
    </div>
  )
}
