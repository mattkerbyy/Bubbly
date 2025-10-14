import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Loader2, Upload, X, FileText, Music, Video as VideoIcon, Image as ImageIcon } from 'lucide-react'
import { useUpdatePost } from '@/hooks/usePosts'

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/api\/?$/, '')

export default function EditPostModal({ post, isOpen, onClose }) {
  const [content, setContent] = useState(post?.content || '')
  const [selectedFiles, setSelectedFiles] = useState([])
  const [existingFiles, setExistingFiles] = useState(post?.files || [])
  const [previewFile, setPreviewFile] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef(null)
  const updatePostMutation = useUpdatePost()

  // Update state when post changes
  useEffect(() => {
    if (post) {
      setContent(post?.content || '')
      setExistingFiles(post?.files || [])
      setSelectedFiles([])
    }
  }, [post])

  const getFileUrl = (filePath) => {
    if (!filePath) return null
    if (filePath.startsWith('http')) return filePath
    if (filePath.startsWith('blob:')) return filePath
    return `${API_URL}${filePath}`
  }

  const getFileType = (filename) => {
    if (!filename) return 'file'
    const ext = filename.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) {
      return 'image'
    } else if (['mp4', 'mov', 'avi', 'wmv', 'webm'].includes(ext)) {
      return 'video'
    } else if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) {
      return 'audio'
    } else if (['doc', 'docx', 'pdf', 'txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(ext)) {
      return 'document'
    }
    return 'file'
  }

  const getFileIcon = (type) => {
    switch (type) {
      case 'image':
        return <ImageIcon className="h-5 w-5" />
      case 'video':
        return <VideoIcon className="h-5 w-5" />
      case 'audio':
        return <Music className="h-5 w-5" />
      case 'document':
        return <FileText className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  const getOriginalFileName = (filePath) => {
    const fileName = filePath.split('/').pop()
    // Remove date-random suffix: "filename-MMDDYYYY-random.ext" → "filename.ext"
    return fileName.replace(/-\d+-\d+(\.[^.]+)$/, '$1')
  }

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Calculate total files after adding new ones
    const totalFiles = existingFiles.length + selectedFiles.length + files.length
    
    // Check if adding these files would exceed the 10 file limit
    if (totalFiles > 10) {
      alert(`Maximum 10 files allowed per post. You can add ${10 - (existingFiles.length + selectedFiles.length)} more file(s).`)
      return
    }

    // Process each file
    const newFilesWithPreview = []
    for (const file of files) {
      // Check file size (50MB limit per file)
      if (file.size > 50 * 1024 * 1024) {
        alert(`File "${file.name}" is too large. Maximum size is 50MB per file.`)
        continue
      }

      const fileType = getFileType(file.name)
      const preview = file.type.startsWith('image/') || file.type.startsWith('video/')
        ? URL.createObjectURL(file)
        : null
      
      newFilesWithPreview.push({
        file,
        preview,
        type: fileType,
        id: Date.now() + Math.random()
      })
    }

    setSelectedFiles(prev => [...prev, ...newFilesWithPreview])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveExistingFile = (index) => {
    setExistingFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleRemoveSelectedFile = (fileId) => {
    setSelectedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file?.preview) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter(f => f.id !== fileId)
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const formData = new FormData()
      formData.append('content', content.trim() || '')
      
      // Send the list of existing files to keep
      if (existingFiles.length > 0) {
        formData.append('keepFiles', JSON.stringify(existingFiles))
      }
      
      // Add new files to upload
      if (selectedFiles.length > 0) {
        selectedFiles.forEach((fileData) => {
          formData.append('files', fileData.file)
        })
      }
      
      // If user removed all files (both existing and new)
      if (existingFiles.length === 0 && selectedFiles.length === 0 && post?.files?.length > 0) {
        formData.append('removeFiles', 'true')
      }

      await updatePostMutation.mutateAsync({
        postId: post.id,
        postData: formData
      })
      
      // Cleanup
      selectedFiles.forEach(f => {
        if (f.preview) URL.revokeObjectURL(f.preview)
      })
      
      onClose()
    } catch (error) {
      console.error('Error updating post:', error)
    }
  }

  const handleCancel = () => {
    // Cleanup blob URLs
    selectedFiles.forEach(f => {
      if (f.preview) URL.revokeObjectURL(f.preview)
    })
    
    setContent(post?.content || '')
    setExistingFiles(post?.files || [])
    setSelectedFiles([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const hasChanges = 
    content !== (post?.content || '') || 
    selectedFiles.length > 0 || 
    existingFiles.length !== (post?.files?.length || 0)

  return (
    <>
    <AlertDialog open={isOpen} onOpenChange={handleCancel}>
      <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-[calc(100%-2rem)] mx-auto sm:w-full">
        <AlertDialogHeader>
          <AlertDialogTitle>Edit Post</AlertDialogTitle>
          <AlertDialogDescription>
            Make changes to your post content and attachments.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {/* Content Textarea */}
            <div>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What's on your mind?"
                className="min-h-[100px] resize-none text-sm w-full"
                maxLength={500}
                disabled={updatePostMutation.isPending}
              />
              <div className="text-xs text-muted-foreground mt-1.5 text-right">
                {content.length}/500
              </div>
            </div>

            {/* Existing Files */}
            {existingFiles.length > 0 && (
              <div className="space-y-2 w-full overflow-hidden">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Current ({existingFiles.length})
                </div>
                <div className="grid gap-2 w-full">
                  {existingFiles.map((filePath, index) => {
                    const fileType = getFileType(filePath)
                    const fileUrl = getFileUrl(filePath)
                    const fileName = getOriginalFileName(filePath)

                    return (
                      <div key={index} className="relative group w-full max-w-full overflow-hidden">
                        {fileType === 'image' && (
                          <div 
                            className="relative rounded-lg overflow-hidden border cursor-pointer"
                            onClick={() => {
                              setPreviewFile({ url: fileUrl, type: 'image', name: fileName })
                              setShowPreview(true)
                            }}
                          >
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="w-full max-h-32 object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-black/60 hover:bg-destructive backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveExistingFile(index)
                              }}
                              title="Remove image"
                            >
                              <X className="h-4 w-4 text-white stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                        {fileType === 'video' && (
                          <div 
                            className="relative rounded-lg overflow-hidden border cursor-pointer"
                            onClick={() => {
                              setPreviewFile({ url: fileUrl, type: 'video', name: fileName })
                              setShowPreview(true)
                            }}
                          >
                            <video
                              src={fileUrl}
                              className="w-full max-h-32 object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-black/60 hover:bg-destructive backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveExistingFile(index)
                              }}
                              title="Remove video"
                            >
                              <X className="h-4 w-4 text-white stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                        {fileType === 'audio' && (
                          <div className="relative rounded-lg border p-3 bg-muted w-full max-w-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 w-full max-w-full">
                              <div className="text-primary shrink-0 flex-none">
                                {getFileIcon(fileType)}
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-xs font-medium truncate">{fileName}</p>
                              </div>
                            </div>
                            <audio
                              src={fileUrl}
                              controls
                              className="w-full h-8"
                              style={{ height: '32px' }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-background/95 hover:bg-destructive hover:text-white backdrop-blur-sm transition-all hover:rotate-90 duration-300 border"
                              onClick={() => handleRemoveExistingFile(index)}
                              title="Remove audio"
                            >
                              <X className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                        {fileType === 'document' && (
                          <div className="relative flex items-center gap-2 p-3 bg-muted rounded-lg border w-full max-w-full overflow-hidden">
                            <div className="text-primary shrink-0 flex-none">
                              {getFileIcon(fileType)}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden pr-8">
                              <p className="text-xs font-medium truncate">{fileName}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-background/95 hover:bg-destructive hover:text-white backdrop-blur-sm transition-all hover:rotate-90 duration-300 border"
                              onClick={() => handleRemoveExistingFile(index)}
                              title="Remove document"
                            >
                              <X className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                  </div>
                </div>
            )}

            {/* New Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="space-y-2 w-full overflow-hidden">
                <div className="text-xs font-medium text-green-600 uppercase tracking-wide">
                  New ({selectedFiles.length})
                </div>
                <div className="grid gap-2 w-full">
                  {selectedFiles.map((fileData) => {
                    return (
                      <div key={fileData.id} className="relative group w-full max-w-full overflow-hidden">
                        {fileData.type === 'image' && fileData.preview && (
                          <div 
                            className="relative rounded-lg overflow-hidden border border-green-200 cursor-pointer"
                            onClick={() => {
                              setPreviewFile({ url: fileData.preview, type: 'image', name: fileData.file.name })
                              setShowPreview(true)
                            }}
                          >
                            <img
                              src={fileData.preview}
                              alt={fileData.file.name}
                              className="w-full max-h-32 object-cover"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-black/60 hover:bg-destructive backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleRemoveSelectedFile(fileData.id)
                              }}
                              title="Remove image"
                            >
                              <X className="h-4 w-4 text-white stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                        {fileData.type === 'video' && fileData.preview && (
                          <div className="rounded-lg overflow-hidden border border-green-200">
                            <div className="relative">
                              <video
                                src={fileData.preview}
                                className="w-full max-h-32 object-cover cursor-pointer"
                                onClick={() => {
                                  setPreviewFile({ url: fileData.preview, type: 'video', name: fileData.file.name })
                                  setShowPreview(true)
                                }}
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-black/60 hover:bg-destructive backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                                onClick={() => handleRemoveSelectedFile(fileData.id)}
                                title="Remove video"
                              >
                                <X className="h-4 w-4 text-white stroke-[2.5]" />
                              </Button>
                            </div>
                          </div>
                        )}
                        {fileData.type === 'audio' && (
                          <div className="relative rounded-lg border border-green-200 p-3 bg-green-50 dark:bg-green-950/20 w-full max-w-full overflow-hidden">
                            <div className="flex items-center gap-2 mb-2 w-full max-w-full">
                              <div className="text-green-600 shrink-0 flex-none">
                                {getFileIcon(fileData.type)}
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-xs font-medium truncate">{fileData.file.name}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <audio
                              src={fileData.preview || URL.createObjectURL(fileData.file)}
                              controls
                              className="w-full h-8"
                              style={{ height: '32px' }}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-background/95 hover:bg-destructive hover:text-white backdrop-blur-sm transition-all hover:rotate-90 duration-300 border"
                              onClick={() => handleRemoveSelectedFile(fileData.id)}
                              title="Remove audio"
                            >
                              <X className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                        {fileData.type === 'document' && (
                          <div className="relative flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 w-full max-w-full overflow-hidden">
                            <div className="text-green-600 shrink-0 flex-none">
                              {getFileIcon(fileData.type)}
                            </div>
                            <div className="flex-1 min-w-0 overflow-hidden pr-8">
                              <p className="text-xs font-medium truncate">{fileData.file.name}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg bg-background/95 hover:bg-destructive hover:text-white backdrop-blur-sm transition-all hover:rotate-90 duration-300 border"
                              onClick={() => handleRemoveSelectedFile(fileData.id)}
                              title="Remove document"
                            >
                              <X className="h-4 w-4 stroke-[2.5]" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* File Upload Button */}
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,video/*,audio/*,.doc,.docx,.pdf,.ppt,.pptx,.xls,.xlsx,.txt"
                multiple
                className="hidden"
                disabled={updatePostMutation.isPending || (existingFiles.length + selectedFiles.length >= 10)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={updatePostMutation.isPending || (existingFiles.length + selectedFiles.length >= 10)}
                className="flex-1"
              >
                <Upload className="mr-2 h-3.5 w-3.5" />
                {existingFiles.length + selectedFiles.length >= 10
                  ? 'Max files reached'
                  : selectedFiles.length > 0 || existingFiles.length > 0
                  ? 'Add More'
                  : 'Add Files'}
              </Button>
              {(existingFiles.length > 0 || selectedFiles.length > 0) && (
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {existingFiles.length + selectedFiles.length}/10
                </span>
              )}
            </div>
          </div>
        </form>

        <AlertDialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={updatePostMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!hasChanges || updatePostMutation.isPending}
            onClick={handleSubmit}
          >
            {updatePostMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

    {/* File Preview Modal */}
    <AlertDialog open={showPreview} onOpenChange={setShowPreview}>
      <AlertDialogContent className="max-w-6xl max-h-[95vh] p-0 gap-0 overflow-hidden border-2">
        {/* Header with gradient background */}
        <AlertDialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {previewFile?.type === 'image' ? (
                <div className="p-2 rounded-lg bg-primary/10">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-primary/10">
                  <VideoIcon className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <AlertDialogTitle className="truncate text-lg font-semibold">
                  {previewFile?.name}
                </AlertDialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {previewFile?.type === 'image' ? 'Image Preview' : 'Video Preview'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowPreview(false)}
              className="shrink-0 h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-90 duration-300"
              title="Close preview"
            >
              <X className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </AlertDialogHeader>

        {/* Preview content with enhanced styling */}
        <div className="relative flex justify-center items-center p-6 bg-gradient-to-br from-muted/30 via-muted/10 to-transparent min-h-[400px]">
          {previewFile?.type === 'image' && (
            <div className="relative group">
              <img 
                src={previewFile.url} 
                alt={previewFile.name} 
                className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {/* Subtle overlay on hover */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          )}
          {previewFile?.type === 'video' && (
            <div className="relative w-full max-w-5xl">
              <video 
                src={previewFile.url} 
                controls 
                autoPlay
                className="w-full max-h-[75vh] rounded-lg shadow-2xl ring-1 ring-black/10 dark:ring-white/10"
              />
              {/* Video play indicator backdrop */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            </div>
          )}
        </div>

        {/* Footer with action button */}
        <AlertDialogFooter className="px-6 py-4 border-t bg-muted/30">
          <Button 
            onClick={() => setShowPreview(false)}
            className="min-w-[120px] shadow-sm hover:shadow-md transition-all"
            size="lg"
          >
            <X className="mr-2 h-4 w-4" />
            Close Preview
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
