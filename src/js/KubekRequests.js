class dataRequests {
    static selectedServer = window.localStorage.selectedServer;
    // Hacer una solicitud AJAX con las configuraciones necesarias
    static makeAjaxRequest = (url, type, data = "", apiEndpoint = true, cb = () => {}) => {
        if (apiEndpoint) {
            url = dataPredefined.API_ENDPOINT + url;
        }

        const options = {
            method: type.toString().toUpperCase(),
            headers: {}
        };

        if (data !== "") {
            // Si los datos son un objeto FormData, no configuramos Content-Type automáticamente
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }
        }

        fetch(url, options)
            .then(async (response) => {
                if (!response.ok) {
                    if (response.status === 403) {
                        dataAlerts.addAlert("{{commons.failedToRequest}}", "warning", "{{commons.maybeUDoesntHaveAccess}}", 5000);
                    }
                    cb(false, response.statusText, await response.text());
                } else {
                    const responseData = await response.json();
                    cb(responseData);
                }
            })
            .catch((error) => {
                cb(false, error.message, error);
            });
    };

    static get = (url, cb, apiEndpoint = true) => {
        this.makeAjaxRequest(url, "GET", "", apiEndpoint, cb);
    };

    static post = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "POST", data, apiEndpoint, cb);
    };

    static put = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "PUT", data, apiEndpoint, cb);
    };

    static delete = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "DELETE", data, apiEndpoint, cb);
    };

    static head = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "HEAD", data, apiEndpoint, cb);
    };

    static options = (url, cb, data = "", apiEndpoint = true) => {
        this.makeAjaxRequest(url, "OPTIONS", data, apiEndpoint, cb);
    };
}
class awaitRequests {
    static selectedServer = window.localStorage.selectedServer;

    // Realizar una solicitud AJAX y retornar una Promesa
    static makeAjaxRequest = async (url, type, data = "", apiEndpoint = true) => {
        if (apiEndpoint) {
            url = dataPredefined.API_ENDPOINT + url;
        }

        const options = {
            method: type.toUpperCase(),
            headers: {}
        };

        if (data !== "") {
            if (data instanceof FormData) {
                options.body = data;
            } else {
                options.body = JSON.stringify(data);
                options.headers['Content-Type'] = 'application/json';
            }
        }

        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                if (response.status === 403) {
                    dataAlerts.addAlert(
                        "{{commons.failedToRequest}}",
                        "warning",
                        "{{commons.maybeUDoesntHaveAccess}}",
                        5000
                    );
                }
                
                const errorText = await response.text();
                const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
                error.status = response.status;
                error.statusText = response.statusText;
                error.body = errorText;
                throw error;
            }
            
            return await response.json();
            
        } catch (error) {
            throw error; // Propagamos el error para manejo externo
        }
    };

    static get = (url, apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "GET", "", apiEndpoint);
    };

    static post = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "POST", data, apiEndpoint);
    };

    static put = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "PUT", data, apiEndpoint);
    };

    static delete = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "DELETE", data, apiEndpoint);
    };

    static head = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "HEAD", data, apiEndpoint);
    };

    static options = (url, data = "", apiEndpoint = true) => {
        return this.makeAjaxRequest(url, "OPTIONS", data, apiEndpoint);
    };
}
class dataBase {
    static get(url, cb, apiEndpoint = true) {
        dataRequests.get(url, cb, apiEndpoint);
    }

    static post(url, cb, data = "", apiEndpoint = true) {
        dataRequests.post(url, cb, data, apiEndpoint);
    }

    static put(url, cb, data = "", apiEndpoint = true) {
        dataRequests.put(url, cb, data, apiEndpoint);
    }

    static delete(url, cb, data = "", apiEndpoint = true) {
        dataRequests.delete(url, cb, data, apiEndpoint);
    }

    static head(url, cb, data = "", apiEndpoint = true) {
        dataRequests.head(url, cb, data, apiEndpoint);
    }

    static options(url, cb, data = "", apiEndpoint = true) {
        dataRequests.options(url, cb, data, apiEndpoint);
    }
}
class awaitBase {
    static get(url, apiEndpoint = true) {
        return awaitRequests.get(url, apiEndpoint);
    }

    static post(url, data = "", apiEndpoint = true) {
        return awaitRequests.post(url, data, apiEndpoint);
    }

    static put(url, data = "", apiEndpoint = true) {
        return awaitRequests.put(url, data, apiEndpoint);
    }

    static delete(url, data = "", apiEndpoint = true) {
        return awaitRequests.delete(url, data, apiEndpoint);
    }

    static head(url, data = "", apiEndpoint = true) {
        return awaitRequests.head(url, data, apiEndpoint);
    }

    static options(url, data = "", apiEndpoint = true) {
        return awaitRequests.options(url, data, apiEndpoint);
    }
}
class dataCoresManager extends dataBase {
    static getList(cb) {
        this.get("/cores", cb);
    }

    static getCoreVersions(core, cb) {
        this.get("/cores/" + core, cb);
    }

    static getCoreURL(core, version, cb) {
        this.get("/cores/" + core + "/" + version, cb);
    }
}


class dataHardware extends dataBase {
    // Получить суммарную информацию о hardware
    static getSummary(cb){
        this.get("/hardware/summary", cb);
    }

    // Получить информацию об использовании ЦПУ, памяти и тд
    static getUsage(cb){
        this.get("/hardware/usage", cb);
    }
}
class dataJavaManager extends dataBase {
    // Список пользовательских версий Java, установленных в системе
    static getLocalInstalledJava(cb){
        this.get("/java", cb);
    }

    // Список версий Java, установленных в data
    static getdataInstalledJava(cb){
        this.get("/java/data", cb);
    }

    // Список доступных для скачивания версий Java
    static getOnlineJava(cb){
        this.get("/java/online", cb);
    }

    // Получить полный список Java
    static getAllJavas(cb){
        this.get("/java/all", cb);
    }
}
class dataPlugins extends dataBase {
    // Список плагинов
    static getPluginsList (cb) {
        this.get("/plugins/" + dataRequests.selectedServer, cb);
    }

    // Список модов
    static getModsList(cb) {
        this.get("/mods/" + dataRequests.selectedServer, cb);
    }
}

class dataServers extends dataBase {
    // Получить список серверов
    static getServersList = (cb) => {
        this.get("/servers", cb);
    };

    // Получить информацию о сервере (в т.ч. статус)
    static getServerInfo = (server, cb) => {
        this.get("/servermanager/" + server + "/info", cb);
    };

    // Проверить сервер на существование
    static isServerExists = (server, cb) => {
        this.getServersList((sList) => {
            cb(sList.includes(server));
        });
    };

    // Получить лог сервера
    static getServerLog = (server, cb) => {
        this.get("/servermanager/" + server + "/log", (log) => {
            if(log === false){
                cb("");
            } else {
                cb(log);
            }
        });
    };

    // Отправить команду на сервер
    static sendCommandToServer = (server, cmd) => {
        this.get("/servermanager/" + server + "/send?cmd=" + cmd);
    };

    // Отправить команду на сервер из поля ввода консоли
    static sendCommandFromInput = (server, inputElem) => {
        if(inputElem.length === 1){
            this.sendCommandToServer(server, inputElem);
        }
    };

    // Запустить сервер
    static startServer = (server) => {
        if(currentServerStatus === dataPredefined.SERVER_STATUSES.STOPPED){
            this.get("/servermanager/" + server + "/start");
        }
    };

    // Перезапустить сервер
    static restartServer = (server) => {
        if(currentServerStatus === dataPredefined.SERVER_STATUSES.RUNNING){
            this.get("/servermanager/" + server + "/restart");
        }
    };

    // Остановить сервер
    static stopServer = (server) => {
        if(currentServerStatus === dataPredefined.SERVER_STATUSES.RUNNING){
            this.get("/servermanager/" + server + "/stop");
        }
    };
}

function getselectedserver() {
    return window.localStorage.selectedServer;
}

class awaitfilemanager extends awaitBase {
    static async filepost(url, data) {
        return fetch("/api" + url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        }).then(res => res.json());
    }
    
    static readDirectory(path) {
        return this.get("/fileManager/read-file-by-path/"+getselectedserver() + path);
    }
    static readFile(path) {
        return this.get("/fileManager/read-file-by-path/"+getselectedserver() + path);
    }
    static deleteFile(path) {
        return this.get("/fileManager/delete?server=" + getselectedserver() + "&path=" + path);
    }
    static renameFile(path, newName) {
        console.log("rename", path, newName);
        return this.get("/fileManager/rename?server=" + getselectedserver() + "&path=" + path + "&newName=" + newName);
    }
    static newDirectory(path, name) {
        return this.filepost("/fileManager/create-file", { 
            directoryname: getselectedserver() + path, 
            filename: name 
        });
    }
    
    static createFile(path, name) {
        return this.filepost("/fileManager/create-file", { 
            directoryname: getselectedserver() + path, 
            filename: name 
        });
    }    
    static writeFilebyName(folderName, fileName, content) {
        return this.post("/fileManager/writeFilebyName", { folderName, fileName, content });
    }    
}