<template>
  <div class="file-uploader">
    <label 
      ref="dropAreaRef"
      :class="[
        'file-attachment-label',
        { 'dragging': isDragging },
        { 'error': errorType }
      ]"
      :data-error-type="errorType"
    >
      <input 
        ref="fileInputRef"
        type="file" 
        class="sr-only" 
        @change="handleFileSelect"
        :multiple="multiple"
        :accept="acceptedFileTypes"
      />
      
      <div v-if="!isUploading && !errorMessage" class="default">
        <span class="bg-overlay"></span>
        <span class="upload-message">
          <svg height="32" viewBox="0 0 24 24" width="32" class="upload-icon">
            <path d="M4.97 13.22a.75.75 0 0 1 1.06 0L11 18.19V3.75a.75.75 0 0 1 1.5 0v14.44l4.97-4.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734l-6.25 6.25a.75.75 0 0 1-1.06 0l-6.25-6.25a.75.75 0 0 1 0-1.06Z"></path>
          </svg>
          Attach {{ multiple ? 'files' : 'a file' }} by dropping {{ multiple ? 'them' : 'it' }} here or selecting {{ multiple ? 'them' : 'it' }}.
        </span>
      </div>
      
      <div v-if="isUploading" class="loading">
        <svg width="16" height="16" viewBox="0 0 16 16" class="loading-icon">
          <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" vector-effect="non-scaling-stroke" fill="none"></circle>
          <path d="M15 8a7.002 7.002 0 00-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>
        </svg>
        <span class="loading-text">Uploading your {{ multiple ? 'files' : 'file' }} now…</span>
      </div>
      
      <div v-if="errorMessage" :class="['error', errorType]">
        {{ errorMessage }}
        <span class="error-info">
          <span 
            class="retry-text" 
            @click.stop="retryUpload"
          >
            Try {{ errorType === 'duplicate-filename' ? 'a different file' : 'another file' }}.
          </span>
        </span>
      </div>
    </label>
    
    <div v-if="files.length > 0" class="file-list">
      <div class="file-list-header">
        <h3>Selected Files:</h3>
        <button 
          class="upload-button" 
          @click="uploadFiles"
          :disabled="isUploading"
        >
          Upload All Files
        </button>
      </div>
      <ul>
        <li v-for="(fileData, index) in files" :key="index">
          <div class="file-info">
            <input
              v-if="fileData.isEditing"
              type="text"
              v-model="fileData.editedName"
              @blur="saveFileName(index, fileData.editedName)"
              @keypress.enter="saveFileName(index, fileData.editedName)"
            />
            <span 
              v-else
              class="file-name" 
              @click="startEditing(index)"
              title="Click to edit filename"
            >
              {{ fileData.editedName }}
            </span>
            <span class="file-size">({{ formatFileSize(fileData.file.size) }})</span>
          </div>
          <button 
            class="remove-file" 
            @click.prevent="removeFile(index)"
            title="Remove file"
          >
            ✕
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { emitter } from '../../utils/Emitter'
import { fetchFiles } from "../../utils/fetch/fetchapi"
import { DataPath,normalizePath } from '@utils/pathUtils'
interface FileUploaderProps {
  apiEndpoint: string
  maxFileSize?: number // in bytes, default is 2GB
  acceptedFileTypes?: string
  multiple?: boolean
}

interface FileWithMeta {
  file: File
  editedName: string
  isEditing: boolean
}

const props = withDefaults(defineProps<FileUploaderProps>(), {
  maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB default
  multiple: true
})

const isDragging = ref(false)
const isUploading = ref(false)
const errorMessage = ref('')
const errorType = ref('')
const files = ref<FileWithMeta[]>([])
const currentPath = ref('')

const fileInputRef = ref<HTMLInputElement>()
const dropAreaRef = ref<HTMLLabelElement>()

const multiple = computed(() => props.multiple !== undefined ? props.multiple : true)

const preventDefaults = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
}

const highlight = () => isDragging.value = true
const unhighlight = () => isDragging.value = false

const handleDrop = (e: DragEvent) => {
  preventDefaults(e)
  unhighlight()
  
  if (!e.dataTransfer) return
  
  const droppedFiles = e.dataTransfer.files
  handleFiles(droppedFiles)
}

const handleFileSelect = (e: Event) => {
  const input = e.target as HTMLInputElement
  if (!input.files) return
  
  handleFiles(input.files)
}

const handleFiles = (fileList: FileList) => {
  resetErrors()
  
  const filesArray = Array.from(fileList)
  
  for (const file of filesArray) {
    if (file.size === 0) {
      errorType.value = 'empty'
      errorMessage.value = 'This file is empty. Try again with a file that\'s not empty.'
      return
    }
    
    if (file.size > props.maxFileSize) {
      errorType.value = 'too-big'
      errorMessage.value = `Yowza, that's a big file. Try again with a file smaller than ${formatFileSize(props.maxFileSize)}.`
      return
    }
    
    if (props.acceptedFileTypes && !isFileTypeAccepted(file, props.acceptedFileTypes)) {
      errorType.value = 'bad-file'
      errorMessage.value = 'We don\'t support that file type. Try zipping it.'
      return
    }
  }
  
  const filesWithMeta = filesArray.map(file => ({
    file,
    editedName: file.name,
    isEditing: false
  }))
  
  files.value = [...files.value, ...filesWithMeta]
}

const removeFile = (index: number) => {
  files.value = files.value.filter((_, i) => i !== index)
}

const startEditing = (index: number) => {
  files.value = files.value.map((file, i) => 
    i === index ? { ...file, isEditing: true } : file
  )
}

const saveFileName = (index: number, newName: string) => {
  files.value = files.value.map((file, i) => 
    i === index ? { ...file, editedName: newName, isEditing: false } : file
  )
}

const isFileTypeAccepted = (file: File, acceptedTypes: string): boolean => {
  const types = acceptedTypes.split(',').map(type => type.trim())
  return types.some(type => {
    if (type.startsWith('.')) {
      return file.name.toLowerCase().endsWith(type.toLowerCase())
    } else if (type.includes('*')) {
      const [mainType, subType] = type.split('/')
      const [fileMainType, fileSubType] = file.type.split('/')
      return mainType === '*' || (mainType === fileMainType && (subType === '*' || subType === fileSubType))
    } else {
      return file.type === type
    }
  })
}

const resetErrors = () => {
  errorType.value = ''
  errorMessage.value = ''
}

const retryUpload = () => {
  resetErrors()
  if (fileInputRef.value) fileInputRef.value.click()
}

const uploadFiles = async () => {
  if (files.value.length === 0) return

  isUploading.value = true
  resetErrors()

  try {
    const formData = new FormData()
    
    // Add files with the key 'files' as expected by backend
    files.value.forEach((fileData) => {
      // Create a new File object with the edited name if it was changed
      const fileToUpload = fileData.editedName !== fileData.file.name 
        ? new File([fileData.file], fileData.editedName, { type: fileData.file.type })
        : fileData.file
      formData.append('files', fileToUpload)
    })
    currentPath.value =  normalizePath((window as any).selectedServer + DataPath.getPath());
    // Add directory parameter
    const normalizedSubDirectory = currentPath.value.startsWith("/") ? currentPath.value.substring(1) : currentPath.value;
    formData.append('directory', normalizedSubDirectory || '')
    
    console.log("formData prepared for backend", formData)
    console.log("currentPath", currentPath.value)
    
    const response = await fetch(props.apiEndpoint, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      let errorBody = { message: `HTTP error! Status: ${response.status}` }
      try {
        errorBody = await response.json()
      } catch (e) {
        console.warn("Could not parse error response as JSON.")
      }
      console.error('Upload failed. Server response:', errorBody)
      throw new Error(errorBody.message || `HTTP error! Status: ${response.status}`)
    }

    files.value = []
    if (fileInputRef.value) fileInputRef.value.value = ''
    
    // Emit custom event to update file explorer
    const refreshPath = normalizedSubDirectory || (window as any).selectedServer || ''
    emitter.emit('file-explorer:refresh-data', {
      path: refreshPath
    })
    
    // Also dispatch window event for compatibility
    window.dispatchEvent(new CustomEvent('update-files', {
      detail: { path: refreshPath }
    }))
  } catch (error) {
    console.error('Upload failed (catch block):', error)
    errorType.value = 'failed-request'
    errorMessage.value = String(error) || 'Something went really wrong, and we can\'t process that file. Try another file.'
  } finally {
    isUploading.value = false
  }
}

const formatFileSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

// Get current path from PathNavigator using emitters
const getCurrentPath = () => {
  emitter.emit('path-navigator:get-current-path',{})
}

let unsubscribeCurrentPath: (() => void) | null = null
let unsubscribePathChanged: (() => void) | null = null

onMounted(() => {
  if (!dropAreaRef.value) return
  
  const events = ['dragenter', 'dragover', 'dragleave', 'drop']
  
  events.forEach(event => {
    dropAreaRef.value?.addEventListener(event, preventDefaults, false)
  })
  
  dropAreaRef.value.addEventListener('dragenter', highlight, false)
  dropAreaRef.value.addEventListener('dragover', highlight, false)
  dropAreaRef.value.addEventListener('dragleave', unhighlight, false)
  dropAreaRef.value.addEventListener('drop', handleDrop as EventListener, false)
  
  // Listen for current path from PathNavigator
  unsubscribeCurrentPath = emitter.on('path-navigator:current-path', (data: { path: string }) => {
    currentPath.value = data.path
  })
  
  // Listen for path changes
  unsubscribePathChanged = emitter.on('path-navigator:path-changed', (data: { path: string }) => {
    currentPath.value = data.path
  })
  
  // Request current path on mount
  getCurrentPath()
})

onUnmounted(() => {
  if (!dropAreaRef.value) return
  
  const events = ['dragenter', 'dragover', 'dragleave', 'drop']
  
  events.forEach(event => {
    dropAreaRef.value?.removeEventListener(event, preventDefaults)
  })
  
  dropAreaRef.value.removeEventListener('dragenter', highlight)
  dropAreaRef.value.removeEventListener('dragover', highlight)
  dropAreaRef.value.removeEventListener('dragleave', unhighlight)
  dropAreaRef.value.removeEventListener('drop', handleDrop as EventListener)
  
  if (unsubscribeCurrentPath) {
    unsubscribeCurrentPath()
  }
  
  if (unsubscribePathChanged) {
    unsubscribePathChanged()
  }
})
</script>

<style scoped>
  
</style>