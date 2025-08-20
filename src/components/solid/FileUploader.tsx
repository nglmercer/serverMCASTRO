import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import type { Component } from 'solid-js';
import { fetchFiles } from "src/utils/fetch/fetchapi";
import 'src/components/solid/FileUploader.css';
interface FileUploaderProps {
  apiEndpoint: string;
  maxFileSize?: number; // in bytes, default is 2GB
  acceptedFileTypes?: string;
  multiple?: boolean;
}

interface FileWithMeta {
  file: File;
  editedName: string;
  isEditing: boolean; 
}

const FileUploader: Component<FileUploaderProps> = (props) => {
  const [isDragging, setIsDragging] = createSignal(false);
  const [isUploading, setIsUploading] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal('');
  const [errorType, setErrorType] = createSignal('');
  const [files, setFiles] = createSignal<FileWithMeta[]>([]);
  
  const maxFileSize = props.maxFileSize || 2 * 1024 * 1024 * 1024; // 2GB default
  const multiple = props.multiple !== undefined ? props.multiple : true;

  let fileInputRef: HTMLInputElement | undefined;
  let dropAreaRef: HTMLLabelElement | undefined;

  const preventDefaults = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const highlight = () => setIsDragging(true);
  const unhighlight = () => setIsDragging(false);

  const handleDrop = (e: DragEvent) => {
    preventDefaults(e);
    unhighlight();
    
    if (!e.dataTransfer) return;
    
    const droppedFiles = e.dataTransfer.files;
    handleFiles(droppedFiles);
  };

  const handleFileSelect = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    
    handleFiles(input.files);
  };

  const handleFiles = (fileList: FileList) => {
    resetErrors();
    
    const filesArray = Array.from(fileList);
    
    for (const file of filesArray) {
      if (file.size === 0) {
        setErrorType('empty');
        setErrorMessage('This file is empty. Try again with a file that\'s not empty.');
        return;
      }
      
      if (file.size > maxFileSize) {
        setErrorType('too-big');
        setErrorMessage(`Yowza, that's a big file. Try again with a file smaller than ${formatFileSize(maxFileSize)}.`);
        return;
      }
      
      if (props.acceptedFileTypes && !isFileTypeAccepted(file, props.acceptedFileTypes)) {
        setErrorType('bad-file');
        setErrorMessage('We don\'t support that file type. Try zipping it.');
        return;
      }
    }
    
    const filesWithMeta = filesArray.map(file => ({
      file,
      editedName: file.name,
      isEditing: false
    }));
    
    setFiles(prev => [...prev, ...filesWithMeta]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, isEditing: true } : file
    ));
  };

  const saveFileName = (index: number, newName: string) => {
    setFiles(prev => prev.map((file, i) => 
      i === index ? { ...file, editedName: newName, isEditing: false } : file
    ));
  };

  const isFileTypeAccepted = (file: File, acceptedTypes: string): boolean => {
    const types = acceptedTypes.split(',').map(type => type.trim());
    return types.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase());
      } else if (type.includes('*')) {
        const [mainType, subType] = type.split('/');
        const [fileMainType, fileSubType] = file.type.split('/');
        return mainType === '*' || (mainType === fileMainType && (subType === '*' || subType === fileSubType));
      } else {
        return file.type === type;
      }
    });
  };

  const resetErrors = () => {
    setErrorType('');
    setErrorMessage('');
  };
      //formData.append("selectedServer", window.selectedServer);
const uploadFiles = async () => {
  if (files().length === 0) return;

  setIsUploading(true);
  resetErrors();

  try {
    const formData = new FormData();
    files().forEach((fileData, index) => {
      // SIMPLIFIED: Append original file, pass editedName as the third argument
      formData.append(`${(fileData.editedName || fileData.file.name)}`, fileData.file, fileData.editedName);
    });
    console.log("formData after simplified append", formData); // Check this log
    const windowPath = window.$signals.get("path")?.value;
    const normalizedSubDirectory = windowPath.startsWith("/") ? windowPath.substring(1) : windowPath;
    console.log("windowPath", windowPath);
    const urlFetch = props.apiEndpoint + (props.apiEndpoint.includes("?") ? "&" : "?") + "subDirectory=" + (normalizedSubDirectory || window.selectedServer);
    console.log("urlFetch", urlFetch);
    const response = await fetch(urlFetch, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      // Log the server's actual error message if available
      let errorBody = { message: `HTTP error! Status: ${response.status}` };
      try {
        errorBody = await response.json();
      } catch (e) {
        console.warn("Could not parse error response as JSON.");
      }
      console.error('Upload failed. Server response:', errorBody);
      throw new Error(errorBody.message || `HTTP error! Status: ${response.status}`);
    }

    setFiles([]);
    if (fileInputRef) fileInputRef.value = '';
    // Dispatch custom event to update Vue FileExplorer component
    window.dispatchEvent(new CustomEvent('update-files', {
      detail: { path: normalizedSubDirectory }
    }));
  } catch (error) {
    console.error('Upload failed (catch block):', error);
    setErrorType('failed-request');
    // Use error.message if it came from the server response
    setErrorMessage(String(error) || 'Something went really wrong, and we can\'t process that file. Try another file.');
  } finally {
    setIsUploading(false);
  }
};

  const formatFileSize = (size: number): string => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  onMount(() => {
    if (!dropAreaRef) return;
    
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(event => {
      dropAreaRef?.addEventListener(event, preventDefaults, false);
    });
    
    dropAreaRef.addEventListener('dragenter', highlight, false);
    dropAreaRef.addEventListener('dragover', highlight, false);
    dropAreaRef.addEventListener('dragleave', unhighlight, false);
    dropAreaRef.addEventListener('drop', handleDrop as EventListener, false);
  });
  
  onCleanup(() => {
    if (!dropAreaRef) return;
    
    const events = ['dragenter', 'dragover', 'dragleave', 'drop'];
    
    events.forEach(event => {
      dropAreaRef?.removeEventListener(event, preventDefaults);
    });
    
    dropAreaRef.removeEventListener('dragenter', highlight);
    dropAreaRef.removeEventListener('dragover', highlight);
    dropAreaRef.removeEventListener('dragleave', unhighlight);
    dropAreaRef.removeEventListener('drop', handleDrop as EventListener);
  });

  return (
    <div class="file-uploader">
      <label 
        ref={dropAreaRef}
        class={`file-attachment-label ${isDragging() ? 'dragging' : ''} ${errorType() ? 'error' : ''}`}
        data-error-type={errorType()}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          class="sr-only" 
          onChange={handleFileSelect}
          multiple={multiple}
          accept={props.acceptedFileTypes}
        />
        
        <Show when={!isUploading() && !errorMessage()}>
          <span class="default">
            <span class="bg-overlay"></span>
            <span class="upload-message">
              <svg height="32" viewBox="0 0 24 24" width="32" class="upload-icon">
                <path d="M4.97 13.22a.75.75 0 0 1 1.06 0L11 18.19V3.75a.75.75 0 0 1 1.5 0v14.44l4.97-4.97a.749.749 0 0 1 1.275.326.749.749 0 0 1-.215.734l-6.25 6.25a.75.75 0 0 1-1.06 0l-6.25-6.25a.75.75 0 0 1 0-1.06Z"></path>
              </svg>
              Attach {multiple ? 'files' : 'a file'} by dropping {multiple ? 'them' : 'it'} here or selecting {multiple ? 'them' : 'it'}.
            </span>
          </span>
        </Show>
        
        <Show when={isUploading()}>
          <span class="loading">
            <svg width="16" height="16" viewBox="0 0 16 16" class="loading-icon">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" vector-effect="non-scaling-stroke" fill="none"></circle>
              <path d="M15 8a7.002 7.002 0 00-7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" vector-effect="non-scaling-stroke"></path>
            </svg>
            <span class="loading-text">Uploading your {multiple ? 'files' : 'file'} now…</span>
          </span>
        </Show>
        
        <Show when={errorMessage()}>
          <span class={`error ${errorType()}`}>
            {errorMessage()}
            <span class="error-info">
              <span class="retry-text" onClick={(e) => {
                e.stopPropagation();
                resetErrors();
                if (fileInputRef) fileInputRef.click();
              }}>Try {errorType() === 'duplicate-filename' ? 'a different file' : 'another file'}.</span>
            </span>
          </span>
        </Show>
      </label>
      
      <Show when={files().length > 0}>
        <div class="file-list">
          <div class="file-list-header">
            <h3>Selected Files:</h3>
            <button 
              class="upload-button" 
              onClick={uploadFiles}
              disabled={isUploading()}
            >
              Upload All Files
            </button>
          </div>
          <ul>
            {files().map((fileData, index) => (
              <li>
                <div class="file-info">
                  <Show
                    when={!fileData.isEditing}
                    fallback={
                      <input
                        type="text"
                        value={fileData.editedName}
                        onBlur={(e) => saveFileName(index, e.currentTarget.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            saveFileName(index, e.currentTarget.value);
                          }
                        }}
                      />
                    }
                  >
                    <span 
                      class="file-name" 
                      onClick={() => startEditing(index)}
                      title="Click to edit filename"
                    >
                      {fileData.editedName}
                    </span>
                  </Show>
                  <span class="file-size">({formatFileSize(fileData.file.size)})</span>
                </div>
                <button 
                  class="remove-file" 
                  onClick={(e) => {
                    e.preventDefault();
                    removeFile(index);
                  }}
                  title="Remove file"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Show>
    </div>
  );
};

export default FileUploader;