import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  Camera,
  Check,
  Settings,
  UserPlus,
  UserMinus,
  Trash2,
  Upload,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUploadAvatar, useUploadCover, useDeleteAvatar, useDeleteCover } from '@/hooks/useUsers'
import { useFollowUser, useUnfollowUser, useFollowStatus } from '@/hooks/useFollow'

const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function ProfileHeader({ profile, isOwnProfile, onEditProfile, onShowFollowers, onShowFollowing }) {
  const [coverHover, setCoverHover] = useState(false)
  const [avatarHover, setAvatarHover] = useState(false)
  const [showAvatarMenu, setShowAvatarMenu] = useState(false)
  const [showCoverMenu, setShowCoverMenu] = useState(false)
  const avatarInputRef = useRef(null)
  const coverInputRef = useRef(null)

  const uploadAvatarMutation = useUploadAvatar()
  const uploadCoverMutation = useUploadCover()
  const deleteAvatarMutation = useDeleteAvatar()
  const deleteCoverMutation = useDeleteCover()

  const followMutation = useFollowUser()
  const unfollowMutation = useUnfollowUser()
  const { data: followStatusData } = useFollowStatus(profile?.id)

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      await uploadAvatarMutation.mutateAsync(file)
      setShowAvatarMenu(false)
    } catch (error) {
      console.error('Avatar upload error:', error)
    }
  }

  const handleCoverChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB')
      return
    }

    try {
      await uploadCoverMutation.mutateAsync(file)
      setShowCoverMenu(false)
    } catch (error) {
      console.error('Cover upload error:', error)
    }
  }

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatarMutation.mutateAsync()
      setShowAvatarMenu(false)
    } catch (error) {
      console.error('Delete avatar error:', error)
    }
  }

  const handleDeleteCover = async () => {
    try {
      await deleteCoverMutation.mutateAsync()
      setShowCoverMenu(false)
    } catch (error) {
      console.error('Delete cover error:', error)
    }
  }

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className="overflow-hidden">
      {/* Cover Photo */}
      <div
        className="relative h-48 md:h-64 bg-gradient-to-br from-primary/20 to-primary/40 overflow-hidden"
        onMouseEnter={() => setCoverHover(true)}
        onMouseLeave={() => setCoverHover(false)}
      >
        {profile.coverPhoto ? (
          <motion.img
            src={getImageUrl(profile.coverPhoto)}
            alt="Cover"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Camera className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Upload/Delete Cover Button (only for own profile) */}
        {isOwnProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: coverHover || showCoverMenu ? 1 : 0 }}
            className="absolute inset-0 bg-black/40 flex items-center justify-center"
          >
            <DropdownMenu open={showCoverMenu} onOpenChange={setShowCoverMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="secondary"
                  disabled={uploadCoverMutation.isPending || deleteCoverMutation.isPending}
                  className="gap-2"
                >
                  <Camera className="h-5 w-5" />
                  {uploadCoverMutation.isPending || deleteCoverMutation.isPending
                    ? 'Processing...'
                    : profile.coverPhoto
                    ? 'Edit Cover Photo'
                    : 'Add Cover Photo'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                <DropdownMenuItem
                  onClick={() => coverInputRef.current?.click()}
                  className="cursor-pointer gap-2"
                >
                  <Upload className="h-4 w-4" />
                  {profile.coverPhoto ? 'Change Cover Photo' : 'Upload Cover Photo'}
                </DropdownMenuItem>
                {profile.coverPhoto && (
                  <DropdownMenuItem
                    onClick={handleDeleteCover}
                    className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                    disabled={deleteCoverMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove Cover Photo
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </motion.div>
        )}
      </div>

      {/* Profile Content - CONTAINED BELOW COVER */}
      <CardContent className="px-4 sm:px-6 pt-6 pb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Avatar - NO NEGATIVE MARGIN */}
          <div className="relative flex-shrink-0">
            {isOwnProfile ? (
              <DropdownMenu open={showAvatarMenu} onOpenChange={setShowAvatarMenu}>
                <DropdownMenuTrigger asChild>
                  <div
                    className="relative cursor-pointer group"
                    onMouseEnter={() => setAvatarHover(true)}
                    onMouseLeave={() => setAvatarHover(false)}
                  >
                    <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                      <AvatarImage src={getImageUrl(profile.avatar)} />
                      <AvatarFallback className="bg-primary text-white text-2xl sm:text-3xl">
                        {getInitials(profile.name)}
                      </AvatarFallback>
                    </Avatar>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: avatarHover || showAvatarMenu ? 1 : 0 }}
                      className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <Camera className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                    </motion.div>
                    {profile.verified && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                        className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 h-6 w-6 sm:h-8 sm:w-8 bg-primary rounded-full flex items-center justify-center border-2 border-background"
                      >
                        <Check className="h-3 w-3 sm:h-5 sm:w-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem
                    onClick={() => avatarInputRef.current?.click()}
                    className="cursor-pointer gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {profile.avatar ? 'Change Avatar' : 'Upload Avatar'}
                  </DropdownMenuItem>
                  {profile.avatar && (
                    <DropdownMenuItem
                      onClick={handleDeleteAvatar}
                      className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                      disabled={deleteAvatarMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove Avatar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32 border-4 border-background shadow-lg">
                <AvatarImage src={getImageUrl(profile.avatar)} />
                <AvatarFallback className="bg-primary text-white text-2xl sm:text-3xl">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            )}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploadAvatarMutation.isPending}
            />
          </div>

          {/* Profile Info */}
          <div className="flex-1 space-y-3 w-full min-w-0">
            {/* Name and Username */}
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2 break-words">
                {profile.name || profile.username}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground break-all">
                @{profile.username}
              </p>
            </div>

            {/* Bio */}
            {profile.bio && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-sm sm:text-base text-foreground leading-relaxed break-words"
              >
                {profile.bio}
              </motion.p>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-4 sm:gap-6 text-xs sm:text-sm flex-wrap"
            >
              <div className="flex items-center gap-1">
                <span className="font-semibold text-foreground">
                  {formatNumber(profile._count?.posts || 0)}
                </span>
                <span className="text-muted-foreground">Posts</span>
              </div>
              <button
                onClick={onShowFollowers}
                className="flex items-center gap-1 hover:underline cursor-pointer transition-colors hover:text-primary"
              >
                <span className="font-semibold text-foreground">
                  {formatNumber(profile._count?.followers || 0)}
                </span>
                <span className="text-muted-foreground">Followers</span>
              </button>
              <button
                onClick={onShowFollowing}
                className="flex items-center gap-1 hover:underline cursor-pointer transition-colors hover:text-primary"
              >
                <span className="font-semibold text-foreground">
                  {formatNumber(profile._count?.following || 0)}
                </span>
                <span className="text-muted-foreground">Following</span>
              </button>
            </motion.div>

            {/* Additional Info */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground"
            >
              {profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="break-words">{profile.location}</span>
                </div>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-primary transition-colors min-w-0"
                >
                  <LinkIcon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <span className="hover:underline truncate">
                    {profile.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </span>
                </a>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span>Joined {format(new Date(profile.createdAt), 'MMMM yyyy')}</span>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-2 w-full sm:w-auto sm:flex-shrink-0"
          >
            {isOwnProfile ? (
              <Button
                onClick={onEditProfile}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none gap-2"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Edit Profile</span>
                <span className="sm:hidden">Edit</span>
              </Button>
            ) : (
              <Button
                variant={followStatusData?.data?.isFollowing ? 'outline' : 'default'}
                size="sm"
                className="flex-1 sm:flex-none gap-2"
                onClick={() => {
                  if (followStatusData?.data?.isFollowing) {
                    unfollowMutation.mutate(profile.id)
                  } else {
                    followMutation.mutate(profile.id)
                  }
                }}
                disabled={followMutation.isPending || unfollowMutation.isPending}
              >
                {followStatusData?.data?.isFollowing ? (
                  <>
                    <UserMinus className="h-4 w-4" />
                    <span>Unfollow</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Follow</span>
                  </>
                )}
              </Button>
            )}
          </motion.div>
        </div>
      </CardContent>
    </Card>
  )
}
