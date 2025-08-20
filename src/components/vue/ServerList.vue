<template>
  <div class="servers-container space-y-2">
    <!-- Loading State -->
    <div v-if="loading" class="p-4">
      <p class="loading-text">Loading servers...</p>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4">
      <p class="error-text">{{ error }}</p>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && !error && servers.length === 0" class="p-4">
      <p class="empty-text">No servers found.</p>
    </div>

    <!-- Server List -->
    <div 
      v-for="server in servers" 
      :key="server.id" 
      class="server-card"
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
                class="server-options-btn"
                @click="openServerOptions(server)"
              >
                <span class="material-symbols-rounded server-options-icon">more_vert</span>
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
import { useServerApi, type Server } from '../../composables/useServerApi'
import ServerItem from './ServerItem.vue'
import { emitter } from '@utils/Emitter'
// Define emits
const emit = defineEmits<{
  'server-selected': [server: Server]
  'server-menu': [server: Server, event: Event]
  'server-options': [server: Server]
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

// Define interface for event details
interface ServerEventDetails {
  data: {
    server?: string
  }
  event?: Event
}

// Event handlers
const handleServerSelected = (details: ServerEventDetails | any) => {
  const server = getServerById(details.data.server || '')
  if (server) {
    setActiveServer(server.id)
    emit('server-selected', server);
    console.log("handleServerSelected", server);
    emitter.emit('server-selected', server);
    window.location.href = '/console/?server=' + server.id
    console.log('Server selected:', server.id)
  }
}

const handleServerMenu = (details: ServerEventDetails | any) => {
  const server = getServerById(details.data.server || '')
  if (server && details.event) {
    console.log("handleServerMenu", server, details.event);
    emit('server-menu', server, details.event);
    emitter.emit('server-menu', {server, event: details.event});
  }
}

const openServerOptions = (server: Server) => {
  emit('server-options', server);
  console.log("openServerOptions", server);
  emitter.emit('server-options', server);
}
</script>

<style scoped>
/* CSS Custom Properties for Light Mode (Default) */
.servers-container {
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border-color: #e5e7eb;
  --text-primary: #374151;
  --text-secondary: #6b7280;
  --text-error: #ef4444;
  --shadow-light: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --hover-bg: #f3f4f6;
  --icon-color: #6b7280;
}

/* Dark Mode Styles */
@media (prefers-color-scheme: dark) {
  .servers-container {
    --bg-primary: #1f2937;
    --bg-secondary: #111827;
    --border-color: #374151;
    --text-primary: #f9fafb;
    --text-secondary: #d1d5db;
    --text-error: #f87171;
    --shadow-light: 0 1px 2px 0 rgb(0 0 0 / 0.3);
    --shadow-hover: 0 4px 6px -1px rgb(0 0 0 / 0.4), 0 2px 4px -2px rgb(0 0 0 / 0.3);
    --hover-bg: #374151;
    --icon-color: #d1d5db;
  }
}

/* Component Styles */
.servers-container {
  background-color: var(--bg-secondary);
}

.loading-text,
.empty-text {
  color: var(--text-secondary);
}

.error-text {
  color: var(--text-error);
}

.server-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  box-shadow: var(--shadow-light);
  transition: box-shadow 0.2s ease-in-out;
}

.server-card:hover {
  box-shadow: var(--shadow-hover);
}

.server-options-btn {
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease-in-out;
}

.server-options-btn:hover {
  background-color: var(--hover-bg);
}

.server-options-icon {
  color: var(--icon-color);
}

/* Ensure proper spacing and layout */
.servers-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>