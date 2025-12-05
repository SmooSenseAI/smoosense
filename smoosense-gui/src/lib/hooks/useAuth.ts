import { useState, useEffect } from 'react'

export interface AuthUser {
  email: string
  name: string
  picture: string | null
}

export interface AuthState {
  authenticated: boolean
  user: AuthUser | null
  loading: boolean
  error: string | null
}

/**
 * Hook to get current authentication state.
 * Fetches user info from /auth/me endpoint.
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    authenticated: false,
    user: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchAuthState() {
      try {
        const response = await fetch('/auth/me')
        if (!response.ok) {
          throw new Error('Failed to fetch auth state')
        }
        const data = await response.json()

        if (data.authenticated) {
          setState({
            authenticated: true,
            user: {
              email: data.email,
              name: data.name,
              picture: data.picture || null,
            },
            loading: false,
            error: null,
          })
        } else {
          setState({
            authenticated: false,
            user: null,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        setState({
          authenticated: false,
          user: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    fetchAuthState()
  }, [])

  return state
}

/**
 * Redirect to login page
 */
export function login(): void {
  window.location.href = '/auth/login'
}

/**
 * Redirect to logout
 */
export function logout(): void {
  window.location.href = '/auth/logout'
}
