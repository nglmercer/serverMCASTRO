import { backupsapi } from "src/utils/fetch/fetchapi";
import type { Backup, RestoreBody,ParsedBackup } from "./Types";
import type { BackupInfo } from "@utils/fetch/types/server.types";
import { BackupListComponent, type BackupActionEvent } from "@litcomponents/mc/backups"
const backups_List = document.getElementById("backups_List") as BackupListComponent;

async function getBackups() {
    const result = await backupsapi.getBackups();
    console.log("result", result);
    if(!result || !result.data)return;
    const backups: BackupInfo[] = result.data?.files;
    if (!backups || backups.length === 0 || !backups_List) {
        console.log("No backups");
        backups_List.backups = [];
        return;
    }
    if (backups_List) backups_List.backups = backups;
    return result;
}
/*     backups.forEach((backup) => {
        console.log("backup", backup);
        restoreBackup({ filename: backup.name, outputFolderName: getOrParserName(backup.name).name });
    }); */
async function restoreBackup(backup: RestoreBody) {
    console.log("backup", backup);
    const result = await backupsapi.restoreBackups(backup);
    console.log("result", result);
    return result;
}
function getOrParserName(filename: string): ParsedBackup {
    const backupSplit = "-backup-";
    
    // Remove .tar.gz extension first
    const nameWithoutExtension = filename.replace(/\.tar\.gz$/, '');
    
    // Find the backup separator
    const backupIndex = nameWithoutExtension.indexOf(backupSplit);
    
    if (backupIndex === -1) {
        // If no backup separator found, return the whole name
        return {
            name: nameWithoutExtension,
            date: '',
            fullFilename: filename
        };
    }
    
    // Split into name and date parts
    const name = nameWithoutExtension.substring(0, backupIndex);
    const dateString = nameWithoutExtension.substring(backupIndex + backupSplit.length);
    
    return {
        name: name,
        date: dateString,
        fullFilename: filename
    };
}
async function initiBackupslistener() {
    if (!backups_List) return;
    backups_List.addEventListener('backup-action', async (e) => {
        const { action, item } = e.detail as BackupActionEvent;
        if (!action || !item) return;
        let result;
        switch (action) {
            case 'restore':
                const objrestore = {
                    filename: item.name,
                    outputFolderName: getOrParserName(item.name).name
                }
                result = await restoreBackup(objrestore);
                console.log("result", result);
                break;
            case 'download':
                const blob = await backupsapi.downloadBackup(item.name);
                console.log("download", item);
                
                downloadFile(blob, item.name);
                break;
            case 'delete':
                result = await backupsapi.deleteBackup(item.name);
                console.log("delete", item);
                getBackups();
                break;
            default:
                console.error("Acción no reconocida", action);
                break;
        }
        console.log("action", action, item);
    });
}
function downloadFile(blob: Blob, filename: string) {
    // Crear un URL temporal para el blob
    const url = window.URL.createObjectURL(blob);
    
    // Crear un enlace temporal y hacer clic automáticamente
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
document.addEventListener("DOMContentLoaded", () => {
    initiBackupslistener();
    getBackups();
});
export {
    getBackups
}