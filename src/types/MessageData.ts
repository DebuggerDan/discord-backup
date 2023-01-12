// import { Embed, BufferResolvable } from 'discord.js';
import { APIEmbed } from 'discord.js';

export interface MessageData {
    username: string;
    avatar?: string;
    content?: string;
    embeds?: APIEmbed[];
    //files?: { attachment: BufferResolvable; name: string; description?: string }[];
    files?: {
        name: string;
        attachment: string;
    }[];
    pinned?: boolean;
    sentAt?: string;
}
