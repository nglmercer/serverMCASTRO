import { parseCoreversions } from "src/fetch/parser";
import { serverapi } from "src/fetch/fetchapi"; 
async function fetchCores(gridElement) {
    const result = await serverapi.getCores();
    const gridOptions = parseCoreversions(result.data)
    console.log("result", result,gridOptions);
    if (gridElement) {
        gridElement.options = gridOptions;
        gridElement.addEventListener('change', async(e)=>{
            console.log("e",e.detail)
            const result = await serverapi.getcore(e.detail.value)
            console.log("result",result)
        })
    }

}
document.addEventListener('DOMContentLoaded',()=>{
    const gridElement = document.querySelector('.selectcore')
    fetchCores(gridElement)
})