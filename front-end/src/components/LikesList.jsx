import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { getPostLikes } from '@/services/likeService'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

export default function LikesList({ postId, likeCount, onViewAll }) {
  const [topLikers, setTopLikers] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (postId && likeCount > 0) {
      fetchTopLikers()
    }
  }, [postId, likeCount])

  const fetchTopLikers = async () => {
    setIsLoading(true)
    try {
      const data = await getPostLikes(postId, 1, 3) // Get top 3 likers
      setTopLikers(data.likes || [])
    } catch (err) {
      console.error('Error fetching top likers:', err)
    } finally {
      setIsLoading(false)
    }
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

  if (likeCount === 0) return null

  return (
    <div 
      className="flex items-center gap-2 cursor-pointer hover:underline group"
      onClick={onViewAll}
    >
      {/* Like icon in circle */}
      <div className="flex -space-x-1">
        <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-background z-10">
          <Heart className="h-3 w-3 text-white fill-white" />
        </div>
        
        {/* Top liker avatars */}
        {!isLoading && topLikers.slice(0, 3).map((like, index) => (
          <Avatar 
            key={like.user.id} 
            className="h-5 w-5 border-2 border-background"
            style={{ zIndex: 9 - index }}
          >
            <AvatarImage src={getImageUrl(like.user.avatar)} />
            <AvatarFallback className="bg-primary text-white text-[8px]">
              {getInitials(like.user.name)}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>

      {/* Names and count */}
      <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
        {isLoading ? (
          <span>{likeCount}</span>
        ) : topLikers.length > 0 ? (
          <span>
            {topLikers.slice(0, 2).map((like, index) => (
              <span key={like.user.id}>
                {index > 0 && ', '}
                <span className="font-medium text-foreground">
                  {like.user.name}
                </span>
              </span>
            ))}
            {likeCount > 2 && (
              <span> and {likeCount - 2} other{likeCount - 2 !== 1 ? 's' : ''}</span>
            )}
            {likeCount <= 2 && topLikers.length === likeCount && (
              <span></span>
            )}
          </span>
        ) : (
          <span>{likeCount}</span>
        )}
      </div>
    </div>
  )
}
