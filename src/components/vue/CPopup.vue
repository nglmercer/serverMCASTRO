<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue';
import { emitter } from '@utils/Emitter.ts';

// Definimos la interfaz para las opciones del popup
export interface PopupOption {
  html: string;
  callback: (event: Event) => void;
}

// Props para mayor flexibilidad
const props = defineProps<{
  id?: string;
  customClass?: string;
  trapFocus?: boolean; // Nueva prop para atrapar foco
}>();

// Estado reactivo del componente
const isVisible = ref(false);
const posX = ref(0);
const posY = ref(0);
const options = ref<PopupOption[]>([]);
const containerRef = ref<HTMLDivElement | null>(null);
const lastFocusedElement = ref<HTMLElement | null>(null);

// Estilos computados para la posición
const containerStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
}));

const containerClasses = computed(() => [
  'fixed z-50 flex flex-col bg-white border border-gray-200 rounded-md shadow-lg min-w-[180px] py-1',
  props.customClass || '',
]);

// --- Funciones para manejar el estado del popup ---

// Mueve el popup a coordenadas específicas, ajustando a los bordes de la pantalla
const moveTo = async (x: number, y: number) => {
  await nextTick();
  if (!containerRef.value) return;

  const rect = containerRef.value.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Ajustar si se sale por la derecha o izquierda
  if (x + rect.width > viewportWidth - 10) {
    x = viewportWidth - rect.width - 10;
  } else if (x < 10) {
    x = 10;
  }
  // Ajustar si se sale por abajo o arriba (prefiriendo arriba si es posible)
  if (y + rect.height > viewportHeight - 10) {
    y = y - rect.height - rect.top + 10; // Intentar posicionar arriba del trigger
    if (y < 10) y = viewportHeight - rect.height - 10;
  }

  posX.value = x;
  posY.value = Math.max(10, y); // Margen mínimo de 10px
};

// Muestra el popup
const show = (coords?: { x: number; y: number }) => {
  isVisible.value = true;
  if (coords) {
    moveTo(coords.x, coords.y);
  }
  nextTick(() => {
    if (props.trapFocus && containerRef.value) {
      containerRef.value.focus(); // Atrapar foco inicialmente
    }
  });
  document.addEventListener('click', handleClickOutside, { capture: true }); // Usar capture para mejor manejo
  document.addEventListener('keydown', handleKeyDown); // Soporte para Escape
};

// Oculta el popup
const hide = () => {
  isVisible.value = false;
  lastFocusedElement.value?.focus(); // Restaurar foco al trigger
  lastFocusedElement.value = null;
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
};

// Muestra el popup junto a un elemento específico
const showAtElement = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  lastFocusedElement.value = element;
  show({
    x: rect.left,
    y: rect.bottom,
  });
};

// Setea las opciones, envolviendo el callback para que siempre se oculte el popup
const setOptions = (newOptions: PopupOption[]) => {
  options.value = newOptions.map(opt => ({
    html: opt.html,
    callback: (event: Event) => {
      opt.callback(event);
      hide();
    },
  }));
};

// Limpia las opciones
const clearOptions = () => {
  options.value = [];
};

// Maneja el clic fuera del popup para cerrarlo
const handleClickOutside = (event: MouseEvent) => {
  if (!containerRef.value) return;

  const path = event.composedPath();
  if (!path.includes(containerRef.value) && (!lastFocusedElement.value || !path.includes(lastFocusedElement.value))) {
    hide();
  }
};

// Manejo de teclas (e.g., Escape para cerrar)
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    hide();
  }
};

// Atrapar foco dentro del popup si trapFocus es true
watch(isVisible, (visible) => {
  if (visible && props.trapFocus) {
    const handleFocusTrap = (e: FocusEvent) => {
      if (containerRef.value && !containerRef.value.contains(e.relatedTarget as Node)) {
        containerRef.value.focus();
      }
    };
    document.addEventListener('focusout', handleFocusTrap);
    onUnmounted(() => document.removeEventListener('focusout', handleFocusTrap));
  }
});

// --- Ciclo de vida: Suscribirse y desuscribirse a los eventos ---
let cleanupFunctions: (() => void)[] = [];

onMounted(() => {
  cleanupFunctions.push(emitter.on('popup:show', (coords) => show(coords)));
  cleanupFunctions.push(emitter.on('popup:hide', () => hide()));
  cleanupFunctions.push(emitter.on('popup:showAtElement', (el) => showAtElement(el)));
  cleanupFunctions.push(emitter.on('popup:setOptions', (opts) => setOptions(opts)));
  cleanupFunctions.push(emitter.on('popup:clearOptions', () => clearOptions()));
  // Listener para resize/orientation change
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  cleanupFunctions.forEach(cleanup => cleanup());
  document.removeEventListener('click', handleClickOutside);
  document.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('resize', handleResize);
});

// Reposicionar en resize
const handleResize = () => {
  if (isVisible.value && lastFocusedElement.value) {
    showAtElement(lastFocusedElement.value);
  }
};
</script>

<template>
  <div
    v-if="isVisible"
    ref="containerRef"
    :style="containerStyle"
    :class="containerClasses"
    tabindex="0" 
    role="menu" 
    aria-orientation="vertical"
  >
    <div
      v-for="(option, index) in options"
      :key="index"
      class="px-4 py-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-100 hover:text-gray-900"
      role="menuitem"
      tabindex="-1"
      @click="option.callback"
      @keydown.enter="option.callback"
      v-html="option.html"
    >
    </div>
  </div>
</template>