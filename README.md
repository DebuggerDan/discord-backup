# Discord Backup

[![downloadsBadge](https://img.shields.io/npm/dt/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)
[![versionBadge](https://img.shields.io/npm/v/discord-backup?style=for-the-badge)](https://npmjs.com/discord-backup)
[![patreonBadge](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2FAndroz2091%2Fpledges&style=for-the-badge)](https://patreon.com/Androz2091)

**Note**: this module uses recent discordjs features and requires discord.js version 12.

Discord Backup is a powerful [Node.js](https://nodejs.org) module that allows you to easily manage discord server backups.

* Unlimited backups!
* Backup creation takes less than 10 seconds!
* Even restores messages with webhooks!
* And restores everything that is possible to restore (channels, roles, permissions, bans, emojis, name, icon, and more!)

## Changelog

* Supports base64 for emojis/icon/banner backup
* New option to save backups in your own database
* `backup#delete()` removed in favor of `backup#remove()`

## Installation

```js
npm install --save discord-backup
```

## Examples

You can read this example bot on Github: [backups-bot](https://github.com/Androz2091/backups-bot)

### Create

Create a backup for the server specified in the parameters!

```js
/**
 * @param {Guild} [Guild] - The discord server you want to backup
 * @param {object} [options] - The backup options
 */

const backup = require("discord-backup");
backup.create(Guild, options).then((backupData) => {
    console.log(backupData.id); // NSJH2
});
```

Click [here](#create-advanced) to learn more about **backup options**.

### Load

Allows you to load a backup on a Discord server!

```js
/**
 * @param {string} [backupID] - The ID of the backup that you want to load
 * @param {Guild} [Guild] - The discord server on which you want to load the backup
 */

const backup = require("discord-backup");
backup.load(backupID, Guild).then(() => {
    backup.remove(backupID); // When the backup is loaded, it's recommended to delete it
});
```

### Fetch

Fetches information from a backup

```js
/**
 * @param {string} [backupID] - The ID of the backup to fetch
 */

const backup = require("discord-backup");
backup.fetch(backupID).then((backupInfos) => {
    console.log(backupInfos);
    /*
    {
        id: "BC5qo",
        size: 0.05
        data: {BackupData}
    }
    */
});
```

### Remove

**Warn**: once the backup is removed, it is impossible to recover it!

```js
/**
 * @param {string} [backupID] - The ID of the backup to remove
 */

const backup = require("discord-backup");
backup.remove(backupID);
```

### List

**Note**: `backup#list()` simply returns an array of IDs, you must fetch the ID to get complete information.

```js
const backup = require("discord-backup");
backup.list().then((backups) => {
    console.log(backups); // Expected Output [ "BC5qo", "Jdo91", ...]
});
```

### SetStorageFolder

Updates the storage folder to another

```js
const backup = require("discord-backup");
backup.setStorageFolder(__dirname+"/backups/");
await backup.create(guild); // Backup created in ./backups/
backup.setStorageFolder(__dirname+"/my-backups/");
await backup.create(guild); // Backup created in ./my-backups/
```

## Advanced usage

### Create [advanced]

You can use more options for backup creation:

```js
const backup = require("discord-backup");
backup.create(guild, {
    maxMessagesPerChannel: 10,
    jsonSave: false,
    jsonBeautify: true,
    includeName: true,
    doNotBackup: [ "roles",  "channels", "emojis", "bans" ],
    saveImages: "base64"
});
```

**maxMessagesPerChannel**: Maximum of messages to save in each channel. "0" won't save any messages.  
**jsonSave**: Whether to save the backup into a json file. You will have to save the backup data in your own db to load it later.  
**jsonBeautify**: Whether you want your json backup pretty formatted.  
**includeName**: Include the name of the discord server, overwriting the name of the server where the backup is loaded.  
**doNotBackup**: Things you don't want to backup. Available items are: `roles`, `channels`, `emojis`, `bans`.  
**saveImages**: How to save images like guild icon and emojis. Set to "url" by default, restoration may not work if the old server is deleted. So, `url` is recommended if you want to clone a server (or if you need very light backups), and `base64` if you want to backup a server. Save images as base64 creates heavier backups.

### Load [advanced]

As you can see, you're able to load a backup from your own data instead of from an ID:

```js
const backup = require("discord-backup");
backup.load(backupData, guild, {
    clearGuildBeforeRestore: true,
    mode: 'slow', // 'fast', 'auto', 750,
});
```

**clearGuildBeforeRestore**: Whether to clear the guild (roles, channels, etc... will be deleted) before the backup restoration (recommended).  
**maxMessagesPerChannel**: Maximum of messages to restore in each channel. "0" won't restore any messages.  
**removeLoadedBackup**: If true, remove the loaded backup from the filesystem.
**mode**: Speed of execute request in miliseconds or string(slow, fast, or auto), the faster it is, the greater the risk of ratelimit, (slow: 1.5s | fast: 0.25s | auto: 0.75s)

## Example Bot

#### config.json
```json
{
  "TOKEN": "INSERT-TOKEN-HERE",
  "PREFIX": "b!",
  "create": {
    "includeName": false
  },
  "load": {
    "removeLoadedBackup": false,
    "maxMessagesPerChannel": 100
  }
}
```

#### main.js
```js
// Load modules
const {
    Client,
    GatewayIntentBits,
    MessageEmbed,
    PermissionsBitField
  } = require("discord.js"),
  backup = require("discord-backup"),
  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent
    ]
  }),
  config = require("./config.json"),
  settings = {
    prefix: config.PREFIX,
    token: config.TOKEN
  };
backup.setStorageFolder(__dirname + "/backups/");

client.on("ready", () => {
  console.log(
    "I'm ready! Invite me to your server by clicking this link:",
    `https://discord.com/api/oauth2/authorize?client_id=${client.application.id}&permissions=8&scope=bot`
  );
});

client.on("messageCreate", async message => {
  // This reads the first part of your message behind your prefix to see which command you want to use.
  let command = message.content
    .toLowerCase()
    .slice(settings.prefix.length)
    .split(" ")[0];

  // These are the arguments behind the commands.
  let args = message.content.split(" ").slice(1);

  // If the message does not start with your prefix return.
  // If the user that types a message is a bot account return.
  // If the command comes from DM return.
  if (
    !message.content.startsWith(settings.prefix) ||
    message.author.bot ||
    !message.guild
  ) {
    return;
  }

  if (command === "create") {
    // Check member permissions
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.channel.send(
        ":x: | You must be an administrator of this server to request a backup!"
      );
    }
    // Create the backup
    backup
      .create(message.guild, {
        jsonBeautify: true,
        includeName: config.create.includeName
      })
      .then(backupData => {
        // And send informations to the backup owner
        message.author.send(
          "The backup has been created! To load it, type this command on the server of your choice: `" +
            settings.prefix +
            "load " +
            backupData.id +
            "`!"
        );
        message.channel.send(
          ":white_check_mark: Backup successfully created. The backup ID was sent in dm!"
        );
      });
  }

  if (command === "load") {
    // Check member permissions
    if (
      !message.member.permissions.has(PermissionsBitField.Flags.Administrator)
    ) {
      return message.channel.send(
        ":x: | You must be an administrator of this server to load a backup!"
      );
    }
    let backupID = args[0];
    if (!backupID) {
      return message.channel.send(":x: | You must specify a valid backup ID!");
    }
    // Fetching the backup to know if it exists
    backup
      .fetch(backupID)
      .then(async () => {
        // Do not clear before restore
        const clearGuildBeforeRestore = false;
        // If the backup exists, request for confirmation
        if (clearGuildBeforeRestore) {
          message.channel.send(
            ":warning: | When the backup is loaded, all the channels, roles, etc. will be replaced! Type `-confirm` to confirm!"
          );
          await message.channel
            .awaitMessages(
              m =>
                m.author.id === message.author.id && m.content === "-confirm",
              {
                max: 1,
                time: 20000,
                errors: ["time"]
              }
            )
            .catch(err => {
              // if the author of the commands does not confirm the backup loading
              return message.channel.send(
                ":x: | Time's up! Cancelled backup loading!"
              );
            });
          // When the author of the command has confirmed that he wants to load the backup on his server
        }
        message.author.send(":white_check_mark: | Start loading the backup!");
        // Load the backup
        backup
          .load(backupID, message.guild, {
            clearGuildBeforeRestore,
            maxMessagesPerChannel: config.load.maxMessagesPerChannel,
            mode: 2000 // 2 seconds per event
          })
          .then(() => {
            // When the backup is loaded, delete them from the server
            if (config.load.removeLoadedBackup) {
              backup.remove(backupID);
            }
          })
          .catch(err => {
            // If an error occurred
            return message.author.send(
              ":x: | Sorry, an error occurred... Please check that I have administrator permissions!"
            );
          });
      })
      .catch(err => {
        console.log(err);
        // if the backup wasn't found
        return message.channel.send(
          ":x: | No backup found for `" + backupID + "`!"
        );
      });
  }

  if (command === "infos") {
    let backupID = args[0];
    if (!backupID) {
      return message.channel.send(":x: | You must specify a valid backup ID!");
    }
    // Fetch the backup
    backup
      .fetch(backupID)
      .then(backupInfos => {
        const date = new Date(backupInfos.data.createdTimestamp);
        const yyyy = date.getFullYear().toString(),
          mm = (date.getMonth() + 1).toString(),
          dd = date.getDate().toString();
        const formatedDate = `${yyyy}/${mm[1] ? mm : "0" + mm[0]}/${
          dd[1] ? dd : "0" + dd[0]
        }`;
        let embed = new MessageEmbed()
          .setAuthor("Backup Informations")
          // Display the backup ID
          .addField("Backup ID", backupInfos.id, false)
          // Displays the server from which this backup comes
          .addField("Server ID", backupInfos.data.guildID, false)
          // Display the size (in mb) of the backup
          .addField("Size", `${backupInfos.size} kb`, false)
          // Display when the backup was created
          .addField("Created at", formatedDate, false)
          .setColor("#FF0000");
        message.channel.send(embed);
      })
      .catch(err => {
        // if the backup wasn't found
        return message.channel.send(
          ":x: | No backup found for `" + backupID + "`!"
        );
      });
  }
});

//Your secret token to log the bot in. (never share this to anyone!)
client.login(settings.token);
```

## Restored things

Here are all things that can be restored with `discord-backup`:  

* Server icon  
* Server banner  
* Server region  
* Server splash  
* Server verification level  
* Server explicit content filter  
* Server default message notifications  
* Server embed channel  
* Server bans (with reasons)  
* Server emojis  
* Server AFK (channel and timeout)  
* Server channels (with permissions, type, nsfw, messages, etc...)  
* Server roles (with permissions, color, etc...)

Example of things that can't be restored:

* Server logs  
* Server invitations  
* Server vanity url
