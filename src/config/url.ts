const windowurl = typeof window !== "undefined" ? window.location.origin : "";
const baseurlApi = windowurl + "";
const baseurlTestApi = "http://localhost:3000"; // API de desarrollo
const actualBaseApi =
  import.meta.env.MODE === "development" ? baseurlTestApi : baseurlApi;
const urlbase = import.meta.env.MODE === "development" ? "http://localhost:3000" : windowurl;
export {
    actualBaseApi,
    urlbase,
}