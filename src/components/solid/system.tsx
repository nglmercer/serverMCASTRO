import { type Component, For, Show, createSignal, onCleanup, createEffect } from 'solid-js';
import './SystemMonitor.css'; // Import the CSS file
import { systemapi } from 'src/fetch/fetchapi';
async function getSystemInfo() {
    try{
        const result = await systemapi.getSystemInfo();
        return result;
    } catch (error) {
        console.error("Error fetching system info:", error);
        return null;
    }
}
const systemInfoData = await getSystemInfo();
// --- Type Definitions (Copied from your example) ---
export interface CacheInfo {
    l1d?: number;
    l1i?: number;
    l2?: number;
    l3?: number;
}

export interface RawCpuInfo {
    manufacturer?: string;
    brand?: string;
    vendor?: string;
    cache?: CacheInfo;
    cores?: number; // Logical cores/threads
    efficiencyCores?: number;
    family?: string;
    flags?: string;
    governor?: string;
    model?: string; // CPU model number, not brand
    performanceCores?: number;
    physicalCores?: number;
    processors?: number; // Number of physical CPU packages
    revision?: string;
    socket?: string;
    speed?: number; // Base speed in GHz
    speedMax?: number; // Max speed in GHz
    speedMin?: number; // Min speed in GHz
    stepping?: string;
    virtualization?: boolean;
    voltage?: string;
}

export interface CpuInfo {
    model?: string; // This is the brand string e.g., "Intel® 0000"
    speed?: number; // Base speed in GHz
    cores?: number; // Usually physical cores
    cache?: CacheInfo;
    rawCpuInfo?: RawCpuInfo;
}

export interface RawBatteryInfo {
    hasBattery: boolean;
    cycleCount: number;
    isCharging: boolean;
    acConnected: boolean;
    capacityUnit: string;
    currentCapacity: number;
    designedCapacity: number;
    manufacturer: string;
    maxCapacity: number;
    model: string;
    percent: number;
    serial: string;
    timeRemaining: number | null;
    type: string;
    voltage: number;
}

export interface BatteryInfo {
    hasBattery: boolean;
    cycleCount: number;
    isCharging: boolean;
    percent: number;
    rawBatteryInfo?: RawBatteryInfo;
}

export interface SimpleDiskInfo {
    filesystem?: string;
    total?: number; // bytes
    used?: number; // bytes
}

export interface RawDiskInfo {
    fs?: string;
    type?: string;
    size?: number;
    used?: number;
    available?: number;
    rw?: boolean;
    mount?: string;
    use?: number;
    mountPoint?: string;
}

export interface GraphicsController {
    model?: string;
    vendor?: string;
    vram?: number; // in MB
    rawGraphicsInfo?: Record<string, any>;
}

export interface GraphicsInfo {
    controllers?: GraphicsController[];
}

export interface NetworkInterfaceDetail {
    address?: string;
    netmask?: string;
    family?: string;
    mac?: string;
    internal?: boolean;
    cidr?: string | null;
}

export interface PlatformInfo {
    name?: string;
    release?: string;
    arch?: string;
    version?: string;
}

export interface SystemData {
    uptime?: number;
    platform?: PlatformInfo;
    totalmem?: number;
    battery?: BatteryInfo;
    cpu?: CpuInfo;
    disks?: SimpleDiskInfo[];
    rawdisks?: RawDiskInfo[];
    enviroment?: Record<string, string>;
    graphics?: GraphicsInfo;
    networkInterfaces?: Record<string, NetworkInterfaceDetail[]>;
}

export interface SystemInfoResponse {
    success: boolean;
    data: SystemData | null;
}

// --- Helper Functions (Copied from your example) ---
function humanizeFileSize(bytes?: number | null, si = false, dp = 1): string {
    if (bytes === undefined || bytes === null) return 'N/A';
    if (bytes === 0) return '0 Bytes';
    const thresh = si ? 1000 : 1024;
    if (Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
    let u = -1;
    const r = 10 ** dp;
    let b = bytes;
    do {
        b /= thresh;
        ++u;
    } while (Math.round(Math.abs(b) * r) / r >= thresh && u < units.length - 1);
    return b.toFixed(dp) + ' ' + units[u];
}

function humanizeSeconds(totalSeconds?: number | null): string {
    if (totalSeconds === undefined || totalSeconds === null) return 'N/A';
    if (totalSeconds === 0) return '0 seconds';
    const days = Math.floor(totalSeconds / (3600 * 24));
    const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(days + (days === 1 ? " day" : " days"));
    if (hours > 0) parts.push(hours + (hours === 1 ? " hour" : " hours"));
    if (minutes > 0) parts.push(minutes + (minutes === 1 ? " minute" : " minutes"));
    if (seconds > 0 || parts.length === 0) parts.push(seconds + (seconds === 1 ? " second" : " seconds"));

    return parts.join(', ');
}

const systemMonitorLabels = {
    osSectionTitle: "System Information",
    osName: "Operating System",
    osBuild: "OS Build",
    totalRam: "Total RAM",
    Uptime: "System Uptime",
    cpuModel: "CPU Model",
    cpuCores: "CPU Cores",
    cpuSpeed: "CPU Speed",
    environmentSectionTitle: "Environment Variables",
    networkInterfacesSectionTitle: "Network Interfaces",
    disksSectionTitle: "Disk Usage",
    diskUnit: "Unit",
    diskUsed: "Used",
    diskFree: "Free",
    diskTotal: "Total",
    diskPercent: "Usage %",
    noData: "No system data available.",
    loadingData: "Loading system data...",
    errorData: "Error loading system data.",
    battery: "Battery",
    batteryCharging: "Charging",
    batteryNotCharging: "Not Charging",
    batteryCycles: "Cycles",
    batteryPercentage: "Battery Percentage",
    batteryStatus: "Battery Status",
    gpuModel: "GPU Model",
    gpuVendor: "GPU Vendor",
    gpuVRAM: "GPU VRAM",
    graphicsSectionTitle: "Graphics",
};
// --- End Helper Functions ---

interface SystemMonitorSolidProps {
    systemInfo: SystemInfoResponse | null;
}

const SystemMonitorSolid: Component<SystemMonitorSolidProps> = (props) => {
    const initialData = props.systemInfo ||(systemInfoData as SystemInfoResponse);
    const data = () => initialData?.data || (systemInfoData as SystemInfoResponse)?.data;

    const platform = () => data()?.platform || {};
    const cpu = () => data()?.cpu || {};
    const battery = () => data()?.battery;
    const graphics = () => data()?.graphics;
    const enviroment = () => data()?.enviroment || {};
    const networkInterfaces = () => data()?.networkInterfaces || {};

    const [currentUptimeText, setCurrentUptimeText] = createSignal<string>('N/A');
    let uptimeInterval: number | undefined;

    createEffect(() => {
        const initialUptimeSeconds = data()?.uptime;
        console.log("initialUptimeSeconds", initialUptimeSeconds);
        // Este systemInfoReceivedTime es crucial para calcular el uptime correctamente
        // si el prop systemInfo se actualiza con nuevos datos de uptime.
        // Se "reinicia" cada vez que initialUptimeSeconds cambia.
        const systemInfoReceivedTime = Date.now(); 

        if (typeof initialUptimeSeconds === 'number') {
            const updateUptimeDisplay = () => {
                // Calcula cuántos segundos han pasado desde que recibimos el initialUptimeSeconds
                const secondsElapsedSinceFetch = Math.floor((Date.now() - systemInfoReceivedTime) / 1000);
                setCurrentUptimeText(humanizeSeconds(initialUptimeSeconds + secondsElapsedSinceFetch));
            };
            
            updateUptimeDisplay(); // Actualizar inmediatamente al recibir los datos
            
            // Limpiar cualquier intervalo anterior antes de establecer uno nuevo.
            if (uptimeInterval !== undefined) {
                window.clearInterval(uptimeInterval);
            }
            
            // Usar window.setInterval para asegurar que se usan los tipos del DOM.
            // Devuelve un 'number' en el navegador.
            uptimeInterval = window.setInterval(updateUptimeDisplay, 1000);

        } else {
            setCurrentUptimeText(humanizeSeconds(undefined)); // Mostrar 'N/A' o similar
            // Si no hay uptime, asegurarse de limpiar cualquier intervalo existente.
            if (uptimeInterval !== undefined) {
                window.clearInterval(uptimeInterval);
                uptimeInterval = undefined; // Marcar que no hay intervalo activo
            }
        }
    });

    onCleanup(() => {
        if (uptimeInterval !== undefined) {
            window.clearInterval(uptimeInterval);
        }
    });


    const disksToDisplay = (): Array<Partial<RawDiskInfo & SimpleDiskInfo & { available?: number }>> => {
        const currentData = data();
        if (!currentData) return [];
        
        if (currentData.rawdisks && currentData.rawdisks.length > 0) {
            return currentData.rawdisks.map(d => ({
                ...d,
                mountPoint: d.mount || d.fs,
                total: d.size, // rawdisks usa 'size'
                // 'available' ya está en RawDiskInfo
            }));
        } else if (currentData.disks && currentData.disks.length > 0) {
            return currentData.disks.map(d => ({
                ...d,
                mountPoint: d.filesystem,
                // 'total' y 'used' están en SimpleDiskInfo
                available: (d.total !== undefined && d.used !== undefined) ? d.total - d.used : undefined,
                use: (d.total && d.used && d.total > 0) ? (d.used / d.total) * 100 : undefined,
            }));
        }
        return [];
    };
    
    const getBatteryBarClass = (percentage?: number, isCharging?: boolean) => {
        let classes = 'battery-bar';
        if (typeof percentage !== 'number') return classes;
        if (percentage <= 20) classes += ' low';
        else if (percentage <= 50) classes += ' medium';
        if (isCharging) classes += ' charging';
        return classes;
    };

    return (
        <div class="system-monitor-solid">
            <Show 
                when={!initialData} 
                fallback={
                    <Show 
                        when={initialData?.success && data()} 
                        fallback={
                            <div class="status-message">
                                {initialData?.success === false ? systemMonitorLabels.errorData : systemMonitorLabels.noData}
                            </div>
                        }
                        keyed
                    >
                        {/* OS & Hardware Info */}
                        <section>
                            <h3>{systemMonitorLabels.osSectionTitle}</h3>
                            <div class="system-info">
                                <p><span class="label">{systemMonitorLabels.osName}:</span> {platform().name ?? 'N/A'} {platform().version ?? ''} <sup>{platform().arch ?? ''}</sup></p>
                                <p><span class="label">{systemMonitorLabels.osBuild}:</span> {platform().release ?? 'N/A'}</p>
                                <p><span class="label">{systemMonitorLabels.totalRam}:</span> {data()?.totalmem ? humanizeFileSize(data()!.totalmem! * 1024 * 1024) : 'N/A'}</p>
                                <p><span class="label">{systemMonitorLabels.Uptime}:</span> {currentUptimeText()}</p>
                                <p><span class="label">{systemMonitorLabels.cpuModel}:</span> {cpu().model ?? 'N/A'}</p>
                                <p><span class="label">{systemMonitorLabels.cpuCores}:</span> {cpu().cores ?? 'N/A'} cores</p>
                                <p><span class="label">{systemMonitorLabels.cpuSpeed}:</span> {cpu().speed ? `${cpu().speed} GHz` : 'N/A'}</p>
                            </div>
                        </section>

                        {/* Battery Info */}
                        <Show when={battery()?.hasBattery}>
                            <section>
                                <h3>{systemMonitorLabels.battery}</h3>
                                <div class="system-info">
                                    <p><span class="label">{systemMonitorLabels.batteryPercentage}:</span></p>
                                    <div class="battery-info-container">
                                        <div class="battery-icon">
                                            {/* Simple SVG Battery Icon - podrías hacerlo más complejo */}
                                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M18 7H20C21.1046 7 22 7.89543 22 9V15C22 16.1046 21.1046 17 20 17H18V19C18 19.5523 17.5523 20 17 20H7C6.44772 20 6 19.5523 6 19V5C6 4.44772 6.44772 4 7 4H17C17.5523 4 18 4.44772 18 5V7ZM8 6V18H16V6H8Z" />
                                                <Show when={(battery()?.percent ?? 0) > 5}>
                                                    <rect x="9" y="7" width="6" height={Math.max(0, (battery()!.percent! / 100) * 10)} rx="1" style={{ "transform-origin": "bottom center", "transform": "scaleY(1) translateY(calc(10px - " + Math.max(0, (battery()!.percent! / 100) * 10) + "px))" }}/>
                                                </Show>
                                            </svg>
                                        </div>
                                        <span>{battery()?.percent ?? 'N/A'}%</span>
                                        <div class="battery-bar-container">
                                            <div 
                                                class={getBatteryBarClass(battery()?.percent, battery()?.isCharging)}
                                                style={{ width: `${battery()?.percent ?? 0}%` }}
                                            />
                                        </div>
                                        <Show when={battery()?.isCharging}>
                                            <span>({systemMonitorLabels.batteryCharging})</span>
                                        </Show>
                                    </div>
                                    <p><span class="label">{systemMonitorLabels.batteryStatus}:</span> {battery()?.isCharging ? systemMonitorLabels.batteryCharging : systemMonitorLabels.batteryNotCharging}</p>
                                    <Show when={typeof battery()?.cycleCount === 'number' && battery()!.cycleCount! >= 0}>
                                        <p><span class="label">{systemMonitorLabels.batteryCycles}:</span> {battery()?.cycleCount}</p>
                                    </Show>
                                </div>
                            </section>
                        </Show>
                        
                        {/* Graphics Info */}
                        <Show when={(graphics()?.controllers?.length ?? 0) > 0}>
                             <section>
                                <h3>{systemMonitorLabels.graphicsSectionTitle}</h3>
                                <For each={graphics()?.controllers}>
                                    {(controller, i) => (
                                        <div class="system-info" style={{"margin-bottom": "10px", "padding-left": i() > 0 ? "10px" : "0"}}>
                                            <p><span class="label">{systemMonitorLabels.gpuModel}:</span> {controller.model ?? 'N/A'}</p>
                                            <p><span class="label">{systemMonitorLabels.gpuVendor}:</span> {controller.vendor ?? 'N/A'}</p>
                                            <Show when={typeof controller.vram === 'number'}>
                                                <p><span class="label">{systemMonitorLabels.gpuVRAM}:</span> {controller.vram} MB</p>
                                            </Show>
                                        </div>
                                    )}
                                </For>
                            </section>
                        </Show>

                        {/* Disks */}
                        <Show when={disksToDisplay().length > 0}>
                            <section>
                                <h3>{systemMonitorLabels.disksSectionTitle}</h3>
                                <table id="disks-table">
                                    <colgroup>
                                        <col style="width: 25%" />
                                        <col style="width: 18.75%" />
                                        <col style="width: 18.75%" />
                                        <col style="width: 18.75%" />
                                        <col style="width: 18.75%" />
                                    </colgroup>
                                    <thead>
                                        <tr>
                                            <th>{systemMonitorLabels.diskUnit}</th>
                                            <th>{systemMonitorLabels.diskUsed}</th>
                                            <th>{systemMonitorLabels.diskFree}</th>
                                            <th>{systemMonitorLabels.diskTotal}</th>
                                            <th>{systemMonitorLabels.diskPercent}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={disksToDisplay()}>
                                            {(disk) => (
                                                <tr>
                                                    <th>{disk.mountPoint ?? disk.fs ?? disk.filesystem ?? 'N/A'}</th>
                                                    <td>{humanizeFileSize(disk.used)}</td>
                                                    <td>{humanizeFileSize(disk.available)}</td>
                                                    <td>{humanizeFileSize(disk.total ?? disk.size)}</td>
                                                    <td>
                                                        {typeof disk.use === 'number' 
                                                            ? `${disk.use.toFixed(1)}%` 
                                                            : (disk.use ?? 'N/A')}
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </section>
                        </Show>

                        {/* Environment Variables */}
                        <Show when={Object.keys(enviroment()).length > 0}>
                            <section>
                                <h3>{systemMonitorLabels.environmentSectionTitle}</h3>
                                <table id="enviroment-table">
                                    <colgroup>
                                        <col style="width: 30%" />
                                        <col style="width: 70%" />
                                    </colgroup>
                                    <tbody>
                                        <For each={Object.entries(enviroment())}>
                                            {([key, value]) => (
                                                <tr>
                                                    <th>{key}</th>
                                                    <td>{value ?? 'N/A'}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </section>
                        </Show>

                        {/* Network Interfaces */}
                        <Show when={Object.keys(networkInterfaces()).length > 0}>
                            <section>
                                <h3>{systemMonitorLabels.networkInterfacesSectionTitle}</h3>
                                <table id="networks-table">
                                    <colgroup>
                                        <col style="width: 30%" />
                                        <col style="width: 70%" />
                                    </colgroup>
                                    <tbody>
                                        <For each={Object.entries(networkInterfaces())}>
                                            {([interfaceName, details]) => (
                                                <tr class="network-ips">
                                                    <th>{interfaceName}</th>
                                                    <td>
                                                        <For each={details || []}>
                                                            {(inner) => (
                                                                <>
                                                                    <span>{inner.address ?? 'N/A'} <sup>{inner.family ?? ''}</sup></span>
                                                                    <br />
                                                                </>
                                                            )}
                                                        </For>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </section>
                        </Show>
                    </Show>
                }>
                <div class="status-message">{systemMonitorLabels.loadingData}</div>
            </Show>
        </div>
    );
};

export default SystemMonitorSolid;