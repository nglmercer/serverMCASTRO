import { backupsapi } from '@fetch/fetchapi';
import { getBackups } from './backup'
interface FileValidation {
  isValid: boolean;
  errorMessage?: string;
}

interface UploadResponse {
  success: boolean;
  message?: string;
  data?: any;
}

type MessageType = 'success' | 'error' | 'warning' | 'info';

class BackupUploaderComponent {
  private selectedFile: File | null = null;
  private isLoading: boolean = false;
  
  // DOM Elements
  private dropzone!: HTMLElement;
  private fileInput!: HTMLInputElement;
  private selectFileBtn!: HTMLButtonElement;
  private fileInfo!: HTMLElement;
  private fileName!: HTMLElement;
  private fileSize!: HTMLElement;
  private removeFileBtn!: HTMLButtonElement;
  private uploadBtn!: HTMLButtonElement;
  private uploadText!: HTMLElement;
  private uploadSpinner!: HTMLElement;
  private messageContainer!: HTMLElement;
  private message!: HTMLElement;

  constructor() {
    this.initializeElements();
    this.attachEventListeners();
  }

  private initializeElements(): void {
    this.dropzone = this.getElementById('dropzone');
    this.fileInput = this.getElementById('fileInput') as HTMLInputElement;
    this.selectFileBtn = this.getElementById('selectFileBtn') as HTMLButtonElement;
    this.fileInfo = this.getElementById('fileInfo');
    this.fileName = this.getElementById('fileName');
    this.fileSize = this.getElementById('fileSize');
    this.removeFileBtn = this.getElementById('removeFileBtn') as HTMLButtonElement;
    this.uploadBtn = this.getElementById('uploadBtn') as HTMLButtonElement;
    this.uploadText = this.getElementById('uploadText');
    this.uploadSpinner = this.getElementById('uploadSpinner');
    this.messageContainer = this.getElementById('messageContainer');
    this.message = this.getElementById('message');
  }

  private getElementById(id: string): HTMLElement {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id '${id}' not found`);
    }
    return element;
  }

  private attachEventListeners(): void {
    // Drag & Drop events
    this.dropzone.addEventListener('dragover', this.handleDragOver.bind(this));
    this.dropzone.addEventListener('dragleave', this.handleDragLeave.bind(this));
    this.dropzone.addEventListener('drop', this.handleDrop.bind(this));
    
    // Click events
    this.dropzone.addEventListener('click', () => this.fileInput.click());
    this.selectFileBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      this.fileInput.click();
    });
    
    // File input change
    this.fileInput.addEventListener('change', this.handleFileSelect.bind(this));
    
    // Remove file
    this.removeFileBtn.addEventListener('click', this.removeFile.bind(this));
    
    // Upload button
    this.uploadBtn.addEventListener('click', this.handleUpload.bind(this));
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    this.dropzone.classList.add('drag-over');
  }

  private handleDragLeave(e: DragEvent): void {
    e.preventDefault();
    if (!this.dropzone.contains(e.relatedTarget as Node)) {
      this.dropzone.classList.remove('drag-over');
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.dropzone.classList.remove('drag-over');
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private handleFileSelect(e: Event): void {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      this.processFile(file);
    }
  }

  private processFile(file: File): void {
    const validation = this.validateFile(file);
    
    if (!validation.isValid) {
      this.showMessage(validation.errorMessage || 'Archivo no válido', 'error');
      return;
    }

    this.selectedFile = file;
    this.displayFileInfo();
    this.hideMessage();
  }

  private validateFile(file: File): FileValidation {
    const validExtensions = ['.zip', '.tar.gz'];
    const maxSize = 100 * 1024 * 1024; // 100MB
    
    const isValidExtension = validExtensions.some(ext => file.name.endsWith(ext));
    
    if (!isValidExtension) {
      return {
        isValid: false,
        errorMessage: 'Por favor, selecciona un archivo .zip o .tar.gz'
      };
    }
    
    if (file.size > maxSize) {
      return {
        isValid: false,
        errorMessage: 'El archivo es demasiado grande. Máximo 100MB.'
      };
    }
    
    return { isValid: true };
  }

  private displayFileInfo(): void {
    if (!this.selectedFile) return;
    
    this.fileName.textContent = this.selectedFile.name;
    this.fileSize.textContent = this.formatFileSize(this.selectedFile.size);
    this.fileInfo.style.display = 'block';
    this.dropzone.style.display = 'none';
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private removeFile(): void {
    this.selectedFile = null;
    this.fileInput.value = '';
    this.fileInfo.style.display = 'none';
    this.dropzone.style.display = 'block';
    this.hideMessage();
  }

  private async handleUpload(): Promise<void> {
    if (!this.selectedFile || this.isLoading) return;

    this.setLoading(true);
    this.hideMessage();

    try {
      const response: UploadResponse = await backupsapi.uploadBackup(this.selectedFile);
      
      if (response.success || response.message) {
        this.showMessage(response.message || 'Backup importado correctamente', 'success');
        this.removeFile();
        
        // Emit custom event to notify parent components
        this.dispatchUploadEvent('backup-uploaded', { file: this.selectedFile, response });
        getBackups();
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocurrió un error al subir el archivo';
      this.showMessage(errorMessage, 'error');
    } finally {
      this.setLoading(false);
    }
  }

  private dispatchUploadEvent(eventName: string, detail: any): void {
    const event = new CustomEvent(eventName, { 
      detail,
      bubbles: true,
      cancelable: true 
    });
    this.dropzone.dispatchEvent(event);
  }

  private setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.uploadBtn.disabled = loading;
    
    if (loading) {
      this.uploadText.textContent = 'Subiendo...';
      this.uploadSpinner.style.display = 'block';
    } else {
      this.uploadText.textContent = 'Importar Backup';
      this.uploadSpinner.style.display = 'none';
    }
  }

  private showMessage(text: string, type: MessageType): void {
    this.message.textContent = text;
    this.message.className = `message ${type}`;
    this.messageContainer.style.display = 'block';
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
      setTimeout(() => this.hideMessage(), 5000);
    }
  }

  private hideMessage(): void {
    this.messageContainer.style.display = 'none';
  }

  // Public methods for external control
  public reset(): void {
    this.removeFile();
  }

  public getSelectedFile(): File | null {
    return this.selectedFile;
  }

  public isUploading(): boolean {
    return this.isLoading;
  }
}

// Initialize component when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BackupUploaderComponent();
});

export default BackupUploaderComponent;