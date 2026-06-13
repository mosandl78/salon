import { useQuery } from '@tanstack/react-query'
import api from '../api'
import type { User } from '../types'

export function useCurrentUser() {
  return useQuery<User>({
    queryKey: ['me'],
    queryFn: () => api.get('/auth/me').then(r => r.data),
    staleTime: 5 * 60_000,
    retry: false,
  })
}
