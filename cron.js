const cron = require("node-cron");
const { MessageEmbed } = require('discord.js');
const Promise = require('bluebird');
const { default: axios } = require("axios");

let client;
let lastRes = {};
function init(_client) {
    client = _client;
}

function fetchStats() {
    return new Promise(async (resolve, reject) => {
        try{
            let magicEdenRes = await axios.get('https://api-mainnet.magiceden.dev/v2/collections/rumblemonkeys/stats');
            return resolve(magicEdenRes.data);
        }
        catch(err) {
            return reject(err);
        }
    });
}

function startCron() {
    let task = cron.schedule('*/3 * * * * *', async () => {
        try{
            let fetchStatsRes = await fetchStats();
            if(fetchStatsRes.floorPrice!==lastRes.floorPrice || fetchStatsRes.listedCount!== lastRes.listedCount) {
                lastRes = fetchStatsRes;
                const msgEmb = new MessageEmbed()
                        .setColor('RANDOM')
                        .setTitle('Rumble Monkeys Floor Price')
                        .setURL('https://magiceden.io/marketplace/rumblemonkeys')
                        .setThumbnail('https://creator-hub-prod.s3.us-east-2.amazonaws.com/rumblemonkeys_pfp_1651079542821.png')
                        .addFields(
                            { name: 'Floor', value: (fetchStatsRes.floorPrice/1000000000).toString().substring(0,7), inline: true },
                            { name: 'Total Volume', value: (fetchStatsRes.volumeAll/1000000000).toString().substring(0,7), inline: true },
                            { name: 'Avg Sale Price 24H', value: (fetchStatsRes.avgPrice24hr/1000000000).toString().substring(0,7), inline: true },
                            { name: 'Total Listed Count', value: (fetchStatsRes.listedCount).toString(), inline: true },
                            
                        )
                        .setTimestamp()
                        .setFooter({text:'Rolling with the punches on Solana!',iconURL: 'https://www.rumblemonkeys.io/'});
                if(process.env.CHANNEL_ID){
                    try{
                        client.channels.cache.get(process.env.CHANNEL_ID).send({ embeds: [msgEmb] });
                    }
                    catch(err) {
                        console.log(err);
                    }
                }
            }
            else{
                console.log(JSON.stringify(fetchStatsRes));
            }
        }
        catch(err) {
            console.log(err);
        }
    });
}

module.exports = {
    init,
    startCron
}