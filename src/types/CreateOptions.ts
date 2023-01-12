export interface CreateOptions {
    backupID?: bigint;
    maxMessagesPerChannel?: number;
    jsonSave?: boolean;
    jsonBeautify?: boolean;
    includeName?: boolean;
    doNotBackup?: string[];
    backupMembers?: boolean;
    saveImages?: string;
}
