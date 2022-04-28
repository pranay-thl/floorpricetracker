const cron = require("node-cron");
const { MessageEmbed } = require('discord.js');
const Promise = require('bluebird');
const { default: axios } = require("axios");

const FP_CHANNEL='723230380228083775';
const SALE_CHANNEL='723230380228083775';

let client;
let lastRes = {};
let lastSale;
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

function fetchSales() {
    return new Promise(async (resolve, reject) => {
        try{
            //let url = `https://api-mainnet.magiceden.io/rpc/getGlobalActivitiesByQuery`;
            //let params = {q: `{"$match":{"txType":{"$in":["exchange","acceptBid","auctionSettled"]},"collection_symbol":"rumblemonkeys"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0, "$limit":1}`}
            let url = `https://api-mainnet.magiceden.dev/rpc/getGlobalActivitiesByQuery?q={"$match":{"txType":{"$in":["exchange","acceptBid","auctionSettled"]},"collection_symbol":"rumblemonkeys"},"$sort":{"blockTime":-1,"createdAt":-1},"$skip":0, "$limit":1}`;
            let magicEdenRes = await axios.get(url);
            return resolve(magicEdenRes.data.results[0]);
        }
        catch(err) {
            return reject(err);
        }
    });
}

function startCron() {
    let task = cron.schedule('*/10 * * * * *', async () => {
        try{
            let fetchStatsRes = await fetchStats();
            if(fetchStatsRes.floorPrice!==lastRes.floorPrice || fetchStatsRes.listedCount!== lastRes.listedCount) {
                if(lastRes) {
                    let color = "RANDOM";
                    if(fetchStatsRes.floorPrice>lastRes.floorPrice) {
                        color = "GREEN";
                    }
                    else if(fetchStatsRes.floorPrice==lastRes.floorPrice) {
                        color = "WHITE";
                    }
                    else{
                        color = "RED";
                    }
                    const msgEmb = new MessageEmbed()
                            .setColor(color)
                            .setTitle('Rumble Monkeys Floor Price')
                            .setURL('https://magiceden.io/marketplace/rumblemonkeys')
                            .setThumbnail('https://creator-hub-prod.s3.us-east-2.amazonaws.com/rumblemonkeys_pfp_1651079542821.png')
                            .addFields(
                                { name: 'Floor', value: '`'+(fetchStatsRes.floorPrice/1000000000).toString().substring(0,7)+'`', inline: true },
                                { name: 'Total Volume', value: '`'+(fetchStatsRes.volumeAll/1000000000).toString().substring(0,7)+'`', inline: true },
                                { name: 'Avg Sale Price 24H', value: '`'+(fetchStatsRes.avgPrice24hr/1000000000).toString().substring(0,7)+'`', inline: true },
                                { name: 'Total Listed Count', value: '`'+(fetchStatsRes.listedCount).toString()+'`', inline: true },
                                
                            )
                            .setTimestamp()
                            .setFooter({text:'Rolling with the punches on Solana!',iconURL: 'https://creator-hub-prod.s3.us-east-2.amazonaws.com/rumblemonkeys_pfp_1651079542821.png'});
                        try{
                            client.channels.cache.get(FP_CHANNEL).send({ embeds: [msgEmb] });
                        }
                        catch(err) {
                            console.log(err);
                        }
                }
                lastRes = fetchStatsRes;
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

function startCronSales() {
    let task = cron.schedule('*/10 * * * * *', async () => {
        try{
            let fetchSalesRes = await fetchSales();
            if(fetchSalesRes._id!==lastSale) {
                if(lastRes) {
                    const msgEmb = new MessageEmbed()
                        .setColor('RANDOM')
                        .setTitle(fetchSalesRes.mintObject.title)
                        .setURL('https://magiceden.io/item-details/'+fetchSalesRes.mint)
                        .setThumbnail('https://creator-hub-prod.s3.us-east-2.amazonaws.com/rumblemonkeys_pfp_1651079542821.png')
                        .addFields(
                            {name: 'Sell Price', value: '`'+(fetchSalesRes.parsedTransaction.total_amount/1000000000).toString()+'`'},
                            {name: 'Buyer', value: '`'+fetchSalesRes.buyer_address+'`'},
                            {name: 'Seller', value: '`'+fetchSalesRes.seller_address+'`'},
                            {name: 'Txn ID', value: '['+fetchSalesRes.transaction_id+'](https://solscan.io/tx/'+fetchSalesRes.transaction_id+')'},
                        )
                        .setImage(fetchSalesRes.mintObject.img)
                        .setTimestamp()
                        .setFooter({text:'Rolling with the punches on Solana!',iconURL: 'https://creator-hub-prod.s3.us-east-2.amazonaws.com/rumblemonkeys_pfp_1651079542821.png'});
                    try{
                        client.channels.cache.get(SALE_CHANNEL).send({ embeds: [msgEmb] });
                    }
                    catch(err) {
                        console.log(err);
                    }
                }   
                lastSale = fetchSalesRes._id;
            }
            else{
                console.log(JSON.stringify(fetchSalesRes));
            }
        }
        catch(err) {
            console.log(err);
        }
    });
}

module.exports = {
    init,
    startCron,
    startCronSales
}