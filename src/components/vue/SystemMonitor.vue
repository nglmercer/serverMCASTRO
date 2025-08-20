<template>
  <div class="block font-sans break-words border rounded-lg p-4 transition-all duration-300 bg-gray-50 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600">
    <div v-if="!initialData" class="p-6 text-center italic text-lg">
      {{ systemMonitorLabels.loadingData }}
    </div>
    
    <div v-else-if="initialData && (!initialData.success || !initialData.data)" class="p-6 text-center italic text-lg">
      {{ initialData.success === false ? systemMonitorLabels.errorData : systemMonitorLabels.noData }}
    </div>
    
    <div v-else-if="initialData && initialData.success && initialData.data">
      <!-- OS & Hardware Info -->
      <section>
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600 first:mt-0">
          {{ systemMonitorLabels.osSectionTitle }}
        </h3>
        <div class="space-y-2.5">
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.osName }}:</span>
            {{ platform.name ?? 'N/A' }} {{ platform.version ?? '' }}
            <sup class="text-xs align-super ml-0.5">{{ platform.arch ?? '' }}</sup>
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.osBuild }}:</span>
            {{ platform.release ?? 'N/A' }}
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.totalRam }}:</span>
            {{ data?.totalmem ? humanizeFileSize(data.totalmem * 1024 * 1024) : 'N/A' }}
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.Uptime }}:</span>
            {{ currentUptimeText }}
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.cpuModel }}:</span>
            {{ cpu.model ?? 'N/A' }}
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.cpuCores }}:</span>
            {{ cpu.cores ?? 'N/A' }} cores
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.cpuSpeed }}:</span>
            {{ cpu.speed ? `${cpu.speed} GHz` : 'N/A' }}
          </p>
        </div>
      </section>

      <!-- Battery Info -->
      <section v-if="battery?.hasBattery">
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600">
          {{ systemMonitorLabels.battery }}
        </h3>
        <div class="space-y-2.5">
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.batteryPercentage }}:</span>
          </p>
          <div class="flex items-center gap-2">
            <div class="w-6 h-6">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="w-full h-full">
                <path d="M18 7H20C21.1046 7 22 7.89543 22 9V15C22 16.1046 21.1046 17 20 17H18V19C18 19.5523 17.5523 20 17 20H7C6.44772 20 6 19.5523 6 19V5C6 4.44772 6.44772 4 7 4H17C17.5523 4 18 4.44772 18 5V7ZM8 6V18H16V6H8Z" :fill="isDark ? '#e0e0e0' : '#212529'" />
                <rect v-if="(battery?.percent ?? 0) > 5" x="9" y="7" width="6" :height="Math.max(0, (battery!.percent! / 100) * 10)" rx="1" :fill="isDark ? '#e0e0e0' : '#212529'" :style="{ transformOrigin: 'bottom center', transform: `scaleY(1) translateY(calc(10px - ${Math.max(0, (battery!.percent! / 100) * 10)}px))` }" />
              </svg>
            </div>
            <span>{{ battery?.percent ?? 'N/A' }}%</span>
            <div class="w-25 h-3 bg-gray-300 rounded border border-gray-400 overflow-hidden">
              <div 
                :class="getBatteryBarClass(battery?.percent, battery?.isCharging)"
                :style="{ width: `${battery?.percent ?? 0}%` }"
                class="h-full transition-all duration-500 ease-in-out rounded-l"
              ></div>
            </div>
            <span v-if="battery?.isCharging">({{ systemMonitorLabels.batteryCharging }})</span>
          </div>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.batteryStatus }}:</span>
            {{ battery?.isCharging ? systemMonitorLabels.batteryCharging : systemMonitorLabels.batteryNotCharging }}
          </p>
          <p v-if="typeof battery?.cycleCount === 'number' && battery.cycleCount >= 0" class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.batteryCycles }}:</span>
            {{ battery.cycleCount }}
          </p>
        </div>
      </section>
      
      <!-- Graphics Info -->
      <section v-if="(graphics?.controllers?.length ?? 0) > 0">
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600">
          {{ systemMonitorLabels.graphicsSectionTitle }}
        </h3>
        <div v-for="(controller, i) in graphics?.controllers" :key="i" 
             :class="{ 'mb-2.5': true, 'pl-2.5': i > 0 }" class="space-y-2.5">
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.gpuModel }}:</span>
            {{ controller.model ?? 'N/A' }}
          </p>
          <p class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.gpuVendor }}:</span>
            {{ controller.vendor ?? 'N/A' }}
          </p>
          <p v-if="typeof controller.vram === 'number'" class="leading-relaxed">
            <span class="font-bold mr-1">{{ systemMonitorLabels.gpuVRAM }}:</span>
            {{ controller.vram }} MB
          </p>
        </div>
      </section>

      <!-- Disks -->
      <section v-if="disksToDisplay.length > 0">
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600">
          {{ systemMonitorLabels.disksSectionTitle }}
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse mb-4 table-fixed border border-gray-300 dark:border-gray-600">
            <colgroup>
              <col class="w-1/4" />
              <col class="w-3/16" />
              <col class="w-3/16" />
              <col class="w-3/16" />
              <col class="w-3/16" />
            </colgroup>
            <thead>
              <tr>
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ systemMonitorLabels.diskUnit }}
                </th>
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ systemMonitorLabels.diskUsed }}
                </th>
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ systemMonitorLabels.diskFree }}
                </th>
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ systemMonitorLabels.diskTotal }}
                </th>
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ systemMonitorLabels.diskPercent }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="disk in disksToDisplay" :key="disk.mountPoint || disk.fs || disk.filesystem">
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ disk.mountPoint ?? disk.fs ?? disk.filesystem ?? 'N/A' }}
                </th>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-all">
                  {{ humanizeFileSize(disk.used) }}
                </td>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-all">
                  {{ humanizeFileSize(disk.available) }}
                </td>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-all">
                  {{ humanizeFileSize(disk.total ?? disk.size) }}
                </td>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-all">
                  {{ typeof disk.use === 'number' ? `${disk.use.toFixed(1)}%` : (disk.use ?? 'N/A') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Environment Variables -->
      <section v-if="Object.keys(environment).length > 0">
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600">
          {{ systemMonitorLabels.environmentSectionTitle }}
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse mb-4 table-fixed border border-gray-300 dark:border-gray-600">
            <colgroup>
              <col class="w-3/10" />
              <col class="w-7/10" />
            </colgroup>
            <tbody>
              <tr v-for="[key, value] in Object.entries(environment)" :key="key">
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ key }}
                </th>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-words">
                  {{ value ?? 'N/A' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Network Interfaces -->
      <section v-if="Object.keys(networkInterfaces).length > 0">
        <h3 class="mt-5 mb-2.5 pb-1 text-lg font-semibold border-b border-gray-300 dark:border-gray-600">
          {{ systemMonitorLabels.networkInterfacesSectionTitle }}
        </h3>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse mb-4 table-fixed border border-gray-300 dark:border-gray-600">
            <colgroup>
              <col class="w-3/10" />
              <col class="w-7/10" />
            </colgroup>
            <tbody>
              <tr v-for="[interfaceName, details] in Object.entries(networkInterfaces)" :key="interfaceName">
                <th class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top bg-gray-200 dark:bg-gray-700">
                  {{ interfaceName }}
                </th>
                <td class="p-2.5 border border-gray-300 dark:border-gray-600 text-left align-top break-words">
                  <template v-for="(inner, index) in details || []" :key="index">
                    <span>{{ inner.address ?? 'N/A' }} <sup class="text-xs align-super ml-0.5">{{ inner.family ?? '' }}</sup></span>
                    <br v-if="index < (details?.length ?? 0) - 1" />
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { systemapi } from 'src/utils/fetch/fetchapi'
import type { ApiResponse } from 'src/utils/fetch/types/api.types'
import type { 
  SystemInfo, 
  CpuInfo, 
  BatteryInfo, 
  SimpleDiskInfo, 
  RawDiskInfo, 
  GraphicsInfo, 
  NetworkInterfaceDetail, 
  PlatformInfo,
  DisplayDiskInfo 
} from 'src/utils/fetch/types/server.types'

// --- Type Definitions ---

export interface SystemData {
  uptime?: number
  platform?: PlatformInfo
  totalmem?: number
  battery?: BatteryInfo
  cpu?: CpuInfo
  disks?: SimpleDiskInfo[]
  rawdisks?: RawDiskInfo[]
  environment?: Record<string, string>
  graphics?: GraphicsInfo
  networkInterfaces?: Record<string, NetworkInterfaceDetail[]>
}

export interface SystemInfoResponse {
  success: boolean
  data: SystemData | null
}

// Tipo para la respuesta de la API
type SystemApiResponse = ApiResponse<SystemInfo>



// Helper Functions
function humanizeFileSize(bytes?: number | null, si = false, dp = 1): string {
  if (bytes === undefined || bytes === null) return 'N/A'
  if (bytes === 0) return '0 Bytes'
  const thresh = si ? 1000 : 1024
  if (Math.abs(bytes) < thresh) {
    return bytes + ' B'
  }
  const units = si
    ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
  let u = -1
  const r = 10 ** dp
  let b = bytes
  do {
    b /= thresh
    ++u
  } while (Math.round(Math.abs(b) * r) / r >= thresh && u < units.length - 1)
  return b.toFixed(dp) + ' ' + units[u]
}

function humanizeSeconds(totalSeconds?: number | null): string {
  if (totalSeconds === undefined || totalSeconds === null) return 'N/A'
  if (totalSeconds === 0) return '0 seconds'
  const days = Math.floor(totalSeconds / (3600 * 24))
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  const parts: string[] = []
  if (days > 0) parts.push(days + (days === 1 ? " day" : " days"))
  if (hours > 0) parts.push(hours + (hours === 1 ? " hour" : " hours"))
  if (minutes > 0) parts.push(minutes + (minutes === 1 ? " minute" : " minutes"))
  if (seconds > 0 || parts.length === 0) parts.push(seconds + (seconds === 1 ? " second" : " seconds"))

  return parts.join(', ')
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
}

// Reactive data
const systemInfoData = ref<SystemApiResponse | null>(null)
const currentUptimeText = ref<string>('N/A')
let uptimeInterval: number | undefined

// Dark mode detection
const isDark = ref(false)

// Función para mapear datos de la API al formato del componente
const mapApiDataToSystemData = (apiData: SystemInfo | undefined): SystemData | null => {
  if (!apiData) return null
  
  return {
    uptime: apiData.uptime,
    platform: apiData.platform || {
      name: 'Unknown',
      release: 'Unknown',
      arch: 'Unknown',
      version: 'Unknown'
    },
    totalmem: apiData.memory?.total ? apiData.memory.total / (1024 * 1024) : undefined, // Convertir a MB
    cpu: apiData.cpu || {
      model: 'Unknown',
      cores: undefined,
      speed: undefined
    },
    battery: apiData.battery,
    disks: apiData.disks,
    rawdisks: apiData.rawdisks,
    environment: apiData.environment || {},
    graphics: apiData.graphics,
    networkInterfaces: apiData.networkInterfaces || {}
  }
}

// Computed properties
const initialData = computed((): SystemInfoResponse | null => {
  const apiResponse = systemInfoData.value
  if (!apiResponse) return null
  
  return {
    success: apiResponse.success,
    data: mapApiDataToSystemData(apiResponse.data)
  }
})

const data = computed(() => initialData.value?.data)
const platform = computed(() => data.value?.platform || {})
const cpu = computed(() => data.value?.cpu || {})
const battery = computed(() => data.value?.battery)
const graphics = computed(() => data.value?.graphics)
const environment = computed(() => data.value?.environment || {})
const networkInterfaces = computed(() => data.value?.networkInterfaces || {})

const disksToDisplay = computed((): DisplayDiskInfo[] => {
  const currentData = data.value
  if (!currentData) return []
  
  if (currentData.rawdisks && currentData.rawdisks.length > 0) {
    return currentData.rawdisks.map(d => ({
      ...d,
      mountPoint: d.mount || d.fs,
      total: d.size, // rawdisks usa 'size'
      // 'available' ya está en RawDiskInfo
    } as DisplayDiskInfo))
  } else if (currentData.disks && currentData.disks.length > 0) {
    return currentData.disks.map(d => ({
      ...d,
      mountPoint: d.filesystem,
      // 'total' y 'used' están en SimpleDiskInfo
      available: (d.total !== undefined && d.used !== undefined) ? d.total - d.used : undefined,
      use: (d.total && d.used && d.total > 0) ? (d.used / d.total) * 100 : undefined,
    } as DisplayDiskInfo))
  }
  return []
})

// Methods
const getBatteryBarClass = (percentage?: number, isCharging?: boolean) => {
  let classes = 'bg-green-500' // Default green
  if (typeof percentage !== 'number') return classes
  if (percentage <= 20) classes = 'bg-red-500' // Red for low
  else if (percentage <= 50) classes = 'bg-orange-500' // Orange for medium
  if (isCharging) {
    classes += ' bg-gradient-to-r from-green-400 to-green-600 animate-pulse'
  }
  return classes
}

const getSystemInfo = async (): Promise<SystemApiResponse | null> => {
  try {
    const result = await systemapi.getSystemInfo()
    return result
  } catch (error) {
    console.error("Error fetching system info:", error)
    return null
  }
}

const updateDarkMode = () => {
  isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
}

// Watchers
watch(() => data.value?.uptime, (newUptime) => {
  const initialUptimeSeconds = newUptime
  console.log("initialUptimeSeconds", initialUptimeSeconds)
  const systemInfoReceivedTime = Date.now()

  if (typeof initialUptimeSeconds === 'number') {
    const updateUptimeDisplay = () => {
      const secondsElapsedSinceFetch = Math.floor((Date.now() - systemInfoReceivedTime) / 1000)
      currentUptimeText.value = humanizeSeconds(initialUptimeSeconds + secondsElapsedSinceFetch)
    }
    
    updateUptimeDisplay()
    
    if (uptimeInterval !== undefined) {
      window.clearInterval(uptimeInterval)
    }
    
    uptimeInterval = window.setInterval(updateUptimeDisplay, 1000)
  } else {
    currentUptimeText.value = humanizeSeconds(undefined)
    if (uptimeInterval !== undefined) {
      window.clearInterval(uptimeInterval)
      uptimeInterval = undefined
    }
  }
})

// Lifecycle
onMounted(async () => {
  systemInfoData.value = await getSystemInfo()
  
  updateDarkMode()
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateDarkMode)
})

onUnmounted(() => {
  if (uptimeInterval !== undefined) {
    window.clearInterval(uptimeInterval)
  }
  window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', updateDarkMode)
})
</script>

<style scoped>
/* Custom styles for battery charging animation */
.animate-battery-charging {
  background-image: linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent);
  background-size: 1rem 1rem;
  animation: battery-charging-animation 2s linear infinite;
}

@keyframes battery-charging-animation {
  0% { background-position: 1rem 0; }
  100% { background-position: 0 0; }
}
</style>