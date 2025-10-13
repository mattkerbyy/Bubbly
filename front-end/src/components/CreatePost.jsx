import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, X, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreatePost } from '@/hooks/usePosts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'

export default function CreatePost() {
  const { user } = useAuthStore()
  const createPostMutation = useCreatePost()
  
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  const getInitials = (name) => {
    if (!name) return 'U'
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB')
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && !imageFile) {
      return
    }

    const postData = {
      content: content.trim(),
      image: imageFile
    }

    try {
      await createPostMutation.mutateAsync(postData)
      
      // Reset form
      setContent('')
      setImageFile(null)
      setImagePreview(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  const isSubmitDisabled = (!content.trim() && !imageFile) || createPostMutation.isPending

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* User info and textarea */}
            <div className="flex gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user?.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || 'friend'}?`}
                  className="min-h-[100px] resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
                  disabled={createPostMutation.isPending}
                />
              </div>
            </div>

            {/* Image preview */}
            <AnimatePresence>
              {imagePreview && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative rounded-lg overflow-hidden border border-border"
                >
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full max-h-96 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  name="image"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  className="hidden"
                  disabled={createPostMutation.isPending}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createPostMutation.isPending}
                  className="gap-2 text-primary hover:text-primary/80"
                >
                  <Image className="h-5 w-5" />
                  <span className="hidden sm:inline">Photo</span>
                </Button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitDisabled}
                className="min-w-24"
              >
                {createPostMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
