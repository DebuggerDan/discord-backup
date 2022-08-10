import { Embed, BufferResolvable } from 'discord.js';

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: Embed[];
    files?: { attachment: BufferResolvable; name: string; description?: string }[];
    pinned?: boolean;
}
