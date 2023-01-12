import { MessageMentionOptions } from "discord.js";

export interface LoadOptions {
    clearGuildBeforeRestore: boolean;
    maxMessagesPerChannel?: number;
    allowedMentions?: MessageMentionOptions;
    //disableWebhookMentions?: 'none' | 'all' | 'everyone';
    mode?: string | number;
}
