<template>
  <div class="servers-container space-y-2">
    <!-- Loading State -->
    <div v-if="loading" class="p-4">
      <p class="text-gray-600">Loading servers...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4">
      <p class="text-red-500">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && servers.length === 0" class="p-4">
      <p class="text-gray-600">No servers found.</p>
    </div>

    <!-- Server List -->
    <div 
      v-for="server in servers" 
      :key="server.id" 
      class="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
    >
      <div class="p-4">
        <ServerItem
          :icon="server.icon || '/favicon.svg'"
          :title="server.name"
          :size="server.size"
          :version="server.version"
          :modified="server.lastModified"
          :server="server.id"
          :status="server.status"
          :active="activeServerId === server.id"
          @selected="handleServerSelected"
          @menu="handleServerMenu"
        >
          <template #default>
            <div class="flex items-center justify-between w-full">
              <div class="flex items-center">
                <StatusIndicator :status="server.status" />
              </div>
              <button 
                class="p-1 rounded hover:bg-gray-200 transition-colors"
                @click="openServerOptions(server)"
              >
                <span class="material-symbols-rounded text-gray-600">more_vert</span>
              </button>
            </div>
          </template>
        </ServerItem>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, defineComponent } from 'vue'
import { useServerApi } from '../../composables/useServerApi'
import { serverEvents, SERVER_EVENTS } from '../../composables/useServerApi'
import ServerItem from './ServerItem.vue'

// Define emits
const emit = defineEmits<{
  'server-selected': [server: any]
  'server-menu': [server: any, event: Event]
  'server-options': [server: any]
}>()

// Status Indicator Component
const StatusIndicator = defineComponent({
  props: {
    status: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const getColorClass = computed(() => {
      switch (props.status) {
        case 'running': return 'bg-green-500'
        case 'stopped': return 'bg-red-500'
        case 'starting': return 'bg-yellow-500'
        default: return 'bg-gray-500'
      }
    })

    return { getColorClass }
  },
  template: `
    <div 
      :class="'w-3 h-3 rounded-full mr-2 ' + getColorClass"
      :title="status"
    ></div>
  `
})

// Use the server API composable
const {
  servers,
  loading,
  error,
  activeServerId,
  fetchServers,
  setActiveServer,
  getServerById
} = useServerApi()

// Initialize servers on mount
onMounted(async () => {
  await fetchServers()
})

// Event handlers
const handleServerSelected = (details: any) => {
  const server = getServerById(details.data.server || '')
  if (server) {
    setActiveServer(server.id)
    emit('server-selected', server)
    window.location.href = '/console/?server=' + server.id
    serverEvents.emit(SERVER_EVENTS.SELECTED, server)
    console.log('Server selected:', server.id)
  }
}

const handleServerMenu = (details: any) => {
  const server = getServerById(details.data.server || '')
  if (server) {
    emit('server-menu', server, details.event)
    serverEvents.emit(SERVER_EVENTS.MENU, server, details.event)
  }
}

const openServerOptions = (server: any) => {
  emit('server-options', server)
  serverEvents.emit(SERVER_EVENTS.OPTIONS, server)
}
</script>

<style scoped>
.servers-container {
  /* Custom styles if needed */
}
</style>