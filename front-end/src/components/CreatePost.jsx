import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Image, X, Loader2, FileText, Music, Video, Upload } from 'lucide-react'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCreatePost } from '@/hooks/usePosts'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import AudienceSelector from '@/components/AudienceSelector'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

export default function CreatePost() {
  const { user } = useAuthStore()
  const createPostMutation = useCreatePost()
  
  const [content, setContent] = useState('')
  const [files, setFiles] = useState([]) // Array of files with metadata
  const [audience, setAudience] = useState('Public') // Post privacy setting
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

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }

  const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'document'
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <Image className="h-8 w-8" />
      case 'video':
        return <Video className="h-8 w-8" />
      case 'audio':
        return <Music className="h-8 w-8" />
      case 'document':
        return <FileText className="h-8 w-8" />
      default:
        return <FileText className="h-8 w-8" />
    }
  }

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    if (selectedFiles.length === 0) return

    // Check if adding these files would exceed the 10 file limit
    if (files.length + selectedFiles.length > 10) {
      alert('Maximum 10 files allowed per post')
      return
    }

    // Process each file
    const newFiles = []
    selectedFiles.forEach((selectedFile) => {
      // Check file size (50MB limit per file)
      if (selectedFile.size > 50 * 1024 * 1024) {
        alert(`File "${selectedFile.name}" is too large. Maximum size is 50MB per file.`)
        return
      }

      const type = getFileType(selectedFile)
      const fileData = {
        file: selectedFile,
        type,
        preview: null,
        id: Date.now() + Math.random() // Unique ID for each file
      }
      
      // Create preview for images and videos
      if (type === 'image' || type === 'video') {
        const reader = new FileReader()
        reader.onloadend = () => {
          fileData.preview = reader.result
          setFiles(prev => prev.map(f => 
            f.id === fileData.id ? { ...f, preview: reader.result } : f
          ))
        }
        reader.readAsDataURL(selectedFile)
      }
      
      newFiles.push(fileData)
    })

    setFiles(prev => [...prev, ...newFiles])
    
    // Reset input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!content.trim() && files.length === 0) {
      return
    }

    const formData = new FormData()
    
    // Add content if present
    if (content.trim()) {
      formData.append('content', content.trim())
    }
    
    // Add audience setting
    formData.append('audience', audience)
    
    // Add all files with the field name 'files'
    files.forEach((fileData) => {
      formData.append('files', fileData.file)
    })

    try {
      await createPostMutation.mutateAsync(formData)
      
      // Reset form
      setContent('')
      setFiles([])
      setAudience('Public')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
  // Failed to create post handled by UI
    }
  }

  const isSubmitDisabled = (!content.trim() && files.length === 0) || createPostMutation.isPending

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
                <AvatarImage src={getImageUrl(user?.avatar)} />
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

            {/* File previews */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <div className="text-sm text-muted-foreground mb-2">
                    {files.length} file{files.length !== 1 ? 's' : ''} selected (max 10)
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {files.map((fileData) => (
                      <motion.div
                        key={fileData.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="relative rounded-lg overflow-hidden border border-border"
                      >
                        {fileData.type === 'image' && fileData.preview && (
                          <img
                            src={fileData.preview}
                            alt="Preview"
                            className="w-full h-48 object-cover bg-muted"
                          />
                        )}
                        
                        {fileData.type === 'video' && fileData.preview && (
                          <video
                            src={fileData.preview}
                            className="w-full h-48 object-cover bg-black"
                          />
                        )}
                        
                        {(fileData.type === 'audio' || fileData.type === 'document') && (
                          <div className="flex items-center gap-3 p-4 bg-muted h-24">
                            <div className="text-primary flex-shrink-0">
                              {getFileIcon(fileData.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate text-sm">{fileData.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        )}
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-black/60 hover:bg-destructive backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                          onClick={() => handleRemoveFile(fileData.id)}
                          title="Remove file"
                        >
                          <X className="h-4 w-4 text-white stroke-[2.5]" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  name="files"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.txt"
                  className="hidden"
                  multiple
                  disabled={createPostMutation.isPending || files.length >= 10}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={createPostMutation.isPending || files.length >= 10}
                  className="gap-2 text-primary hover:text-primary/80"
                >
                  <Upload className="h-5 w-5" />
                  <span className="hidden sm:inline">
                    {files.length >= 10 ? 'Max files reached' : 'Upload Files'}
                  </span>
                </Button>
                {files.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {files.length}/10
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <AudienceSelector
                  value={audience}
                  onChange={setAudience}
                  disabled={createPostMutation.isPending}
                />
                
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
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
