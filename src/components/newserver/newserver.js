import { parseCoreversions } from "src/fetch/parser";
import { serverapi } from "src/fetch/fetchapi";

/**
 * Obtiene los núcleos disponibles del servidor y configura el selector
 */
async function fetchCores() {
  try {
    const gridElement = document.querySelector('.selectcore');
    if (!gridElement) {
      console.warn("Elemento .selectcore no encontrado");
      return;
    }
    
    const result = await serverapi.getCores();
    if (!result || !result.data) {
      console.error("No se pudieron obtener los cores");
      return;
    }
    
    const gridOptions = parseCoreversions(result.data);
    console.log("result", result, gridOptions);
    
    gridElement.options = gridOptions;
    
    // Es mejor usar Promise en lugar de setTimeout para operaciones asíncronas
    setTimeout(() => {
      gridElement.Values = "vanilla";
    }, 1000);
    
    gridElement.addEventListener('change', async (e) => {
      console.log("e", e.detail);
      try {
        const result = await serverapi.getcore(e.detail.value);
        console.log("result", result);
        if (result && result.data) {
          await setcoreversions(result.data);
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
async function setcoreversions(arrayV) {
  try {
    const coreSelect = document.querySelector(".coreVersion");
    if (!coreSelect) {
      console.warn("Elemento .coreVersion no encontrado");
      return;
    }
    
    const optionsCore = returnOptionfromArray(arrayV);
    console.log("optionsCore", optionsCore, coreSelect);
    
    coreSelect.options = optionsCore;
  } catch (error) {
    console.error("Error en setcoreversions:", error);
  }
}

/**
 * Configura las opciones del selector de versiones de Java
 * @param {Object} objV - Objeto con información de versiones de Java
 */
async function setjavaversions(objV) {
  try {
    if (!objV || !objV.available) {
      console.error("Datos de versiones de Java inválidos");
      return;
    }
    
    const javaSelect = document.querySelector(".javaVersion");
    if (!javaSelect) {
      console.warn("Elemento .javaVersion no encontrado");
      return;
    }
    
    const optionsCore = returnOptionfromArray(objV.available, "java ");
    console.log("setjavaversions", optionsCore, objV);
    
    javaSelect.options = optionsCore;
    
    if (objV.installed && objV.installed.length > 0) {
      javaSelect.value = objV.installed[0];
      console.log("javaSelect", objV.installed);
    }
  } catch (error) {
    console.error("Error en setjavaversions:", error);
  }
}

/**
 * Convierte un array en un formato de opciones para selectores
 * @param {Array} arrayV - Array de valores
 * @param {string} prefix - Prefijo para añadir a cada etiqueta
 * @returns {Array} - Array formateado para opciones de selectores
 */
function returnOptionfromArray(arrayV, prefix = "") {
  if (arrayV && Array.isArray(arrayV)) {
    return arrayV.map((v) => ({
      label: prefix + v,
      name: prefix + v,
      value: v
    }));
  }
  return [];
}

// Inicialización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  fetchCores();
  fetchJavav();
});