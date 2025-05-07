const globalflags = [
  "-XX:+UseG1GC",
  "-XX:MaxGCPauseMillis=200",
  "-XX:G1HeapRegionSize=4M",
  "-XX:InitiatingHeapOccupancyPercent=35",
  "-XX:+ParallelRefProcEnabled",
  "-XX:+PerfDisableSharedMem",
  "-XX:+UseStringDeduplication"
].join(" \\\n")
const defaultValue = 32 || document.querySelector('#server-memory')?.value;
const defaultOptiflags = false || document.querySelector('#add-optiflags')?.checked;
function generateNewServerStart(memory=defaultValue, optiflags=defaultOptiflags) {
  let command = `-Xmx${memory * 1024}M`;
  if (optiflags) {
    command += `${globalflags}`;
  }
  return command;
}
export default generateNewServerStart;
// console.log(generateNewServerStart("32",true))