<template>
  <div class="server-manager p-6 bg-gray-50 min-h-screen">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Server Manager</h1>
        <p class="text-gray-600">Manage your Minecraft servers with Vue components</p>
      </div>

      <!-- Controls -->
      <div class="mb-6 flex gap-4">
        <button 
          @click="refreshServers"
          :disabled="loading"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors"
        >
          {{ loading ? 'Loading...' : 'Refresh Servers' }}
        </button>
        
        <button 
          @click="clearSelection"
          :disabled="!activeServerId"
          class="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
        >
          Clear Selection
        </button>
      </div>

      <!-- Active Server Info -->
      <div v-if="activeServer" class="mb-6 p-4 bg-white rounded-lg shadow border-l-4 border-blue-500">
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Active Server</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-700">Name:</span>
            <span class="ml-2 text-gray-900">{{ activeServer.name }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Status:</span>
            <span class="ml-2" :class="getStatusColor(activeServer.status)">
              {{ activeServer.status }}
            </span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Version:</span>
            <span class="ml-2 text-gray-900">{{ activeServer.version }}</span>
          </div>
          <div>
            <span class="font-medium text-gray-700">Size:</span>
            <span class="ml-2 text-gray-900">{{ formatSize(activeServer.size) }}</span>
          </div>
        </div>
      </div>

      <!-- Event Log -->
      <div class="mb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-3">Event Log</h3>
        <div class="bg-white rounded-lg shadow max-h-40 overflow-y-auto">
          <div v-if="eventLog.length === 0" class="p-4 text-gray-500 text-center">
            No events yet. Interact with servers to see events here.
          </div>
          <div v-else class="divide-y divide-gray-200">
            <div 
              v-for="(event, index) in eventLog.slice().reverse()" 
              :key="index"
              class="p-3 text-sm"
            >
              <span class="text-gray-500">{{ event.timestamp }}</span>
              <span class="ml-2 font-medium" :class="getEventColor(event.type)">
                {{ event.type }}
              </span>
              <span class="ml-2 text-gray-700">{{ event.message }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Server List -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Servers</h2>
        </div>
        <div class="p-4">
          <ServerList
            ref="serverListRef"
            @server-selected="handleServerSelected"
            @server-menu="handleServerMenu"
            @server-options="handleServerOptions"
          />
        </div>
      </div>

      <!-- Server Options Modal (placeholder) -->
      <div 
        v-if="showOptionsModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click="closeOptionsModal"
      >
        <div 
          class="bg-white rounded-lg p-6 max-w-md w-full mx-4"
          @click.stop
        >
          <h3 class="text-lg font-semibold mb-4">Server Options</h3>
          <p class="text-gray-600 mb-4">
            Options for: <strong>{{ selectedServerForOptions?.name }}</strong>
          </p>
          <div class="flex gap-2">
            <button 
              @click="performServerAction('start')"
              class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Start
            </button>
            <button 
              @click="performServerAction('stop')"
              class="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Stop
            </button>
            <button 
              @click="performServerAction('restart')"
              class="px-3 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
            >
              Restart
            </button>
          </div>
          <button 
            @click="closeOptionsModal"
            class="mt-4 w-full px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import ServerList from './ServerList.vue'
import { useServerApi, serverEvents, SERVER_EVENTS, type Server } from '../../composables/useServerApi'

// Use the server API composable
const {
  servers,
  loading,
  error,
  activeServerId,
  activeServer,
  refreshServers: apiRefreshServers,
  setActiveServer,
  startServer,
  stopServer,
  restartServer
} = useServerApi()

// Local state
const serverListRef = ref<InstanceType<typeof ServerList> | null>(null)
const eventLog = ref<Array<{
  timestamp: string
  type: string
  message: string
}>>([])
const showOptionsModal = ref(false)
const selectedServerForOptions = ref<Server | null>(null)

// Event handlers
const handleServerSelected = (server: Server) => {
  addEventLog('SELECTED', `Server "${server.name}" selected`)
}

const handleServerMenu = (server: Server, event: Event) => {
  addEventLog('MENU', `Context menu opened for "${server.name}"`)
}

const handleServerOptions = (server: Server) => {
  selectedServerForOptions.value = server
  showOptionsModal.value = true
  addEventLog('OPTIONS', `Options opened for "${server.name}"`)
}

// Global event listeners
const onServerSelected = (server: Server) => {
  addEventLog('GLOBAL_EVENT', `Global server selected: "${server.name}"`)
}

const onServerMenu = (server: Server, event: MouseEvent) => {
  addEventLog('GLOBAL_EVENT', `Global server menu: "${server.name}"`)
}

const onServerOptions = (server: Server) => {
  addEventLog('GLOBAL_EVENT', `Global server options: "${server.name}"`)
}

// Utility functions
const addEventLog = (type: string, message: string) => {
  console.log("addEventLog", type, message)
  eventLog.value.push({
    timestamp: new Date().toLocaleTimeString(),
    type,
    message
  })
  
  // Keep only last 50 events
  if (eventLog.value.length > 50) {
    eventLog.value = eventLog.value.slice(-50)
  }
}

const refreshServers = async () => {
  try {
    await apiRefreshServers()
    addEventLog('REFRESH', 'Servers refreshed successfully')
  } catch (err) {
    addEventLog('ERROR', 'Failed to refresh servers')
  }
}

const clearSelection = () => {
  setActiveServer(null)
  addEventLog('CLEAR', 'Selection cleared')
}

const closeOptionsModal = () => {
  showOptionsModal.value = false
  selectedServerForOptions.value = null
}

const performServerAction = async (action: 'start' | 'stop' | 'restart') => {
  if (!selectedServerForOptions.value) return
  
  const server = selectedServerForOptions.value
  try {
    switch (action) {
      case 'start':
        await startServer(server.id)
        break
      case 'stop':
        await stopServer(server.id)
        break
      case 'restart':
        await restartServer(server.id)
        break
    }
    addEventLog('ACTION', `${action.toUpperCase()} command sent to "${server.name}"`)
  } catch (err) {
    addEventLog('ERROR', `Failed to ${action} "${server.name}"`)
  }
  
  closeOptionsModal()
}

// Styling helpers
const getStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'text-green-600'
    case 'stopped': return 'text-red-600'
    case 'starting': return 'text-yellow-600'
    default: return 'text-gray-600'
  }
}

const getEventColor = (type: string) => {
  switch (type) {
    case 'SELECTED': return 'text-blue-600'
    case 'MENU': return 'text-purple-600'
    case 'OPTIONS': return 'text-indigo-600'
    case 'GLOBAL_EVENT': return 'text-green-600'
    case 'REFRESH': return 'text-cyan-600'
    case 'ACTION': return 'text-orange-600'
    case 'ERROR': return 'text-red-600'
    default: return 'text-gray-600'
  }
}

const formatSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

// Lifecycle
onMounted(() => {
  // Register global event listeners
  serverEvents.on(SERVER_EVENTS.SELECTED, onServerSelected)
  serverEvents.on(SERVER_EVENTS.MENU, onServerMenu)
  serverEvents.on(SERVER_EVENTS.OPTIONS, onServerOptions)
  
  addEventLog('INIT', 'Server Manager initialized')
})

onUnmounted(() => {
  // Clean up event listeners
  serverEvents.off(SERVER_EVENTS.SELECTED, onServerSelected)
  serverEvents.off(SERVER_EVENTS.MENU, onServerMenu)
  serverEvents.off(SERVER_EVENTS.OPTIONS, onServerOptions)
})

// Expose for external access
defineExpose({
  servers,
  loading,
  error,
  activeServer,
  refreshServers,
  clearSelection,
  eventLog,
  serverListRef
})
</script>

<style scoped>
/* Additional custom styles if needed */
</style>