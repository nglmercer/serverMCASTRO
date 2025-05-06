import { parseCoreversions } from "src/fetch/parser";
import { serverapi } from "src/fetch/fetchapi"; 
async function fetchCores() {
    const gridElement = document.querySelector('.selectcore')
    const result = await serverapi.getCores();
    const gridOptions = parseCoreversions(result.data)
    console.log("result", result,gridOptions);
    if (gridElement) {
        gridElement.options = gridOptions;
        setTimeout(()=>{
            gridElement.selectedValues = "vanilla"
        },1000)
        gridElement.addEventListener('change', async(e)=>{
            console.log("e",e.detail)
            const result = await serverapi.getcore(e.detail.value)
            console.log("result",result)
            setcoreversions(result.data)
        })
    }
}
async function fetchJavav() {
    const result = await serverapi.getVSJava();
    if (!result) return;
    setjavaversions(result.data)
    
}
async function setcoreversions(arrayV) {
    const optionsCore = returnOptionfromArray(arrayV);
    const coreSelect = document.querySelector(".coreversions");
    if (!coreSelect) return;
    console.log("optionsCore",optionsCore,coreSelect)
    coreSelect.options = optionsCore;
}
async function setjavaversions(objV) {
    const optionsCore = returnOptionfromArray(objV.available);
    const javaSelect = document.querySelector(".javaversions");
    console.log("setjavaversions",optionsCore,objV)
    if (!javaSelect) return;
    javaSelect.options = optionsCore;
}
function returnOptionfromArray(arrayV){
    if (arrayV && Array.isArray(arrayV)){
        return (arrayV).map((v)=>({
            label: v,
            name: v,
            value: v
        }))
    }
    return []
}
document.addEventListener('DOMContentLoaded',()=>{
    fetchCores();
    fetchJavav();
})