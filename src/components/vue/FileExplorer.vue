<template>
  <div class="block font-sans text-gray-300 bg-gray-800 border border-gray-600 border-opacity-50">
    <!-- Path Navigator -->
    <PathNavigator :basePath="basePath" :currentPath="internalCurrentPath"/>
    <table class="w-full border-collapse">
      <thead>
        <tr>
          <th 
            @click="handleSort('name')"
            class="bg-gray-700 text-gray-200 sticky top-0 z-10 px-3 py-2 text-left border-b border-gray-600 border-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-600"
          >
            Name {{ headerIcons.name }}
          </th>
          <th 
            @click="handleSort('path')"
            class="bg-gray-700 text-gray-200 sticky top-0 z-10 px-3 py-2 text-left border-b border-gray-600 border-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-600"
          >
            Path {{ headerIcons.path }}
          </th>
          <th 
            @click="handleSort('size')"
            class="bg-gray-700 text-gray-200 sticky top-0 z-10 px-3 py-2 text-left border-b border-gray-600 border-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-600"
          >
            Size {{ headerIcons.size }}
          </th>
          <th 
            @click="handleSort('lastModified')"
            class="bg-gray-700 text-gray-200 sticky top-0 z-10 px-3 py-2 text-left border-b border-gray-600 border-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis cursor-pointer hover:bg-gray-600"
          >
            Modified {{ headerIcons.lastModified }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in sortedData"
          :key="item.path"
          :class="item.type"
          tabindex="0"
          :aria-label="`File ${item.name}, type ${item.type}`"
          @dblclick="handleDblClick(item)"
          @contextmenu="handleContextMenu($event, item)"
          @keydown="handleKeydown($event, item)"
          class="px-3 py-2 text-left border-b border-gray-600 border-opacity-50 whitespace-nowrap overflow-hidden text-ellipsis hover:bg-gray-700 cursor-pointer"
        >
          <td class="px-3 py-2">
            <span 
              :class="[
                'inline-block w-5 h-5 mr-2 align-middle',
                item.type === 'directory' ? 'text-blue-400' : 'text-gray-400'
              ]"
            >
              {{ item.type === 'directory' ? '📁' : '📄' }}
            </span>
            {{ item.name }}
          </td>
          <td class="px-3 py-2">{{ item.path }}</td>
          <td class="px-3 py-2">
            {{ item.type === 'directory' ? '-' : formatFileSize(item.size) }}
          </td>
          <td class="px-3 py-2">{{ formatDate(item.lastModified) }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { emitter } from '@utils/Emitter'
import { filemanagerapi, serverapi } from "@utils/fetch/fetchapi.ts";
import { normalizePath } from '@utils/pathUtils';
import PathNavigator from './PathNavigator.vue';

export interface FileSystemItem {
  name: string
  path: string
  type: 'file' | 'directory'
  size?: number
  lastModified?: string | Date
  isDirectory?: boolean
  modified?: string | Date
}

export interface ItemSelectedEventDetail {
  data: FileSystemItem
}

export interface ItemMenuEventDetail {
  event: MouseEvent
  data: FileSystemItem
}

export interface PathUpdatedEventDetail {
  path: string
}

interface Props {
  id?: string
  currentPath?: string
  basePath?: string
  data?: FileSystemItem[]
}

const props = withDefaults(defineProps<Props>(), {
  currentPath: '/',
  basePath: typeof window !== 'undefined' ? (window as any).selectedServer || '/' : '/',
  data: () => []
})

// Create reactive refs for internal state
const internalCurrentPath = ref(props.currentPath)
const internalData = ref<FileSystemItem[]>([...props.data])

const emit = defineEmits<{
  selected: [detail: ItemSelectedEventDetail]
  menu: [detail: ItemMenuEventDetail]
  updated: [detail: PathUpdatedEventDetail]
  sort: [detail: { column: string; direction: 'asc' | 'desc' }]
}>()

// Create emitter instance for global event handling
const fileExplorerEmitter = emitter

const sortColumn = ref<string>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')
const headerIcons = ref({
  name: '↕️',
  path: '↕️',
  size: '↕️',
  lastModified: '↕️'
})



// Use internal reactive refs
const currentPath = internalCurrentPath
const data = internalData

const normalizedCurrentPath = computed(() => {
  return normalizePath(internalCurrentPath.value)
})

const processedData = computed(() => {
  return (internalData.value || []).map(item => ({
    ...item,
    name: item.name || 'Unnamed',
    path: normalizePath(item.path),
    type: item.type || (item.isDirectory ? "directory" : "file"),
    lastModified: item.lastModified || item.modified || new Date().toISOString(),
    size: item.size === undefined && (item.type === 'file' || (!item.isDirectory && !item.type)) ? 0 : item.size,
  }))
})

const sortedData = computed(() => {
  const data = [...processedData.value]
  
  return data.sort((a, b) => {
    let valueA: any, valueB: any
    
    switch (sortColumn.value) {
      case 'name':
        valueA = a.name.toLowerCase()
        valueB = b.name.toLowerCase()
        break
      case 'path':
        valueA = a.path.toLowerCase()
        valueB = b.path.toLowerCase()
        break
      case 'size':
        // Always sort directories before files when sorting by size
        if (a.type === 'directory' && b.type !== 'directory') return -1
        if (a.type !== 'directory' && b.type === 'directory') return 1
        
        valueA = a.size || 0
        valueB = b.size || 0
        break
      case 'lastModified':
        valueA = new Date(a.lastModified || a.modified || '').getTime()
        valueB = new Date(b.lastModified || b.modified || '').getTime()
        break
      default:
        valueA = a.name.toLowerCase()
        valueB = b.name.toLowerCase()
    }
    
    // Apply sort direction
    if (sortDirection.value === 'asc') {
      return valueA > valueB ? 1 : valueA < valueB ? -1 : 0
    } else {
      return valueA < valueB ? 1 : valueA > valueB ? -1 : 0
    }
  })
})



function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '-'
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateInput?: string | Date): string {
  if (!dateInput) return "-"
  
  try {
    const date = new Date(dateInput)
    if (isNaN(date.getTime())) return "-"

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (e) {
    return "-"
  }
}

async function handleDblClick(item: FileSystemItem): Promise<void> {
  if (item.type === 'directory') {
    // Navigate into directory
    await navigateToDirectory(item.path)
  } else {
    // Handle file selection
    const data = item;
    emit('selected', {data})
    // Emit global event through emitter
    fileExplorerEmitter.emit('file-explorer:selected', {data})
  }
}

function handleContextMenu(event: MouseEvent, item: FileSystemItem): void {
  event.preventDefault()
  const data = item;

  emit('menu', { event, data })
  // Emit global event through emitter
  fileExplorerEmitter.emit('file-explorer:menu', { event, data })
}

function handleKeydown(event: KeyboardEvent, item: FileSystemItem): void {
  if (event.key === 'Enter' || event.key === ' ') {
    handleDblClick(item)
  }
}

async function navigateToDirectory(directoryPath: string): Promise<void> {
  try {
    console.log(`Navigating to directory: ${directoryPath}`);
    
    // Update current path
    const normalizedPath = normalizePath(directoryPath);
    internalCurrentPath.value = normalizedPath;
    
    // Update PathNavigator via emitter
    emitter.emit('path-navigator:update-path', { path: normalizedPath });
    
    // Fetch files for the new directory
    const result = await fetchFiles(normalizedPath);
    if (result?.files) {
      internalData.value = result.files;
      console.log(`Loaded ${result.files.length} items for path: ${normalizedPath}`);
    } else {
      console.warn(`No files found for path: ${normalizedPath}`);
      internalData.value = [];
    }
    
    // Emit events
    emit('updated', { path: normalizedPath });
        console.log("normalizedPath", normalizedPath)
    fileExplorerEmitter.emit('file-explorer:path-updated', { path: normalizedPath });
    fileExplorerEmitter.emit('file-explorer:data-updated', { data: result?.files || [] });
    
    // Force Vue reactivity update
    await nextTick();
  } catch (error) {
    console.error('Error navigating to directory:', error);
    // On error, keep current data but still update path
    const normalizedPath = normalizePath(directoryPath);
    emit('updated', { path: normalizedPath });
    fileExplorerEmitter.emit('file-explorer:navigation-error', { path: normalizedPath, error });
  }
}



function handleSort(column: string): void {
  if (sortColumn.value === column) {
    // Toggle sort direction if clicking on the same column
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    // Set new sort column with default ascending direction
    sortColumn.value = column
    sortDirection.value = 'asc'
  }
  
  // Update header icons
  updateHeaderIcons()
  
  // Emit sort event
  emit('sort', { column: sortColumn.value, direction: sortDirection.value })
  // Emit global event through emitter
  fileExplorerEmitter.emit('file-explorer:sort', { column: sortColumn.value, direction: sortDirection.value })
}

function updateHeaderIcons(): void {
  // Reset all icons
  const icons = {
    name: '↕️',
    path: '↕️',
    size: '↕️',
    lastModified: '↕️'
  }
  
  // Set the icon for the sorted column
  icons[sortColumn.value as keyof typeof icons] = sortDirection.value === 'asc' ? '⬆️' : '⬇️'
  
  headerIcons.value = icons
}

// Watch for props changes and update internal refs
watch(
  () => props.currentPath,
  (newPath) => {
    internalCurrentPath.value = newPath
    const normalizedPath = normalizePath(newPath)
    console.log("normalizedPath", normalizedPath)
    emit('updated', { path: normalizedPath })
    // Emit global event through emitter
    fileExplorerEmitter.emit('file-explorer:path-updated', { path: normalizedPath })
  }
)

watch(
  () => props.data,
  (newData) => {
    internalData.value = [...(newData || [])]
    // Emit global event through emitter when data changes
    fileExplorerEmitter.emit('file-explorer:data-updated', { data: newData })
  },
  { deep: true }
)

// Initialize header icons on mount
onMounted(async () => {
  updateHeaderIcons();
  
  // Listen to PathNavigator path changes
  const unsubscribePathChanged = emitter.on('path-navigator:path-changed', (data: { path: string }) => {
    if (data.path !== internalCurrentPath.value) {
      navigateToDirectory(data.path);
    }
  });
  
  // Listen to PathNavigator navigation events for better tracking
  const unsubscribeNavigate = emitter.on('path-navigator:navigate', (data: { from: string, to: string, trigger: string }) => {
    console.log(`Navigation triggered by ${data.trigger}: ${data.from} -> ${data.to}`);
    if (data.to !== internalCurrentPath.value) {
      navigateToDirectory(data.to);
    }
  });
  
  // Listen to refresh requests from PathNavigator
  const unsubscribeRefresh = emitter.on('file-explorer:refresh-data', async (data: { path: string }) => {
    console.log(`Refreshing data for path: ${data.path}`);
    try {
      const result = await fetchFiles(data.path);
      if (result?.files) {
        internalData.value = result.files;
        // Emit data updated event
        fileExplorerEmitter.emit('file-explorer:data-updated', { data: result.files });
      }
    } catch (error) {
      console.error('Error refreshing directory data:', error);
    }
  });
  
  // Cleanup on unmount
  onUnmounted(() => {
    unsubscribePathChanged();
    unsubscribeNavigate();
    unsubscribeRefresh();
  });
  
  // Listen for external data updates from Astro
  const handleUpdateFiles = (event: CustomEvent) => {
    if (event.detail) {
      // Update internal refs with new data
      if (event.detail.currentPath) {
        internalCurrentPath.value = event.detail.currentPath
      }
      if (event.detail.data) {
        internalData.value = [...event.detail.data]
      }
      emit('updated', { path: event.detail.currentPath || '/' });
      // Emit global event through emitter
      fileExplorerEmitter.emit('file-explorer:external-update', { 
        currentPath: event.detail.currentPath || '/', 
        data: event.detail.data 
      });
    }
  };
  const UpdateData = async (newPath?:string) => {
      const data = await fetchFiles(newPath || window.selectedServer)
      internalData.value = data?.files || [];
  }
  UpdateData()
  // Add event listener for external updates
  const element = document.getElementById('filemanager');
  if (element) {
    element.addEventListener('update-files', handleUpdateFiles as EventListener);
  }
  
  // Cleanup on unmount
  onUnmounted(() => {
    if (element) {
      element.removeEventListener('update-files', handleUpdateFiles as EventListener);
    }
  });
});
async function fetchFiles(path: string= window.selectedServer) {
    if (path === "/") return;
    const pathENCODED = encodeURIComponent(path);
    const result = await filemanagerapi.getFolderInfo(pathENCODED);
    console.log("result", result);
    return result.data
}
</script>