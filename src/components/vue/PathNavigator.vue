<template>
  <div class="path-navigator">
    <div class="flex items-center flex-wrap">
      <template v-for="(segment, index) in pathSegments" :key="segment.path">
        <span
          :class="[
            'path-segment',
            segment.path !== currentPath ? 'path-segment-clickable' : 'path-segment-current'
          ]"
          @click="segment.path !== currentPath && navigateToPath(segment.path)"
          :title="`Navigate to ${segment.path}`"
        >
          {{ segment.name }}
        </span>
        <span v-if="index < pathSegments.length - 1" class="path-separator">
          /
        </span>
      </template>
    </div>
    
    <div class="flex items-center gap-2">
      <button
        @click="goToBase"
        class="base-button"
        title="Go to base directory"
      >
        /
      </button>
      <button
        v-if="currentPath !== effectiveBasePath"
        @click="goUp"
        class="up-button"
        title="Go up one level"
      >
        ↑ Up
      </button>
      <button
        @click="refreshCurrentPath"
        class="refresh-button"
        title="Refresh current directory"
      >
        ↻ Refresh
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { emitter } from '../../utils/Emitter'
import { normalizePath, ROOT_PATH } from '../../utils/pathUtils'

export interface PathNavigatorProps {
  basePath?: string // Vendrá de props o será ""
  currentPath?: string // Path actual donde está navegando
}

const props = withDefaults(defineProps<PathNavigatorProps>(), {
  basePath: typeof window !== 'undefined' ? (window as any).selectedServer : '',
  currentPath: typeof window !== 'undefined' ? (window as any).selectedServer : '/'
})

// Define un nombre de servidor por defecto
const DEFAULT_SERVER_NAME_IF_EMPTY = "/"

const effectiveBasePath = computed(() => {
  let pathFromServer = props.basePath

  // Si props.basePath está vacío (ej: window.selectedServer no estaba definido o era ""),
  // y queremos asegurar que la base NUNCA sea ROOT_PATH ('/'),
  // entonces usamos un nombre de servidor por defecto.
  if (!pathFromServer || pathFromServer === ROOT_PATH) {
    pathFromServer = DEFAULT_SERVER_NAME_IF_EMPTY
  }
  
  // normalizePath debe asegurar que "serverName" se convierta en "/serverName"
  // y "/serverName/" se convierta en "/serverName".
  // También, si pathFromServer ya es "/serverName", debe mantenerse así.
  const normalized = normalizePath(pathFromServer)

  // Doble chequeo: si normalizePath("") devuelve ROOT_PATH y pathFromServer era "",
  // y no queremos ROOT_PATH, forzamos el default de nuevo.
  if (normalized === ROOT_PATH && pathFromServer !== ROOT_PATH) {
    const reNormalizedDefault = normalizePath(DEFAULT_SERVER_NAME_IF_EMPTY)
    if (reNormalizedDefault === ROOT_PATH && reNormalizedDefault !== ROOT_PATH) {
      console.error("Critical: DEFAULT_SERVER_NAME_IF_EMPTY results in ROOT_PATH. Check configuration.")
      return reNormalizedDefault
    }
    return reNormalizedDefault
  }

  return normalized
})

// Internal path state - use prop currentPath or fallback to effectiveBasePath
const currentPath = ref<string>(props.currentPath || effectiveBasePath.value)

const pathSegments = computed(() => {
  const path = currentPath.value
  const basePath = effectiveBasePath.value
  const segments: { name: string; path: string }[] = []

  // Normalizar paths para asegurar consistencia
  const normalizedPath = normalizePath(path)
  const normalizedBasePath = normalizePath(basePath)
  
  // Si el path actual es igual al basePath, solo mostrar el basePath
  if (normalizedPath === normalizedBasePath) {
    const baseSegmentName = normalizedBasePath.split('/').filter(p => p.length > 0).pop() || '/'
    segments.push({ name: baseSegmentName, path: normalizedBasePath })
    return segments
  }
  
  // Verificar que el path actual esté dentro del basePath
  if (!normalizedPath.startsWith(normalizedBasePath)) {
    // Si no está dentro, mostrar solo el basePath
    const baseSegmentName = normalizedBasePath.split('/').filter(p => p.length > 0).pop() || '/'
    segments.push({ name: baseSegmentName, path: normalizedBasePath })
    return segments
  }
  
  // Obtener la parte relativa del path después del basePath
  const relativePath = normalizedPath.slice(normalizedBasePath.length)
  const relativeParts = relativePath.split('/').filter(p => p.length > 0)
  
  // Agregar el segmento base
  const baseSegmentName = normalizedBasePath.split('/').filter(p => p.length > 0).pop() || '/'
  segments.push({ name: baseSegmentName, path: normalizedBasePath })
  
  // Agregar segmentos relativos acumulativos
  let accumulatedPath = normalizedBasePath
  for (const part of relativeParts) {
    accumulatedPath = `${accumulatedPath}/${part}`
    segments.push({ name: part, path: accumulatedPath })
  }
  
  return segments
})

let unsubscribePathUpdate: (() => void) | null = null

onMounted(() => {
  // Listen for path updates from other components
  unsubscribePathUpdate = emitter.on('path-navigator:update-path', (data: { path: string }) => {
    const normalizedNewPath = normalizePath(data.path)
    const basePath = effectiveBasePath.value
    
    const pathForVueRef = normalizedNewPath.startsWith(basePath) && 
                          normalizedNewPath.length >= basePath.length
      ? normalizedNewPath
      : basePath // Si está fuera de los límites del basePath, se ajusta al basePath

    if (currentPath.value !== pathForVueRef) {
      currentPath.value = pathForVueRef
    }
  })
})

onUnmounted(() => {
  if (unsubscribePathUpdate) {
    unsubscribePathUpdate()
  }
})

// Watch for basePath changes
watch(effectiveBasePath, (newBasePath) => {
  const current = currentPath.value
  
  // Si currentPath es más corto que basePath o no comienza con él,
  // (ej. si basePath cambió dinámicamente), reajusta.
  if (!current.startsWith(newBasePath) || current.length < newBasePath.length) {
    currentPath.value = newBasePath
    // Emit path change event
    emitter.emit('path-navigator:path-changed', { path: newBasePath })
  }
})

// Watch for currentPath prop changes
watch(() => props.currentPath, (newCurrentPath) => {
  if (newCurrentPath && newCurrentPath !== currentPath.value) {
    currentPath.value = newCurrentPath
  }
})

const goUp = () => {
  const path = currentPath.value
  const basePath = effectiveBasePath.value

  if (path === basePath) return // Ya está en el nivel más alto permitido

  const parts = path.split('/').filter(p => p.length > 0)
  parts.pop()
  
  let newPath = `${ROOT_PATH}${parts.join('/')}`
  newPath = normalizePath(newPath)

  // Verificación final: el newPath no puede ser más superficial que basePath.
  const finalPath = !newPath.startsWith(basePath) || newPath.length < basePath.length
    ? basePath
    : newPath
    
  if (currentPath.value !== finalPath) {
    currentPath.value = finalPath
    // Emit path change event
    emitter.emit('path-navigator:path-changed', { path: finalPath })
  }
}

const navigateToPath = (newPathFromClick: string) => {
  const normalizedNewPath = normalizePath(newPathFromClick)
  const basePath = effectiveBasePath.value
  const previousPath = currentPath.value

  const finalPath = normalizedNewPath.startsWith(basePath) && normalizedNewPath.length >= basePath.length
    ? normalizedNewPath
    : basePath // Si el path clickeado está fuera, ir al basePath

  console.log('navigateToPath', { from: previousPath, to: finalPath, clicked: newPathFromClick })
  
  if (currentPath.value !== finalPath) {
    currentPath.value = finalPath
    // Emit path change event to trigger file explorer re-render
    emitter.emit('path-navigator:path-changed', { path: finalPath })
    // Also emit a specific navigation event for better tracking
    emitter.emit('path-navigator:navigate', { 
      from: previousPath, 
      to: finalPath,
      trigger: 'segment-click'
    })
  }
}

const goToBase = () => {
  const basePath = effectiveBasePath.value
  const previousPath = currentPath.value
  console.log("goToBase", {basePath, currentPath: previousPath})
  if (currentPath.value !== basePath) {
    currentPath.value = basePath
    // Emit path change event
    emitter.emit('path-navigator:path-changed', { path: basePath })
    // Also emit a specific navigation event for better tracking
    emitter.emit('path-navigator:navigate', { 
      from: previousPath, 
      to: basePath,
      trigger: 'base-button'
    })
  }
}

const refreshCurrentPath = () => {
  // Emit refresh event to trigger file explorer data reload
  emitter.emit('path-navigator:refresh-requested', { path: currentPath.value })
  emitter.emit('file-explorer:refresh-data', { path: currentPath.value })
}
</script>

<style scoped>
.path-navigator {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  margin-bottom: 16px;
  background-color: #ffffff;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease-in-out;
}

.path-segment {
  padding: 4px 8px;
  border-radius: 3px;
  transition: all 0.2s ease-in-out;
}

.path-segment-clickable {
  color: #2563eb;
  cursor: pointer;
}

.path-segment-clickable:hover {
  background-color: #f3f4f6;
  text-decoration: underline;
}

.path-segment-current {
  color: #374151;
}

.path-separator {
  margin: 0 4px;
  color: #6b7280;
}

.base-button, .up-button, .refresh-button {
  padding: 6px 12px;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
  display: flex;
  align-items: center;
  gap: 4px;
}

.base-button:hover, .up-button:hover, .refresh-button:hover {
  background-color: #374151;
}

.base-button {
  background-color: #7c3aed;
  font-weight: bold;
}

.base-button:hover {
  background-color: #6d28d9;
}

.refresh-button {
  background-color: #059669;
}

.refresh-button:hover {
  background-color: #047857;
}

/* Dark mode styles using prefers-color-scheme media query */
@media (prefers-color-scheme: dark) {
  .path-navigator {
    border-color: #374151;
    background-color: #1f2937;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2);
  }

  .path-segment-clickable {
    color: #60a5fa;
  }

  .path-segment-clickable:hover {
    background-color: #374151;
  }

  .path-segment-current {
    color: #e5e7eb;
  }

  .path-separator {
    color: #9ca3af;
  }

  .base-button, .up-button, .refresh-button {
    background-color: #6b7280;
  }

  .base-button:hover, .up-button:hover, .refresh-button:hover {
    background-color: #9ca3af;
  }

  .base-button {
    background-color: #8b5cf6;
  }

  .base-button:hover {
    background-color: #7c3aed;
  }

  .refresh-button {
    background-color: #10b981;
  }

  .refresh-button:hover {
    background-color: #059669;
  }
}

/* Light mode explicit styles (optional, for clarity) */
@media (prefers-color-scheme: light) {
  .path-navigator {
    border-color: #d1d5db;
    background-color: #ffffff;
  }

  .path-segment-clickable {
    color: #2563eb;
  }

  .path-segment-clickable:hover {
    background-color: #f3f4f6;
  }

  .path-segment-current {
    color: #374151;
  }

  .path-separator {
    color: #6b7280;
  }

  .up-button, .refresh-button {
    background-color: #4b5563;
  }

  .up-button:hover, .refresh-button:hover {
    background-color: #374151;
  }

  .refresh-button {
    background-color: #059669;
  }

  .refresh-button:hover {
    background-color: #047857;
  }
}
</style>