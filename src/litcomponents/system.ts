import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

// --- Type Definitions ---

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
    rawBatteryInfo?: RawBatteryInfo; // Made optional as it might not always be fully populated
}

// This is the structure of the 'disks' array in your sample
export interface SimpleDiskInfo {
    filesystem?: string;
    total?: number; // bytes
    used?: number; // bytes
    // Note: 'available' and 'use' are not in this simple version from your sample 'disks' array
}

// This is the structure of the 'rawdisks' array, which is more complete
export interface RawDiskInfo {
    fs?: string;         // e.g., C:
    type?: string;       // e.g., NTFS
    size?: number;       // total size in bytes
    used?: number;       // used space in bytes
    available?: number;  // available space in bytes
    rw?: boolean;
    mount?: string;      // mount point, e.g., C:
    use?: number;        // percentage used
    mountPoint?: string; // mount point, e.g., C:
}

export interface GraphicsController {
    model?: string;
    vendor?: string;
    vram?: number; // in MB
    rawGraphicsInfo?: Record<string, any>; // Or more specific if needed
}

export interface GraphicsInfo {
    controllers?: GraphicsController[];
}

export interface NetworkInterfaceDetail {
    address?: string;
    netmask?: string;
    family?: string; // "IPv4" or "IPv6"
    mac?: string;
    internal?: boolean;
    cidr?: string | null;
    // Add other potential fields if necessary
}

export interface PlatformInfo {
    name?: string;    // e.g., "Windows_NT"
    release?: string; // e.g., "10.0.26100" (OS Build)
    arch?: string;    // e.g., "x64"
    version?: string; // e.g., "Windows 11 Home" (Friendly OS Version)
}

export interface SystemData {
    uptime?: number;
    platform?: PlatformInfo;
    totalmem?: number; // in MB as per your example (32611 MB)
    battery?: BatteryInfo;
    cpu?: CpuInfo;
    disks?: SimpleDiskInfo[]; // The simpler 'disks' array
    rawdisks?: RawDiskInfo[]; // The more detailed 'rawdisks' array
    enviroment?: Record<string, string>;
    graphics?: GraphicsInfo;
    networkInterfaces?: Record<string, NetworkInterfaceDetail[]>;
    // Add any other top-level keys from 'data' object
}

export interface SystemInfoResponse {
    success: boolean;
    data: SystemData | null; // data can be null if success is false
}
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
    let b = bytes; // Use a new variable for modification
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

// Placeholder for translations/labels
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
    diskUnit: "Unit", // Or Mount Point
    diskUsed: "Used",
    diskFree: "Free",
    diskTotal: "Total",
    diskPercent: "Usage %",
    noData: "No system data available.",
    loadingData: "Loading system data...",
    errorData: "Error loading system data."
};
// --- End Helper Functions ---

@customElement('system-monitor-lit')
export class SystemMonitorLit extends LitElement {
    @property({ type: Object })
    systemInfo: SystemInfoResponse | null = null;

    static styles = css`
        :host {
            display: block;
            font-family: Arial, sans-serif;
            word-wrap: break-word;
        }
        /* ... (resto de tus estilos, parecen estar bien) ... */
        @media (prefers-color-scheme: dark) {
            :host {
                color: #e0e0e0;
                background-color: #1a1a1a;
            }
            table {
                border-color: #404040;
            }
            th, td {
                border-color: #404040;
            }
            th {
                background-color: #2a2a2a;
            }
        }
        @media (prefers-color-scheme: light) {
            :host {
                color: #1a1a1a;
                background-color: #ffffff;
            }
            table {
                border-color: #ddd;
            }
            th, td {
                border-color: #ddd;
            }
            th {
                background-color: #f5f5f5;
            }
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            table-layout: fixed;
        }
        th, td {
            padding: 8px;
            border: 1px solid; /* relies on media query for color */
            text-align: left;
            vertical-align: top;
        }
        td {
            word-break: break-all;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        #enviroment-table td, .network-ips td {
            word-wrap: break-word;
        }
        .system-info p {
            margin: 8px 0;
        }
        sup {
            font-size: 0.75em;
            vertical-align: super;
        }
        .status-message {
            padding: 20px;
            text-align: center;
            font-style: italic;
        }
    `;

    render() {
        if (!this.systemInfo) {
            return html`<div class="status-message">${systemMonitorLabels.loadingData}</div>`;
        }

        if (!this.systemInfo.success || !this.systemInfo.data) {
            return html`<div class="status-message">${this.systemInfo.success === false ? systemMonitorLabels.errorData : systemMonitorLabels.noData}</div>`;
        }

        // Now we know systemInfo.data is not null
        const data: SystemData = this.systemInfo.data;

        const platform: PlatformInfo = data.platform || {};
        const cpu: CpuInfo = data.cpu || {};
        const enviroment: Record<string, string> = data.enviroment || {};
        const networkInterfaces: Record<string, NetworkInterfaceDetail[]> = data.networkInterfaces || {};
        
        // Prefer rawdisks for more detail, fallback to simple disks
        const disksToDisplay: Array<Partial<RawDiskInfo & SimpleDiskInfo>> = data.rawdisks 
            ? data.rawdisks.map(d => ({ ...d, mountPoint: d.mount || d.fs })) // Use mount, fallback to fs for display name
            : (data.disks || []).map(d => ({ ...d, mountPoint: d.filesystem })); // Use filesystem for display name

        return html`
            <div class="system-monitor">
                <div class="system-info">
                    <h3>${systemMonitorLabels.osSectionTitle}</h3>
                    <p>${systemMonitorLabels.osName}: ${platform.name ?? 'N/A'} ${platform.version ?? ''} <sup>${platform.arch ?? ''}</sup></p>
                    <p>${systemMonitorLabels.osBuild}: ${platform.release ?? 'N/A'}</p>
                    <p>${systemMonitorLabels.totalRam}: ${data.totalmem ? humanizeFileSize(data.totalmem * 1024 * 1024) : 'N/A'}</p>
                    <p>${systemMonitorLabels.Uptime}: ${humanizeSeconds(data.uptime)}</p>
                    <p>${systemMonitorLabels.cpuModel}: ${cpu.model ?? 'N/A'}</p>
                    <p>${systemMonitorLabels.cpuCores}: ${cpu.cores ?? 'N/A'} cores</p>
                    <p>${systemMonitorLabels.cpuSpeed}: ${cpu.speed ? `${cpu.speed} GHz` : 'N/A'}</p>
                </div>

                ${Object.keys(enviroment).length > 0 ? html`
                    <h3>${systemMonitorLabels.environmentSectionTitle}</h3>
                    <table id="enviroment-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(enviroment).map(([key, value]) => html`
                                <tr>
                                    <th>${key}</th>
                                    <td>${value ?? 'N/A'}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                ` : ''}

                ${Object.keys(networkInterfaces).length > 0 ? html`
                    <h3>${systemMonitorLabels.networkInterfacesSectionTitle}</h3>
                    <table id="networks-table">
                        <colgroup>
                            <col style="width: 30%">
                            <col style="width: 70%">
                        </colgroup>
                        <tbody>
                            ${Object.entries(networkInterfaces).map(([key, value]) => html`
                                <tr class="network-ips">
                                    <th>${key}</th>
                                    <td>
                                        ${(value || []).map(inner => html`
                                            <span>${inner.address ?? 'N/A'} <sup>${inner.family ?? ''}</sup></span><br>
                                        `)}
                                    </td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                ` : ''}

                ${disksToDisplay.length > 0 ? html`
                    <h3>${systemMonitorLabels.disksSectionTitle}</h3>
                    <table id="disks-table">
                        <colgroup>
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                            <col style="width: 20%">
                        </colgroup>
                        <thead>
                            <tr>
                                <th>${systemMonitorLabels.diskUnit}</th>
                                <th>${systemMonitorLabels.diskUsed}</th>
                                <th>${systemMonitorLabels.diskFree}</th>
                                <th>${systemMonitorLabels.diskTotal}</th>
                                <th>${systemMonitorLabels.diskPercent}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${disksToDisplay.map(disk => html`
                                <tr>
                                    <th>${disk.mountPoint ?? disk.fs ?? disk.filesystem ?? 'N/A'}</th>
                                    <td>${humanizeFileSize(disk.used)}</td>
                                    <td>${humanizeFileSize(disk.available)}</td>
                                    <td>${humanizeFileSize(disk.total ?? disk.size)}</td>
                                    <td>${typeof disk.use === 'number' ? `${disk.use.toFixed(1)}%` : (disk.use ?? 'N/A')}</td>
                                </tr>
                            `)}
                        </tbody>
                    </table>
                ` : ''}
            </div>
        `;
    }
}
