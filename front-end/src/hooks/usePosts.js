import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export function usePosts() {
  return useQuery(['posts'], async () => {
    const { data } = await api.get('/posts')
    return data
  })
}

export function usePost(id) {
  return useQuery(['post', id], async () => {
    const { data } = await api.get(`/posts/${id}`)
    return data
  }, { enabled: !!id })
}
