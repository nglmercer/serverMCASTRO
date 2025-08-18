<template>
  <div 
    :class="[
      'flex items-center p-2 mb-2 rounded-lg transition-all duration-200 cursor-pointer select-none',
      active ? 'bg-blue-500/50 text-white' : 'hover:bg-blue-500/10'
    ]"
    :id="`server-${serverId}`"
    @click="handleClick"
    @contextmenu="handleContextMenu"
  >
    <!-- Icon Circle -->
    <div class="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 mr-4 flex-shrink-0 transition-colors duration-200">
      <img 
        :src="icon || '/favicon.svg'" 
        :alt="title || ''"
        class="w-5 h-5 object-contain brightness-0 invert"
      />
    </div>

    <!-- Server Details -->
    <div class="flex flex-col flex-grow overflow-hidden">
      <span class="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
        {{ title || '' }}
      </span>
      <span class="text-xs opacity-70 whitespace-nowrap overflow-hidden text-ellipsis">
        Size: {{ formattedSize }} | Modified: {{ formattedDate }} | v{{ version }}
      </span>
    </div>

    <!-- Actions Slot -->
    <div class="ml-auto flex items-center" :id="`server-actions-${serverId}`">
      <div class="w-full">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineEmits, defineExpose } from 'vue'

export interface ServerDetails {
  server: string | null;
  size: number;
  modified: string | null;
  version: string;
  status: string | null;
  title: string | null;
  icon: string | null;
}

export interface EDetails {
  data: ServerDetails;
  event: MouseEvent;
}

interface Props {
  server?: string | null;
  size?: number;
  version?: string;
  modified?: string | null;
  status?: string | null;
  icon?: string | null;
  title?: string;
  active?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  server: null,
  size: 0,
  version: 'Unknown',
  modified: null,
  status: null,
  icon: null,
  title: '',
  active: false
})

const emit = defineEmits<{
  selected: [details: EDetails]
  menu: [details: EDetails]
}>()

// Computed properties
const serverId = computed(() => 
  props.title ? props.title.replace(/\s+/g, '-').toLowerCase() : ''
)

const formattedSize = computed(() => {
  if (!props.size) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(props.size) / Math.log(1024))
  return `${(props.size / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
})

const formattedDate = computed(() => {
  if (!props.modified) return ''
  try {
    const date = new Date(props.modified)
    return date.toLocaleDateString()
  } catch {
    return ''
  }
})

// Methods
const getDetails = (): ServerDetails => ({
  server: props.server,
  size: props.size,
  modified: props.modified,
  version: props.version,
  status: props.status,
  title: props.title,
  icon: props.icon
})

const setActive = (isActive: boolean) => {
  // This would need to be handled by the parent component
  // since we can't directly mutate props in Vue 3
  console.log('setActive called with:', isActive)
}

const handleClick = (e: MouseEvent) => {
  const path = e.composedPath()
  const actionsContainer = document.querySelector(`#server-actions-${serverId.value}`)
  
  // Check if click was on actions container
  const clickedOnActions = actionsContainer && path.includes(actionsContainer)
  
  if (clickedOnActions) {
    return
  }
  
  emit('selected', { data: getDetails(), event: e })
}

const handleContextMenu = (e: MouseEvent) => {
  e.preventDefault()
  emit('menu', { data: getDetails(), event: e })
}

// Expose methods to parent components
defineExpose({
  getDetails,
  setActive
})
</script>