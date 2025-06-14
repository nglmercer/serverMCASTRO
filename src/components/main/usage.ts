import { systemapi } from "src/fetch/fetchapi";
import { CircleProgress } from "@litcomponents/mc/circle-progress"

async function initializegraphs() {
    const result = await systemapi.getResources()
    console.log("result",result)
    if (result && result.data){
        const {cpu,ram} = result.data;
        setResources("ram",ram.percent)
        setResources("cpu",cpu)
    }
}
const ResourceElements: {
[key: string]: string;
} = {
ram: "ram-progress",
cpu: "cpu-progress"
};
function setResources(id:string,number:number){
    const validID = ResourceElements[id]
    const element = document.getElementById(validID) as CircleProgress;
    if (!id || !validID || !element)return;
    element.setValue(number)
    element.setActiveColor(getProgressiveColor(number))
}
function getProgressiveColor(percent: number): string {
    // Limitar el rango entre 0 y 100
    percent = Math.max(0, Math.min(100, percent));

    // Convertir el porcentaje en un valor entre 0 (verde) y 1 (rojo)
    const ratio = percent / 100;

    // Interpolación lineal entre verde (0,255,0) y rojo (255,0,0)
    const r = Math.round(255 * ratio);
    const g = Math.round(255 * (1 - ratio));
    const b = 0; // No usamos azul

    // Convertir a color hexadecimal
    const toHex = (value: number) => value.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
function createSmartInterval(callback: () => void) {
    let active = true;
    let lastInteraction = Date.now();
    let currentInterval: NodeJS.Timeout;
  
    const ACTIVE_INTERVAL = 1000;      // 1s si hay interacción
    const INACTIVE_INTERVAL = 10000;   // 10s si no hay interacción
    const INACTIVITY_TIMEOUT = 15000;  // Tiempo sin eventos para volverse inactivo
  
    const resetInteraction = () => {
      lastInteraction = Date.now();
      if (!active) {
        active = true;
        restartInterval();
      }
    };
  
    const checkInactivity = () => {
      if (Date.now() - lastInteraction > INACTIVITY_TIMEOUT && active) {
        active = false;
        restartInterval();
      }
    };
  
    const restartInterval = () => {
      clearInterval(currentInterval);
      const delay = active ? ACTIVE_INTERVAL : INACTIVE_INTERVAL;
      currentInterval = setInterval(() => {
        callback();
        checkInactivity();
      }, delay);
    };
  
    // Detectar interacción del usuario
    ['mousemove', 'keydown', 'scroll', 'click'].forEach(event => {
      window.addEventListener(event, resetInteraction);
    });
  
    restartInterval(); // Iniciar la primera vez
  }
  
createSmartInterval(()=>{
    initializegraphs()
})
export {
    initializegraphs
};