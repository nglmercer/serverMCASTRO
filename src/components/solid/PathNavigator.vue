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
        >
          {{ segment.name }}
        </span>
        <span v-if="index < pathSegments.length - 1" class="path-separator">
          /
        </span>
      </template>
    </div>
    
    <div class="flex items-center">
      <button
        v-if="currentPath !== effectiveBasePath"
        @click="goUp"
        class="up-button"
      >
        Subir Nivel (..)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { pathSignal as globalCustomPathSignal, normalizePath, ROOT_PATH } from '../../globalSignals'

export interface PathNavigatorProps {
  basePath?: string // Vendrá de window.selectedServer o será ""
}

const props = withDefaults(defineProps<PathNavigatorProps>(), {
  basePath: ''
})

// Define un nombre de servidor por defecto si window.selectedServer está vacío
const DEFAULT_SERVER_NAME_IF_EMPTY = (typeof window !== "undefined" ? (window as any).selectedServer : "") || "/"

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

const getInitialNormalizedPath = () => {
  const globalPath = normalizePath(globalCustomPathSignal.value)
  const basePath = effectiveBasePath.value // Ya está normalizado y nunca es ROOT_PATH

  const initialPathToUse = !globalPath.startsWith(basePath) || globalPath.length < basePath.length 
    ? basePath 
    : globalPath

  if (globalCustomPathSignal.value !== initialPathToUse) {
    globalCustomPathSignal.value = initialPathToUse
  }
  
  return initialPathToUse
}

const currentPath = ref<string>(getInitialNormalizedPath())

const pathSegments = computed(() => {
  const path = currentPath.value
  const basePath = effectiveBasePath.value
  const segments: { name: string; path: string }[] = []

  // El nombre del segmento base. Como basePath nunca es ROOT_PATH, siempre tendrá partes.
  const baseParts = basePath.split('/').filter(p => p.length > 0)
  const baseSegmentName = baseParts.length > 0 ? baseParts[baseParts.length - 1] : 'Base'
  segments.push({ name: baseSegmentName, path: basePath })

  if (path === basePath) {
    return segments
  }
  
  let relativePathString = ''
  if (path.startsWith(basePath) && path.length > basePath.length) {
    relativePathString = path.substring(basePath.length + 1)
  }
  
  const relativeParts = relativePathString.split('/').filter(p => p.length > 0)
  
  if (relativeParts.length > 0) {
    let currentSegmentPathAccumulator = basePath
    for (const part of relativeParts) {
      currentSegmentPathAccumulator = `${currentSegmentPathAccumulator}/${part}`
      // Normalizar solo si es estrictamente necesario
      if (currentSegmentPathAccumulator.includes('//') || currentSegmentPathAccumulator.includes('\\')) {
        currentSegmentPathAccumulator = normalizePath(currentSegmentPathAccumulator)
      }
      segments.push({ name: part, path: currentSegmentPathAccumulator })
    }
  }
  
  return segments
})

let unsubscribe: (() => void) | null = null

onMounted(() => {
  unsubscribe = globalCustomPathSignal.subscribe((newGlobalValue: string) => {
    const normalizedNewGlobalValue = normalizePath(newGlobalValue)
    const basePath = effectiveBasePath.value
    
    if (newGlobalValue !== normalizedNewGlobalValue && globalCustomPathSignal.value === newGlobalValue) {
      globalCustomPathSignal.value = normalizedNewGlobalValue
      return
    }
    
    const pathForVueRef = normalizedNewGlobalValue.startsWith(basePath) && 
                          normalizedNewGlobalValue.length >= basePath.length
      ? normalizedNewGlobalValue
      : basePath // Si está fuera de los límites del basePath, se ajusta al basePath
    
    if (pathForVueRef !== normalizedNewGlobalValue && globalCustomPathSignal.value !== pathForVueRef) {
      globalCustomPathSignal.value = pathForVueRef
    }

    if (currentPath.value !== pathForVueRef) {
      currentPath.value = pathForVueRef
    }
  })
})

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe()
  }
})

// Watch for basePath changes
watch(effectiveBasePath, (newBasePath) => {
  const current = currentPath.value
  
  // Si currentPath es más corto que basePath o no comienza con él,
  // (ej. si basePath cambió dinámicamente), reajusta.
  if (!current.startsWith(newBasePath) || current.length < newBasePath.length) {
    if (globalCustomPathSignal.value !== newBasePath) {
      globalCustomPathSignal.value = newBasePath
    }
    // currentPath se actualizará a través del subscriber
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
    
  if (globalCustomPathSignal.value !== finalPath) {
    globalCustomPathSignal.value = finalPath
  }
}

const navigateToPath = (newPathFromClick: string) => {
  const normalizedNewPath = normalizePath(newPathFromClick)
  const basePath = effectiveBasePath.value

  const finalPath = normalizedNewPath.startsWith(basePath) && normalizedNewPath.length >= basePath.length
    ? normalizedNewPath
    : basePath // Si el path clickeado está fuera, ir al basePath

  if (globalCustomPathSignal.value !== finalPath) {
    globalCustomPathSignal.value = finalPath
  }
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

.up-button {
  padding: 6px 12px;
  background-color: #4b5563;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.up-button:hover {
  background-color: #374151;
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

  .up-button {
    background-color: #6b7280;
  }

  .up-button:hover {
    background-color: #9ca3af;
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

  .up-button {
    background-color: #4b5563;
  }

  .up-button:hover {
    background-color: #374151;
  }
}
</style>