import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Loader2, X, User, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSearchAll } from '@/hooks/useSearch'
import { cn } from '@/lib/utils'

// Normalize backend origin
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const API_URL = rawApiUrl.replace(/\/api\/?$/, '')

export default function SearchBar({ className }) {
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${API_URL}${imagePath}`
  }
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Search with debounced query
  const { data, isLoading } = useSearchAll(debouncedQuery, isFocused && debouncedQuery.length > 0)

  const users = data?.data?.users || []
  const posts = data?.data?.posts || []
  const totalResults = (data?.counts?.total || 0)
  const allResults = [...users, ...posts]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsFocused(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!isFocused || allResults.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < allResults.length ? prev + 1 : prev))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex === -1) {
        // Navigate to full search results page
        handleViewAllResults()
      } else if (selectedIndex === allResults.length) {
        // "View all results" option
        handleViewAllResults()
      } else {
        // Navigate to selected item
        const item = allResults[selectedIndex]
        if (item.username) {
          navigate(`/profile/${item.username}`)
        } else {
          navigate(`/post/${item.id}`)
        }
        handleClearSearch()
      }
    } else if (e.key === 'Escape') {
      setIsFocused(false)
      setSelectedIndex(-1)
    }
  }

  const handleViewAllResults = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`)
      handleClearSearch()
    }
  }

  const handleClearSearch = () => {
    setQuery('')
    setDebouncedQuery('')
    setIsFocused(false)
    setSelectedIndex(-1)
  }

  const handleUserClick = (username) => {
    navigate(`/profile/${username}`)
    handleClearSearch()
  }

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`)
    handleClearSearch()
  }

  const showDropdown = isFocused && debouncedQuery.trim().length > 0

  return (
    <div ref={searchRef} className={cn('relative w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/70 pointer-events-none z-10" />
        <Input
          type="text"
          placeholder="Search Bubbly"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          className="pl-11 pr-10 h-10 bg-background border border-border/60 hover:border-border focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/20 focus-visible:ring-offset-0 transition-all rounded-full text-sm placeholder:text-muted-foreground/60"
        />
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-full transition-all hover:rotate-90 duration-300"
            title="Clear search"
          >
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
          </Button>
        )}
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-2 w-full bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50 max-h-[500px] overflow-y-auto"
          >
            {/* Loading State */}
            {isLoading && (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* No Results */}
            {!isLoading && allResults.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No results found for "{debouncedQuery}"</p>
              </div>
            )}

            {/* Results */}
            {!isLoading && allResults.length > 0 && (
              <div className="py-2">
                {/* Users Section */}
                {users.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2 bg-secondary/30">
                      <User className="h-3 w-3" />
                      People
                    </div>
                    {users.map((user, index) => (
                      <motion.button
                        key={user.id}
                        onClick={() => handleUserClick(user.username)}
                        className={cn(
                          'w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/70 transition-colors text-left border-b border-border/50 last:border-b-0',
                          selectedIndex === index && 'bg-secondary'
                        )}
                        whileHover={{ x: 4 }}
                        transition={{ duration: 0.15 }}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getImageUrl(user.avatar)} alt={user.name} />
                          <AvatarFallback>{user.name?.[0] || user.username[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-sm truncate">{user.name || user.username}</p>
                            {user.verified && (
                              <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Separator */}
                {users.length > 0 && posts.length > 0 && <Separator className="my-2" />}

                {/* Posts Section */}
                {posts.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs font-semibold text-muted-foreground flex items-center gap-2 bg-secondary/30">
                      <FileText className="h-3 w-3" />
                      Posts
                    </div>
                    {posts.map((post, index) => {
                      const resultIndex = users.length + index
                      return (
                        <motion.button
                          key={post.id}
                          onClick={() => handlePostClick(post.id)}
                          className={cn(
                            'w-full px-4 py-3 flex items-center gap-3 hover:bg-secondary/70 transition-colors text-left border-b border-border/50 last:border-b-0',
                            selectedIndex === resultIndex && 'bg-secondary'
                          )}
                          whileHover={{ x: 4 }}
                          transition={{ duration: 0.15 }}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getImageUrl(post.user.avatar)} alt={post.user.name} />
                            <AvatarFallback>{post.user.name?.[0] || post.user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{post.user.name || post.user.username}</p>
                            <p className="text-xs text-muted-foreground line-clamp-2">{post.content}</p>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                )}

                {/* View All Results Button */}
                {totalResults > allResults.length && (
                  <>
                    <Separator className="my-0" />
                    <motion.button
                      onClick={handleViewAllResults}
                      className={cn(
                        'w-full px-4 py-3 text-sm text-primary font-medium hover:bg-secondary/70 transition-colors text-center border-t border-border',
                        selectedIndex === allResults.length && 'bg-secondary'
                      )}
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.15 }}
                    >
                      View all {totalResults} results
                    </motion.button>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
