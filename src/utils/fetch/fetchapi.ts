import BaseApi from './commons/BaseApi';
import type { FetchOptions } from './commons/httpservice';
import apiConfig from './config/apiConfig';

// Importar todas las clases API migradas
import FetchApi from './apis/FetchApi';
import ServerApi from './apis/ServerApi';
import ServermanagerApi from './apis/ServermanagerApi';
import FileManagerApi from './apis/FileManagerApi';
import SystemMonitor from './apis/SystemMonitor';
import PluginsApi from './apis/PluginsApi';
import BackupsApi from './apis/BackupsApi';
import NetworkApi from './apis/NetworkApi';

// Importar tipos
import type { FileExplorerElement } from './types/server.types';

// Crear instancias de todas las APIs
const fetchapi = new FetchApi(apiConfig);
const serverapi = new ServerApi(apiConfig);
const servermanagerapi = new ServermanagerApi(apiConfig);
const filemanagerapi = new FileManagerApi(apiConfig);
const systemapi = new SystemMonitor(apiConfig);
const pluginsapi = new PluginsApi(apiConfig);
const backupsapi = new BackupsApi(apiConfig);
const networkapi = new NetworkApi(apiConfig);

// Función utilitaria para obtener archivos
async function fetchFiles(path: string, element?: FileExplorerElement): Promise<void> {
  const pathENCODED = encodeURIComponent(path);
  const result = await filemanagerapi.getFolderInfo(pathENCODED);
  console.log("result", result);
  
  if (result && result.data) {
    if (!element) return;
    element.data = result.data?.files;
    element.currentPath = path;
  }
}

// Función de prueba
async function test(): Promise<void> {
  if (typeof window !== 'undefined' && window.selectedServer) {
    const pathENCODED = encodeURIComponent(window.selectedServer);
    const folderInfo = await filemanagerapi.getFolderInfo(pathENCODED);
    console.log("folderInfo", folderInfo);
  }
}

// Exportar todas las instancias y utilidades
export {
  fetchapi,
  serverapi,
  servermanagerapi,
  filemanagerapi,
  systemapi,
  BaseApi,
  apiConfig,
  fetchFiles,
  pluginsapi,
  backupsapi,
  networkapi,
  test
};

// Exportación por defecto
export default fetchapi;