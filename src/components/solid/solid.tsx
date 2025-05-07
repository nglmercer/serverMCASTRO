// src/components/solid/solid.tsx
import { createSignal, createEffect, onCleanup, onMount, Show, For } from 'solid-js';
import { createStore } from 'solid-js/store';
import './modal.css';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

declare global {
  interface Window {
    solidComponents?: Record<string, any>;
  }
}

export interface PopupOption {
  html: string;
  callback: (event: Event) => void;
}

interface CustomPopupProps {
  id?: string;
  class?: string;
}

export default function CPopup(props: CustomPopupProps) {
  const [store, setStore] = createStore({
    options: [] as PopupOption[],
    isVisible: false,
    posX: 0,
    posY: 0
  });
  
  const [lastFocusedElement, setLastFocusedElement] = createSignal<HTMLElement | null>(null);
  let containerRef: HTMLDivElement | undefined;
  
  // Get options
  const getOptions = () => store.options;
  
  // Set options
  const setOptions = (options: { html: string; callback: (event: Event) => void }[]) => {
    const wrappedOptions = options.map(option => ({
      html: option.html,
      callback: (event: Event) => {
        option.callback(event);
        hide();
      }
    }));
    
    setStore('options', wrappedOptions);
  };
  
  // Add a single option
  const addOption = (html: string, callback: (event: Event) => void): number => {
    const wrappedCallback = (event: Event) => {
      callback(event);
      hide();
    };
    
    const newOptions = [...store.options, { html, callback: wrappedCallback }];
    setStore('options', newOptions);
    
    return newOptions.length - 1;
  };
  
  // Clear all options
  const clearOptions = () => {
    setStore('options', []);
  };
  
  // Remove a specific option by index
  const removeOption = (index: number): boolean => {
    if (index >= 0 && index < store.options.length) {
      const newOptions = [...store.options];
      newOptions.splice(index, 1);
      setStore('options', newOptions);
      return true;
    }
    return false;
  };
  
  // Show the popup at specific coordinates
  const show = ({ x, y }: { x?: number, y?: number } = {}) => {
    setStore('isVisible', true);
    
    if (x !== undefined && y !== undefined) {
      moveTo(x, y);
    }
    
    // Only add event listener in browser environment
    if (isBrowser) {
      // Add click outside listener after render
      setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
      }, 0);
    }
  };
  
  // Hide the popup
  const hide = () => {
    setStore('isVisible', false);
    
    // Only remove event listener in browser environment
    if (isBrowser) {
      document.removeEventListener('click', handleClickOutside);
    }
  };
  
  // Move popup to specific coordinates
  const moveTo = (x: number, y: number) => {
    if (!containerRef || !isBrowser) return;
    
    const rect = containerRef.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    if (x + rect.width > viewportWidth) {
      x = viewportWidth - rect.width - 10;
    }
    
    if (y + rect.height > viewportHeight) {
      y = viewportHeight - rect.height - 10;
    }
    
    setStore({
      posX: Math.max(0, x),
      posY: Math.max(0, y)
    });
  };
  
  // Show popup at a specific element
  const showAtElement = (element: HTMLElement) => {
    if (!isBrowser) return;
    
    const rect = element.getBoundingClientRect();
    const positions = {
      x: rect.left,
      y: rect.bottom
    };
    show(positions);
    setLastFocusedElement(element);
  };
  
  // Handle click outside the popup
  const handleClickOutside = (event: MouseEvent) => {
    if (!isBrowser) return;
    
    const path = event.composedPath();
    
    if (
      containerRef && 
      !path.includes(containerRef) && 
      (!lastFocusedElement() || !path.includes(lastFocusedElement()!))
    ) {
      hide();
    }
  };
  
  // Cleanup event listeners when component unmounts
  onCleanup(() => {
    // Only remove event listener in browser environment
    if (isBrowser) {
      document.removeEventListener('click', handleClickOutside);
    }
  });
  
  // Update container styles when visibility changes
  createEffect(() => {
    if (!containerRef) return;
    
    containerRef.style.display = store.isVisible ? 'flex' : 'none';
    containerRef.style.left = `${store.posX}px`;
    containerRef.style.top = `${store.posY}px`;
  });
  
  // Expose methods to parent
  onMount(() => {
    // Only execute in browser environment
    if (!isBrowser || !props.id) return;
    
    const componentMethods = {
      getOptions,
      setOptions,
      addOption,
      clearOptions,
      removeOption,
      show,
      hide,
      moveTo,
      showAtElement
    };
    
    // Add methods to the component instance
    const element = document.getElementById(props.id);
    if (element) {
      Object.assign(element, componentMethods);
    }
    
    // Add methods to window for easier access
    if (!window.solidComponents) {
      window.solidComponents = {};
    }
    window.solidComponents[props.id] = componentMethods;
  });

  return (
    <div 
      id={props.id}
      class={`custom-popup ${props.class || ''}`}
    >
      <div 
        ref={containerRef} 
        class="container"
        style={{
          'display': store.isVisible ? 'flex' : 'none',
          'left': `${store.posX}px`,
          'top': `${store.posY}px`
        }}
      >
        <For each={store.options}>
          {(option) => (
            <div 
              class="popup-option" 
              onClick={(e) => option.callback(e)}
              innerHTML={option.html}
            />
          )}
        </For>
      </div>
    </div>
  );
}