`{isDirectory: false
modified: "2025-06-04T21:05:47.896Z"
name: "NombreServidor-backup-2025-06-04T21-05-42.tar.gz"
path: ""
size: 141180928}
`
interface Backup {
    isDirectory: boolean;
    modified: string;
    name: string;
    path: string;
    size: number;
}

`restore body params { filename, outputFolderName }`
interface RestoreBody {
    filename: string;
    outputFolderName: string;
}
interface ParsedBackup {
    name: string;
    date: string;
    fullFilename: string;
}
export type { Backup, RestoreBody, ParsedBackup };