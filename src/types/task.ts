export interface Task {
    id: string; 
    filename: string;
    progress?: number;
    status?: 'completed' | 'downloading' | 'processing' | 'error' | string; 
    type?: string; 
    icon?: string; 
  }
  
  // Tipado para el objeto de tareas que se pasará a updateTasks
export  type TasksObject = Record<string, Omit<Task, 'id'>>;
