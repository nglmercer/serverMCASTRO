import { parseCoreversions } from "src/fetch/parser";
import { serverapi } from "@utils/fetch/fetchapi";
import { ListSelectorElement,GridSelectorElement,VersionSelectorElement } from "@litcomponents/select";
import type { JavaVersions } from "@utils/fetch/types/server.types";
const javaSelect = document.querySelector(".javaVersion") as VersionSelectorElement;

/**
 * Obtiene los núcleos disponibles del servidor y configura el selector
 */
async function fetchCores() {
  try {
    const gridElement = document.querySelector('.selectcore') as GridSelectorElement;
    const newselector = document.querySelector(".coreVersion") as ListSelectorElement;
    newselector.isLoading = true;
    if (!gridElement) {
      console.warn("Elemento .selectcore no encontrado");
      return;
    }
    
    const result = await serverapi.getCores();
    console.log("getCores",result)
    if (!result || !result.data) {
      console.error("No se pudieron obtener los cores");
      return;
    }

    const gridOptions = parseCoreversions(result.data);
    console.log("result", result, gridOptions);
    gridElement.isLoading = false;
    gridElement.options = gridOptions;
    
    // Comentado: No establecer automáticamente "vanilla" como seleccionado
    // setTimeout(() => {
    //   gridElement.Values = ["vanilla"];
    // }, 1000);
    
    gridElement.addEventListener('change', async (e) => {
      const detail = (e as CustomEvent).detail;
      console.log("e", detail);
      try {
        const result = await serverapi.getCoreData(detail.value);
        console.log("result", result);
        if (result && result.data) {
          const versions = Array.isArray(result.data) ? result.data : result.data.versions;
          await setcoreversions(versions, newselector);
        }
      } catch (error) {
        console.error("Error al obtener las versiones del core:", error);
      }
    });
  } catch (error) {
    console.error("Error en fetchCores:", error);
  }
}

/**
 * Obtiene las versiones de Java disponibles
 */
async function fetchJavav() {
  try {
    const result = await serverapi.getVSJava();
    console.log("getVSJava",result)
    if (!result || !result.data) {
      console.error("No se pudieron obtener las versiones de Java");
      return;
    }
    
    await setjavaversions(result.data);
  } catch (error) {
    console.error("Error en fetchJavav:", error);
  }
}

/**
 * Configura las opciones del selector de versiones de núcleo
 * @param {Array} arrayV - Lista de versiones disponibles
 */
async function setcoreversions(arrayV:number[] | string[],select: ListSelectorElement) {

  try {
    const coreSelect = select || document.querySelector(".coreVersion");
    if (!coreSelect) {
      console.warn("Elemento .coreVersion no encontrado");
      return;
    }
    
    const optionsCore = returnOptionfromArray(arrayV);
    console.log("optionsCore", optionsCore, coreSelect);
    coreSelect.isLoading = false; 
    coreSelect.options = optionsCore;
  } catch (error) {
    console.error("Error en setcoreversions:", error);
  }
}

/**
 * Configura las opciones del selector de versiones de Java
 * @param {Object} objV - Objeto con información de versiones de Java
 */
async function setjavaversions(objV:JavaVersions) {

  try {
    if (!objV || !objV.available) {
      console.error("Datos de versiones de Java inválidos");
      return;
    }
    
    if (!javaSelect) {
      console.warn("Elemento .javaVersion no encontrado");
      return;
    }
    
    const optionsCore = returnOptionfromArray(objV.available, objV.installed);

    console.log("setjavaversions", optionsCore, objV);
    javaSelect.isLoading = false; 
    javaSelect.options = optionsCore;
    // Comentado: No seleccionar automáticamente la primera versión de Java instalada
    // if (objV.installed && objV.installed.length > 0) {
    //   javaSelect.Values = [String(objV.installed[0])];
    //   console.log("javaSelect", objV.installed);
    // }
  } catch (error) {
    console.error("Error en setjavaversions:", error);
  }
}

/**
 * Converts arrays into formatted options for selectors
 * @param {Array<number | string>} arrayV - Array of available versions
 * @param {Array<number | string>} installedVersions - Array of installed versions
 * @returns {Array<{label: string, name: string, value: number | string, status: string}>} - Array formatted for selector options
 */
function returnOptionfromArray(arrayV: number[] | string[], installedVersions: number[] | string[] = []) {
  if (arrayV && Array.isArray(arrayV) && installedVersions && Array.isArray(installedVersions)) {
    return arrayV.map((version) => {
      const isInstalled = installedVersions.some(installed => installed === version);
      return {
        label: `${version}${isInstalled ? ' installed' : ''}`,
        name: `${version}${isInstalled ? ' installed' : ''}`,
        status: isInstalled ? 'installed' : 'not-installed',
        value: version
      };
    });
  }
  return [];
}
async function fetchTasks() {
  try {
    const result = await serverapi.getTasks();
    if (!result || !result.data) {
      console.error("No se pudieron obtener las tareas");
      return;
    }
    
    const tasks = result.data;
    console.log("result", result, tasks);
    return tasks;
  } catch (error) {
    console.error("Error en fetchTasks:", error);
  }
}
// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  fetchCores();
  fetchJavav();
  fetchTasks();
javaSelect?.addEventListener('install-version',async (e) => {
  const detail = (e as CustomEvent).detail;
  const {version} = detail;
  if (!version)return;
  const resultInstall = await serverapi.findJavaVersion(version);
  if (!resultInstall || resultInstall.error) {
    const resultInstall = await serverapi.installJava(version);
    console.log("installJava", resultInstall);
  }else{
    console.log("resultInstall", {detail,resultInstall});
  }

})

});