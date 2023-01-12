import type { BackupData, LoadOptions } from './types';
// import type { Emoji, Guild, Role } from 'discord.js';
import type { NewsChannel, TextChannel, ForumChannel, VoiceBasedChannel } from 'discord.js';
import { ChannelType, Emoji, Guild, GuildFeature, Role, VoiceChannel } from 'discord.js';
import { loadCategory, loadChannel } from './util';
import { RateLimitManager } from './ratelimit';

/**
 * Restores the guild configuration
 */
export const loadConfig = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager
): Promise<Guild[]> => {
    const configPromises: [Promise<Guild>[]?, any[]?] = [];
    // const configPromises: Promise<Guild[]>[] = []; // new v3.0.1 change but commented since original by daedalus for discord.js v14 upgrade commit (?)
    if (backupData.name) {
        configPromises.push([guild, 'setName', backupData.name]);
    }
    if (backupData.iconBase64) {
        configPromises.push([guild, 'setIcon', Buffer.from(backupData.iconBase64, 'base64')]);
    } else if (backupData.iconURL) {
        configPromises.push([guild, 'setIcon', backupData.iconURL]);
    }
    if (backupData.splashBase64) {
        configPromises.push([guild, 'setSplash', Buffer.from(backupData.splashBase64, 'base64')]);
    } else if (backupData.splashURL) {
        configPromises.push([guild, 'setSplash', backupData.splashURL]);
    }
    if (backupData.bannerBase64) {
        configPromises.push([guild, 'setBanner', Buffer.from(backupData.bannerBase64, 'base64')]);
    } else if (backupData.bannerURL) {
        configPromises.push([guild, 'setBanner', backupData.bannerURL]);
    }
    if (backupData.verificationLevel) {
        configPromises.push([guild, 'setVerificationLevel', backupData.verificationLevel]);
    }
    if (backupData.defaultMessageNotifications) {
        configPromises.push([guild, 'setDefaultMessageNotifications', backupData.defaultMessageNotifications]);
    }
    // const changeableExplicitLevel = guild.features.includes('COMMUNITY');
    const changeableExplicitLevel = guild.features.includes(GuildFeature.Community);
    if (backupData.explicitContentFilter && changeableExplicitLevel) {
        configPromises.push([guild, 'setExplicitContentFilter', backupData.explicitContentFilter]);
    }
    return rateLimitManager.resolver(configPromises);
};

/**
 * Restore the guild roles
 */
export const loadRoles = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager
): Promise<Role[]> => {
    const rolePromises: [Promise<Role>[]?, any?] = [];
    backupData.roles.forEach((roleData) => {
        if (roleData.isEveryone) {
            rolePromises.push([
                guild.roles.cache.get(guild.id),
                'edit',
                {
                    name: roleData.name,
                    color: roleData.color,
                    //permissions: roleData.permissions,
                    permissions: BigInt(roleData.permissions),
                    mentionable: roleData.mentionable
                }
            ]);
        } else {
            rolePromises.push([
                guild.roles,
                'create',
                {
                    data: {
                        name: roleData.name,
                        color: roleData.color,
                        hoist: roleData.hoist,
                        //permissions: roleData.permissions,
                        permissions: BigInt(roleData.permissions),
                        mentionable: roleData.mentionable
                    }
                }
            ]);
        }
    });
    return rateLimitManager.resolver(rolePromises);
};

/**
 * Restore the guild channels
 */
export const loadChannels = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager,
    options: LoadOptions
): Promise<unknown[]> => {
    const loadChannelPromises: [Promise<void | unknown>[]?, any[]?] = [];
    backupData.channels.categories.forEach((categoryData) => {
        loadChannelPromises.push([
            async () =>
                await new Promise((resolve) => {
                    loadCategory(categoryData, guild, rateLimitManager).then((createdCategory) => {
                        categoryData.children.forEach((channelData) => {
                            loadChannel(channelData, guild, createdCategory, options, rateLimitManager);
                            resolve(true);
                        });
                    });
                }),
            null
        ]);
    });
    backupData.channels.others.forEach((channelData) => {
        loadChannelPromises.push([loadChannel, null, channelData, guild, null, options]);
    });
    return rateLimitManager.resolver(loadChannelPromises);
};

/**
 * Restore the afk configuration
 */
export const loadAFK = (guild: Guild, backupData: BackupData, rateLimitManager: RateLimitManager): Promise<Guild[]> => {
    const afkPromises: [Promise<Guild>[]?, any[]?] = [];
    if (backupData.afk) {
        afkPromises.push([guild, 'setAFKChannel', guild.channels.cache.find((ch) => ch.name === backupData.afk.name && ch.type === ChannelType.GuildVoice) as VoiceChannel]);
        afkPromises.push([guild, 'setAFKTimeout', backupData.afk.timeout]);
    }
    /* Original upgrade for v3.0.1
    if (backupData.afk) {
        afkPromises.push(guild.setAFKChannel(guild.channels.cache.find((ch) => ch.name === backupData.afk.name && ch.type === ChannelType.GuildVoice) as VoiceChannel));
        afkPromises.push(guild.setAFKTimeout(backupData.afk.timeout));
    }
    */
    return rateLimitManager.resolver(afkPromises);
};

/**
 * Restore guild emojis
 */
export const loadEmojis = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager
): Promise<Emoji[]> => {
    const emojiPromises: [Promise<Emoji>[]?, any[]?] = [];
    backupData.emojis.forEach((emoji) => {
        if (emoji.url) {
            //emojiPromises.push([guild.emojis, 'create', { attachment: emoji.url, name: emoji.name }]);
            emojiPromises.push([guild.emojis, 'create', { name: emoji.name, attachment: emoji.url }]);
        } else if (emoji.base64) {
            emojiPromises.push([
                guild.emojis,
                'create',
                { name: emoji.name, attachment: Buffer.from(emoji.base64, 'base64') }
            ]);
        }
    });
    return rateLimitManager.resolver(emojiPromises);
};

/**
 * Restore guild bans
 */
export const loadBans = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager
): Promise<string[]> => {
    const banPromises: [Promise<string>[]?, any[]?] = [];
    backupData.bans.forEach((ban) => {
        banPromises.push([
            guild.members,
            'ban',
            ban.id,
            {
                reason: ban.reason
            } 
        ]) // as Promise<string>
    });
    return rateLimitManager.resolver(banPromises);
};

/**
 * Restore embedChannel configuration
 */
export const loadEmbedChannel = (
    guild: Guild,
    backupData: BackupData,
    rateLimitManager: RateLimitManager
): Promise<Guild[]> => {
    const embedChannelPromises: [Promise<Guild>[]?, any?] = [];
    if (backupData.widget.channel) {
        embedChannelPromises.push([
            guild,
            //'setWidget',
            'setWidgetSettings',
            {
                enabled: backupData.widget.enabled,
                channel: guild.channels.cache.find((ch) => ch.name === backupData.widget.channel) as NewsChannel | TextChannel | ForumChannel | VoiceBasedChannel
            }
        ]);
    }
    return rateLimitManager.resolver(embedChannelPromises);
};
