import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'

const STRATEGY = import.meta.env.VITE_AUTH0_WHITELIST_STRATEGY || 'role'
const ROLES_CLAIM = import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://pws.app/roles'
const WHITELIST_CLAIM = import.meta.env.VITE_AUTH0_WHITELIST_CLAIM || 'https://pws.app/whitelisted'
const ROLE_NAME = import.meta.env.VITE_AUTH0_ROLE_NAME || 'Resident'

export function useAuth() {
  const { user, isAuthenticated, isLoading, loginWithRedirect, logout: auth0Logout } = useAuth0()

  const isMember = computed(() => {
    if (!isAuthenticated.value || !user.value) return false
    if (STRATEGY === 'role') {
      const roles = user.value[ROLES_CLAIM]
      return Array.isArray(roles) && roles.includes(ROLE_NAME)
    }
    return user.value[WHITELIST_CLAIM] === true
  })

  function login(targetUrl?: string) {
    loginWithRedirect({ appState: { targetUrl: targetUrl || '/' } })
  }

  function logout() {
    auth0Logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return { user, isAuthenticated, isLoading, isMember, login, logout }
}
