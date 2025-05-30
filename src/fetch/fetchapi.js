const windowurl = typeof window !== "undefined" ? window.location.origin : "";
const baseurlApi = windowurl + "/api";
const baseurlTestApi = "http://localhost:3000/api"; // API de desarrollo
const mockApi = "http://localhost:3000/api"; // Otra opción de mock

const actualBaseApi =
  import.meta.env.MODE === "development" ? baseurlTestApi : baseurlApi;

const http = {
    get: (url, options = {}) => {
        return fetch(url, {
            method: 'GET',
            ...options
        }).then(res => res.json());
    },
    post: (url, body = {}, options = {}) => {
        // Verificamos si body es una instancia de FormData
        if (body instanceof FormData) {
            // Para FormData, no debemos JSON.stringify() el cuerpo
            // Y no establecemos Content-Type (el navegador lo hará)
            return fetch(url, {
                method: 'POST',
                headers: {
                    // Omitimos Content-Type para FormData
                    ...Object.fromEntries(
                        Object.entries(options.headers || {})
                            .filter(([key]) => key.toLowerCase() !== 'content-type')
                    )
                },
                body: body, // Enviamos el FormData directamente
                ...Object.fromEntries(
                    Object.entries(options)
                        .filter(([key]) => key !== 'headers')
                )
            }).then(res => res.json());
        } else {
            // Para JSON normal
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(options.headers || {})
                },
                body: JSON.stringify(body),
                ...Object.fromEntries(
                    Object.entries(options)
                        .filter(([key]) => key !== 'headers')
                )
            }).then(res => res.json());
        }
    },
    put: (url, body = {}, options = {}) => {
        return fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(body),
            ...options
        }).then(res => res.json());
    },
    delete: (url, options = {}) => {
        return fetch(url, {
            method: 'DELETE',
            ...options
        }).then(res => res.json());
    }
};
// catalogo post, envia un objeto para agregar un catalogo -- agregar
// catalogo put, actualiza un catalogo --- actualizar
// catalogo delete, elimina un catalogo --- eliminar

// Polyfill for localStorage and window in SSR environments
const storage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
};

var localStorage = typeof window !== 'undefined' 
    ? (window.localStorage || storage)
    : storage;

function getParams(paramNames = []) {
    const urlParams = new URLSearchParams(window.location.search);
    let paramsObject = Object.fromEntries(urlParams.entries());

    if (Object.keys(paramsObject).length === 0) {
    const path = window.location.pathname;
    const parts = path.split('/').filter(Boolean); // ["contenido", "catalogos", "2"]

    if (parts.length >= paramNames.length) {
        paramsObject = {};
        for (let i = 0; i < paramNames.length; i++) {
        paramsObject[paramNames[i]] = parts[i];
        }
    }
    }

    return paramsObject;
}
      
function safeParse(value) {
    try {
        // Si ya es un array u objeto, lo devolvemos tal cual
        if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
            return value;
        }

        // Si es un string que empieza con { o [, intentamos parsearlo
        if (typeof value === 'string' && (value.trim().startsWith('{') || value.trim().startsWith('['))) {
            try {
                return JSON.parse(value); // Intento normal
            } catch (error) {
                // Si falla, intentamos corregirlo
                const fixedJson = value
                    .replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":') // Poner comillas en claves
                    .replace(/:\s*'([^']+)'/g, ': "$1"'); // Reemplazar comillas simples por dobles en valores

                return JSON.parse(fixedJson); // Reintento con JSON corregido
            }
        }

        // Si es otro tipo de dato (número, booleano, etc.), lo devolvemos sin cambios
        return value;
    } catch (error) {
        console.error("Error al parsear JSON:", error, "Valor recibido:", value);
        return value; // Retorna el valor original si no se puede parsear
    }
}

class BaseApi {
    constructor(baseApi) {
        this.host = baseApi;
        this.http = http;
        const info = safeParse(localStorage.getItem("info")) || {};
        this.token = info.token || localStorage.getItem("token");
        this.user = safeParse(info.user || safeParse(localStorage.getItem("user"))) || {};
    }

    _authHeaders(contentType = 'application/json') {
        const headers = {
            'Authorization': `${this.token}`
        };
        if (contentType) {
            headers['Content-Type'] = contentType;
        }
        return headers;
    }

    async request(promise) {
        try {
            return await promise;
        } catch (error) {
            console.error('Error en la llamada a la API:', error);
            throw error;
        }
    }
}

class FetchApi extends BaseApi  {

    agregar(formulario) {
        return this.request(http.post(`${this.host}/catalogo`, formulario, {
            headers: this._authHeaders()
        }));
    }

    actualizar(formulario) {
        return this.request(http.put(`${this.host}/catalogo/`, formulario, {
            headers: this._authHeaders()
        }));
    }

    eliminar(modalUpdate) {
        return this.request(http.delete(`${this.host}/catalogo/${modalUpdate.idCatalogo}`, {
            headers: this._authHeaders()
        }));
    }
}
class ServerApi extends BaseApi {
    // GET /java/all
    getVSJava() {
    return this.request(http.get(`${this.host}/java/all`, {
        headers: this._authHeaders()
    }));
    }
      // GET /cores/all
    getALLCores(){
        return this.request(http.get(`${this.host}/cores/all`, {
            headers: this._authHeaders()
        }));
    }
    //GET /api/cores
    getCores(){
        return this.request(http.get(`${this.host}/cores`, {
            headers: this._authHeaders()
        }));
    }
    //GET /core/:core
    getcore(name){
        return this.request(http.get(`${this.host}/cores/${name}`, {
            headers: this._authHeaders()
        }));
    }
    //POST /newserver
    postNewserver(formData) {
        // Cuando se envía FormData, NO debemos establecer Content-Type
        // El navegador lo configurará automáticamente con el boundary correcto
        const headers = {
        'Authorization': `${this.token}`
        // No incluir 'Content-Type' aquí
        };
        
        return this.request(http.post(`${this.host}/newserver`, formData, {
        headers: headers
        }));
    }
    // get servers
    async getServers() {
        return this.request(http.get(`${this.host}/servers`, {
            headers: this._authHeaders()
        }));
    }
    // GET "/servermanager/" + server + "/info"
    async getServerInfo(server) {
        return this.request(http.get(`${this.host}/servermanager/${server}/info`, {
            headers: this._authHeaders()
        }));
    }
    // GET "/servermanager/" + server + "/logs"
    async getServerLog(server) {
        return this.request(http.get(`${this.host}/servermanager/${server}/log`, {
            headers: this._authHeaders()
        }));
    }
    // GET "/tasks"
    async getTasks() {
        return this.request(http.get(`${this.host}/tasks`, {
            headers: this._authHeaders()
        }));
    }
}
class ServermanagerApi extends BaseApi  {
    // GET "/servermanager/" + server + "/"+ action
    async sendCommandToServer(server, action) {
        const validActions = ['start', 'stop', 'restart', 'send', 'log', 'info', 'players', 'metrics', 'kill'];
        return this.request(http.get(`${this.host}/servermanager/${server}/${action}`, {
            headers: this._authHeaders()
        }));
    }
    // GET "/servermanager/" + server + "/info"
    async getServerInfo(server) {
        return this.request(http.get(`${this.host}/servermanager/${server}/info`, {
            headers: this._authHeaders()
        }));
    }
    // GET "/servermanager/" + server + "/logs"
    async getServerLog(server) {
        return this.request(http.get(`${this.host}/servermanager/${server}/log`, {
            headers: this._authHeaders()
        }));
    }
}
class FileManagerApi extends BaseApi  {
    // GET "/folder-info/:folderName(.*)"
    async getFolderInfo(folderName) {
        //const FName = decodeURIComponent(folderName);
        //if (FName?.startsWith("/")) folderName = FName.substring(1);
        console.log("FName", folderName);
        return this.request(http.get(`${this.host}/folder-info/${folderName}`, {
            headers: this._authHeaders()
        }));
    }
    // GET "read-file-by-path/:path(.*)"
    async readFileByPath(path) {
        return this.request(http.get(`${this.host}/read-file-by-path/${path}`, {
            headers: this._authHeaders()
        }));
    }
    //POST/write-file' { directoryname: rawDirName, filename: rawFileName, content }
    async writeFile(formData) {
        return this.request(http.post(`${this.host}/write-file`, formData, {
            headers: this._authHeaders()
        }));
    }
    async uploadFiles(formData) {
        return this.request(http.post(`${this.host}/upload-files`, formData, {
            headers: this._authHeaders()
        }));
    }
    // EXAMPLE = DELETE /delete/serverName/pathToFileOrFolderInServer
    async deleteFile(serverName, path) {
        const verifyPath = path.startsWith("/") ? path.substring(1) : path;
        return this.request(http.delete(`${this.host}/deleteFile/${serverName}/${verifyPath}`, {
            headers: this._authHeaders(null)
        }));
    }
    // POST /create-folder
    async createFolder(Path) {
        //     const { directoryname: rawDirName } = request.body;
        return this.request(http.post(`${this.host}/create-folder`, {
            directoryname: Path
        }, {
            headers: this._authHeaders()
        }));
    }
    // PUT /rename     const { server: rawServer, path: rawServerPath, newName: rawNewName } = request.body;
    async renameFile(server, path, newName) {
        return this.request(http.put(`${this.host}/rename`, {
            server: server,
            path: path,
            newName: newName
        }, {
            headers: this._authHeaders()
        }));
    }
}
class SystemMonitor extends BaseApi {
    getSystemInfo() {
        //GET 
        ///hardware/resources
        ///hardware/summary
        return this.request(this.http.get(`${this.host}/hardware/summary`, {
            headers: this._authHeaders()
        }));
    }
}
class PluginsApi extends BaseApi {
    // GET /plugins/:serverName (Listar plugins)
    async getPlugins(serverName) {
        return this.request(this.http.get(`${this.host}/plugins/${serverName}`, {
            headers: this._authHeaders()
        }));
    }
    //  // GET /mods/:serverName (Listar mods)
    async getMods(serverName) {
        return this.request(this.http.get(`${this.host}/mods/${serverName}`, {
            headers: this._authHeaders()
        }));
    }
    /* 
    const Operations = ['enable','disable', 'delete']
    get('/plugin/:serverName/:itemName/:operation')

    get('/mod/:serverName/:itemName/:operation')
    */
  async pluginToggle(serverName,itemName,operation) {
    return this.request(this.http.get(`${this.host}/plugin/${serverName}/${itemName}/${operation}`, {
        headers: this._authHeaders()
    }));
  }
  async ModToggle(serverName,itemName,operation) {
    return this.request(this.http.get(`${this.host}/mod/${serverName}/${itemName}/${operation}`, {
        headers: this._authHeaders()
    }));
  }
  //   fastify.post('/download-file' { server: rawServer, path: rawPathInServer, url } body
  async DownloadModorPlugin(serverName,url,type) {
    const isModorPlugin = type === "mods" ? "mods" : "plugins";
    return this.request(this.http.post(`${this.host}/download-file`, {
        server: serverName,
        url: url,
        path: isModorPlugin
    },
    {
        headers: this._authHeaders()
    }));
    
  }
}
class BackupsAPi extends BaseApi {
    // GET ALL /backups/backupsInfo/
    async getBackups() {
        return this.request(this.http.get(`${this.host}/backups/backupsInfo`, {
            headers: this._authHeaders()
        }));
    }
    // POST /backups/create/  {folderName,outputFilename,serverName?}
    async createBackup(data) {
        if (!data || !data.folderName || !data.outputFilename) {
            console.error("folderName and outputFilename are required");
        }
        return this.request(this.http.post(`${this.host}/backups/create`, data, {
            headers: this._authHeaders()
        }));
    }
    // DELETE /backups/ { filename }
    async deleteBackup(filename) {
        if (!filename || typeof filename !== 'string') {
            console.error("filename is required");
            return;
        }
        return this.request(this.http.post(`${this.host}/backups`,{filename}, {
            headers: this._authHeaders()
        }));
    }
    // GET /backups/download/:filename
    async downloadBackup(filename) {
        if (!filename || typeof filename !== 'string') {
            console.error("filename is required");
            return;
        }
        return this.request(this.http.get(`${this.host}/backups/download/${filename}`, {
            headers: this._authHeaders()
        }));
    }
    // GET /backups/restore/ { filename, outputFolderName } = body;
    async restoreBackup(data) {
        const { filename, outputFolderName } = data;
        if (!filename || typeof filename !== 'string' || !outputFolderName || typeof outputFolderName !== 'string') {
            console.error("filename and outputFolderName are required");
            return;
        }
        return this.request(this.http.post(`${this.host}/backups/restore/`, data, {
            headers: this._authHeaders()
        }));
    }
}
const fetchapi = new FetchApi(actualBaseApi);
const serverapi = new ServerApi(actualBaseApi)
const servermanagerapi = new ServermanagerApi(actualBaseApi)
const filemanagerapi = new FileManagerApi(actualBaseApi)
const systemapi = new SystemMonitor(actualBaseApi);
const pluginsapi = new PluginsApi(actualBaseApi);
const backupsapi = new BackupsAPi(actualBaseApi);
// test
async function test() {
    const pathENCODED = encodeURIComponent(window.selectedServer);
    const folderInfo = await filemanagerapi.getFolderInfo(pathENCODED);
    console.log("folderInfo", folderInfo);
}
/*
test();

*/
async function fetchFiles(path,element) {
    const pathENCODED = encodeURIComponent(path);
    const result = await filemanagerapi.getFolderInfo(pathENCODED);
    console.log("result", result);
    if (result && result.data) {
        if (!element) return;
        element.data = result.data?.files;
        element.currentPath = path;
    }
}
export {
    fetchapi,
    serverapi,
    servermanagerapi,
    filemanagerapi,
    systemapi,
    BaseApi,
    actualBaseApi,
    fetchFiles,
    pluginsapi,
    backupsapi
}