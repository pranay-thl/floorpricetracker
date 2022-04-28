const { Client, Intents} = require('discord.js');
const dotenv = require('dotenv');
const cron = require('./cron');

dotenv.config();
const TOKEN = process.env['TOKEN'];

const client = new Client({
    //fetchAllMembers: true,
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MEMBERS, Intents.FLAGS.GUILD_PRESENCES]
});

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    cron.init(client);
    cron.startCron();
});

client.login(TOKEN);