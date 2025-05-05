const baseApi = "productionUrl";
const baseTestApi = "http://localhost:3000"; // Original test API
const mockApi = "http://localhost:3000/api"; // Mock API endpoint
const actualBaseApi = mockApi; // Use mock API for development
const http = {
    get: (url, options = {}) => {
        return fetch(url, {
            method: 'GET',
            ...options
        }).then(res => res.json());
    },
    post: (url, body = {}, options = {}) => {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(options.headers || {})
            },
            body: JSON.stringify(body),
            ...options
        }).then(res => res.json());
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
class FetchApi {
    constructor(baseApi) {
        this.host = baseApi;
        this.http = http;
        const info = safeParse(localStorage.getItem("info")) || {};
        this.token = info.token || localStorage.getItem("token");
        this.user = safeParse(info.user || safeParse(localStorage.getItem("user"))) || {};
    }

    _authHeaders(contentType = 'application/json') {
        const defaultHeaders = {
            'Authorization': `${this.token}`
        };
        if (contentType) {
            defaultHeaders['Content-Type'] = contentType;
        }
        return defaultHeaders;
    }

    async _interceptor(promise) {
        try {
            const response = await promise;
            return response;
        } catch (error) {
            console.error('Error en la llamada a la API:', error);
            throw error;
        }
    }

    agregar(formulario) {
        return this._interceptor(http.post(`${this.host}/catalogo`, formulario, {
            headers: this._authHeaders()
        }));
    }

    actualizar(formulario) {
        return this._interceptor(http.put(`${this.host}/catalogo/`, formulario, {
            headers: this._authHeaders()
        }));
    }

    eliminar(modalUpdate) {
        return this._interceptor(http.delete(`${this.host}/catalogo/${modalUpdate.idCatalogo}`, {
            headers: this._authHeaders()
        }));
    }
}
class ServerApi {
    constructor(baseApi) {
        this.host = baseApi;
        this.http = http;
        const info = safeParse(localStorage.getItem("info")) || {};
        this.token = info.token || localStorage.getItem("token");
        this.user = safeParse(info.user || safeParse(localStorage.getItem("user"))) || {};
    }

    _authHeaders(contentType = 'application/json') {
        const defaultHeaders = {
            'Authorization': `${this.token}`
        };
        if (contentType) {
            defaultHeaders['Content-Type'] = contentType;
        }
        return defaultHeaders;
    }

    async _interceptor(promise) {
        try {
            const response = await promise;
            return response;
        } catch (error) {
            console.error('Error en la llamada a la API:', error);
            throw error;
        }
    }
      // GET /java/all
    getVSJava(){
        return this._interceptor(http.get(`${this.host}/java/all`, {
            headers: this._authHeaders()
        }));
    }
      // GET /cores/all
    getCores(){
        return this._interceptor(http.get(`${this.host}/cores/all`, {
            headers: this._authHeaders()
        }));
    }
}
const fetchapi = new FetchApi(actualBaseApi);
const serverapi = new ServerApi(actualBaseApi)
async function testFetch() {
    const result = await serverapi.getVSJava();
    console.log("result", result);
}
testFetch()