import { Guild, Snowflake, SnowflakeUtil, version as djsVersion } from 'discord.js';
const master: boolean = djsVersion.split('.')[0] === '12';

import axios from 'axios';

import { existsSync, mkdirSync, readdir, statSync, unlinkSync, writeFile } from 'fs';
import { promisify } from 'util';
const writeFileAsync = promisify(writeFile);
const readdirAsync = promisify(readdir);

import { BackupData, BackupInfos, CreateOptions, LoadOptions } from './types/';

import * as createMaster from './master/create';
import * as loadMaster from './master/load';
import * as utilMaster from './master/util';

let backups = `${__dirname}/backups/`;
if (!existsSync(backups)) {
    mkdirSync(backups);
}

/**
 * Checks if a backup exists and returns its data
 * @param {string} backupID
 * @returns {BackupData} The backup data
 */
const getBackupData = async (backupID: string) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        const files = await readdirAsync(backups); // Read "backups" directory
        // Try to get the json file
        const file = files.filter(f => f.split('.').pop() === 'json').find(f => f === `${backupID}.json`);
        if (file) {
            // If the file exists
            const backupData: BackupData = require(`${backups}${file}`);
            // Returns backup informations
            resolve(backupData);
        } else {
            // If no backup was found, return an error message
            reject('No backup found');
        }
    });
};

/**
 * Fetches a backyp and returns the information about it
 * @param {string} backupID The ID of the backup to fetch
 * @returns {BackupInfor} The backup data
 */
export const fetch = (backupID: string) => {
    return new Promise<BackupInfos>(async (resolve, reject) => {
        getBackupData(backupID)
            .then(backupData => {
                const size = statSync(`${backups}${backupID}.json`).size; // Gets the size of the file using fs
                const backupInfos: BackupInfos = {
                    data: backupData,
                    id: backupID,
                    size: Number((size / 1024 / 1024).toFixed(2))
                };
                // Returns backup informations
                resolve(backupInfos);
            })
            .catch(err => {
                reject('No backup found');
            });
    });
};

/**
 * Creates a new backup and saves it to the storage
 * @param {Guild} guild The guild to backup
 * @param {CreateOptions} [options] The backup options
 * @returns {BackupData} The backup data
 */
export const create = async (guild: Guild, options?: CreateOptions) => {
    return new Promise<BackupData>(async (resolve, reject) => {
        if (master) {
            try {
                const backupData: BackupData = {
                    name: guild.name,
                    region: guild.region,
                    verificationLevel: guild.verificationLevel,
                    explicitContentFilter: guild.explicitContentFilter,
                    defaultMessageNotifications: guild.defaultMessageNotifications,
                    afk: guild.afkChannel ? { name: guild.afkChannel.name, timeout: guild.afkTimeout } : null,
                    embed: {
                        enabled: guild.embedEnabled,
                        channel: guild.embedChannel ? guild.embedChannel.name : null
                    },
                    channels: { categories: [], others: [] },
                    roles: [],
                    bans: [],
                    emojis: [],
                    createdTimestamp: Date.now(),
                    guildID: guild.id,
                    id: SnowflakeUtil.generate(Date.now())
                };
                if (guild.iconURL()) {
                    if (options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.iconURL(), { responseType: 'arraybuffer' });
                        backupData.iconBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    } else {
                        backupData.iconURL = guild.iconURL();
                    }
                }
                if (guild.splashURL()) {
                    if (options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.splashURL(), { responseType: 'arraybuffer' });
                        backupData.splashBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    } else {
                        backupData.splashURL = guild.splashURL();
                    }
                }
                if (guild.bannerURL()) {
                    if (options.saveImages && options.saveImages === 'base64') {
                        const res = await axios.get(guild.bannerURL(), { responseType: 'arraybuffer' });
                        backupData.bannerBase64 = Buffer.from(res.data, 'binary').toString('base64');
                    } else {
                        backupData.bannerURL = guild.bannerURL();
                    }
                }
                if (!(options.doNotBackup || []).includes('bans')) {
                    // Backup bans
                    backupData.bans = await createMaster.getBans(guild);
                }
                if (!(options.doNotBackup || []).includes('roles')) {
                    // Backup roles
                    backupData.roles = await createMaster.getRoles(guild);
                }
                if (!(options.doNotBackup || []).includes('emojis')) {
                    // Backup emojis
                    backupData.emojis = await createMaster.getEmojis(guild, options);
                }
                if (!(options.doNotBackup || []).includes('channels')) {
                    // Backup channels
                    backupData.channels = await createMaster.getChannels(guild, options);
                }
                if (options.jsonSave === undefined || options.jsonSave) {
                    // Convert Object to JSON
                    const backupJSON = options.jsonBeautify
                        ? JSON.stringify(backupData, null, 4)
                        : JSON.stringify(backupData);
                    // Save the backup
                    await writeFileAsync(`${backups}${backupData.id}.json`, backupJSON, 'utf-8');
                }
                // Returns ID
                resolve(backupData);
            } catch (e) {
                return reject(e);
            }
        } else {
            reject(
                "Only master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'."
            );
        }
    });
};

/**
 * Loads a backup for a guild
 * @param {string|BackupData} backup The ID of the backup to load or a backup data
 * @param {Guild} guild The guild on which the backup will be loaded
 * @param {LoadOptions} [options] The load options
 * @returns {BackupData} The backup data
 */
export const load = async (backup: string | BackupData, guild: Guild, options?: LoadOptions) => {
    return new Promise(async (resolve, reject) => {
        if (!guild) {
            return reject('Invalid guild');
        }
        try {
            const backupData: BackupData = typeof backup === 'string' ? await getBackupData(backup) : backup;
            if (master) {
                try {
                    if (options.clearGuildBeforeRestore === undefined || options.clearGuildBeforeRestore) {
                        // Clear the guild
                        await utilMaster.clearGuild(guild);
                    }
                    // Restore guild configuration
                    await loadMaster.conf(guild, backupData);
                    // Restore guild roles
                    await loadMaster.roles(guild, backupData);
                    // Restore guild channels
                    await loadMaster.channels(guild, backupData);
                    // Restore afk channel and timeout
                    await loadMaster.afk(guild, backupData);
                    // Restore guild emojis
                    await loadMaster.emojis(guild, backupData);
                    // Restore guild bans
                    await loadMaster.bans(guild, backupData);
                    // Restore embed channel
                    await loadMaster.embedChannel(guild, backupData);
                } catch (e) {
                    return reject(e);
                }
                // Then return the backup data
                return resolve(backupData);
            } else {
                reject(
                    "Only master branch of discord.js library is supported for now. Install it using 'npm install discordjs/discord.js'."
                );
            }
        } catch (e) {
            return reject('No backup found');
        }
    });
};

/**
 * Removes a backup
 * @param {string} backupID The ID of the backup to remove
 * @returns {Promise<void>}
 */
export const remove = async (backupID: string) => {
    return new Promise<void>((resolve, reject) => {
        try {
            require(`${backups}${backupID}.json`);
            unlinkSync(`${backups}${backupID}.json`);
            resolve();
        } catch (error) {
            reject('Backup not found');
        }
    });
};

/**
 * Returns the list of all backup
 * @returns {Snowflake[]} The list of the backups
 */
export const list = async () => {
    const files = await readdirAsync(backups); // Read "backups" directory
    return files.map(f => f.split('.')[0]);
};

/**
 * Change the storage path
 * @param {string} path The folder path
 */
export const setStorageFolder = (path: string) => {
    backups = path;
    if (!existsSync(backups)) {
        mkdirSync(backups);
    }
};

export default {
    create,
    fetch,
    list,
    load,
    remove
};
