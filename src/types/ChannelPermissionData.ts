import { PermissionResolvable } from 'discord.js';

export interface ChannelPermissionsData {
    roleName: string;
    allow: PermissionResolvable;
    deny: PermissionResolvable;
}
