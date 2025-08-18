import { ref, computed } from 'vue'
import type { Ref } from 'vue'

export interface Server {
  id: string
  name: string
  size: number
  lastModified?: string
  status: string
  version?: string
  icon?: string
}

export interface ServerApiResponse {
  data?: any[]
  success?: boolean
  error?: string
}

// Global reactive state for servers
const servers: Ref<Server[]> = ref([])
const loading: Ref<boolean> = ref(false)
const error: Ref<string | null> = ref(null)
const activeServerId: Ref<string | null> = ref(null)

export function useServerApi() {
  // Import serverapi - adjust path as needed
  let serverapi: any = null
  
  // Try to import the serverapi
  const initializeApi = async () => {
    try {
      // Dynamic import to handle potential module loading issues
      const { serverapi: api } = await import('@utils/fetch/fetchapi')
      serverapi = api
      return true
    } catch (err) {
      console.error('Failed to load serverapi:', err)
      return false
    }
  }

  // Fetch servers from API
  const fetchServers = async (): Promise<Server[]> => {
    if (!serverapi) {
      const initialized = await initializeApi()
      if (!initialized) {
        throw new Error('Failed to initialize server API')
      }
    }

    loading.value = true
    error.value = null

    try {
      const response = await serverapi.getServers()
      
      if (!response || !response.data || !Array.isArray(response.data)) {
        throw new Error('Invalid response format')
      }

      const mappedServers = response.data.map((server: any) => ({
        id: server.name,
        name: server.name,
        size: server.size || 0,
        lastModified: server.lastModified || server.modified,
        status: server.status || 'stopped',
        version: server.version || 'N/A',
        icon: server.icon
      }))

      servers.value = mappedServers
      return mappedServers
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load servers'
      error.value = errorMessage
      console.error('Error fetching servers:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get server by ID
  const getServerById = (id: string): Server | undefined => {
    return servers.value.find(server => server.id === id)
  }

  // Set active server
  const setActiveServer = (serverId: string | null) => {
    activeServerId.value = serverId
  }

  // Get active server
  const activeServer = computed(() => {
    return activeServerId.value ? getServerById(activeServerId.value) : null
  })

  // Refresh servers
  const refreshServers = async () => {
    return await fetchServers()
  }

  // Server actions
  const startServer = async (serverId: string) => {
    if (!serverapi) await initializeApi()
    // Implement server start logic
    console.log('Starting server:', serverId)
  }

  const stopServer = async (serverId: string) => {
    if (!serverapi) await initializeApi()
    // Implement server stop logic
    console.log('Stopping server:', serverId)
  }

  const restartServer = async (serverId: string) => {
    if (!serverapi) await initializeApi()
    // Implement server restart logic
    console.log('Restarting server:', serverId)
  }

  return {
    // State
    servers: computed(() => servers.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    activeServerId: computed(() => activeServerId.value),
    activeServer,

    // Actions
    fetchServers,
    refreshServers,
    getServerById,
    setActiveServer,
    startServer,
    stopServer,
    restartServer,

    // Utilities
    initializeApi
  }
}

// Event emitter for global server events
export class ServerEventEmitter {
  private listeners: Map<string, Function[]> = new Map()

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  emit(event: string, ...args: any[]) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach(callback => callback(...args))
    }
  }

  clear() {
    this.listeners.clear()
  }
}

// Global event emitter instance
export const serverEvents = new ServerEventEmitter()

// Event types
export const SERVER_EVENTS = {
  SELECTED: 'server:selected',
  MENU: 'server:menu',
  OPTIONS: 'server:options',
  STATUS_CHANGED: 'server:status-changed',
  UPDATED: 'server:updated'
} as const

export type ServerEventType = typeof SERVER_EVENTS[keyof typeof SERVER_EVENTS]