import { getCandleChart,getMarketDetails,getTicker } from "./ApiInfo.js";
import { sendEmail } from "./Email.js";
import fetch from 'node-fetch'; 
import { sendLogs } from "./firebase.js";
import { getPair, sleep,getPriceHistory, flatCoins, PRICE_HISTORY_FILE } from "./util.js";
import * as CONSTANT from './Constant.js'
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function slowRiseBuyCheck(coinsArray,_id) {
  try{
  let id = _id;
  let flatCoinsArray=flatCoins;
  let priceHistory;
  if(flatCoinsArray.length > 0 && coinsArray.length > 0){
    while( !priceHistory){
      try {
        // Read price history from the local file
        const filePath = path.resolve(__dirname, PRICE_HISTORY_FILE);
        const fileData = await fs.promises.readFile(filePath, "utf-8");
        priceHistory = JSON.parse(fileData);
      } catch (error) {
        console.error("Error:", error);
        sendLogs(
          "Failed to retrieve price history in slowRiseBuyCheck. Error: " +
            error.message
        );
        await sleep(1000); //avoiding race condition
      }
    }
    for(coin in coinsArray){
      let symbol=coin.symbol;
      if(flatCoinsArray.includes(symbol)){
        
      if( !is0volume(coin)){
       let priceBefore = priceHistory[symbol]; 
       if(priceBefore){
        let priceAtSomePoint = priceBefore[priceBefore - 17];
        if(coin.currentPrice > priceAtSomePoint + (0.15 * priceAtSomePoint)){
          sendLogs(`${prefix(id)}  +++++ virtual Coin: ${coinsWithHike[i].symbol} bought at ${coinsWithHike[i].currentPrice} with slowRiseAlgo. Preparing to sell`)
          targetSell(coin,id,4);
        }
        }
      }
    }
    }
  }
}catch(error){
  sendLogs(`${prefix(id)} Error in slowRise, slowRiseBuyCheck: error: ${error.message}`);
}
}



async function targetSell(coinsWithHike, id, targetProfit){
  try {
    sendLogs(`${prefix(id)} targetSell: `);
  const boughtPrice=coinsWithHike.currentPrice;
  const symbol=coinsWithHike.symbol;

  let cnt = 0;
  let maxLossAccepted = -10;



  // Fetch ticker data every 3 seconds
  const intervalId = setInterval(async () => {
    try {
      const tickerData = await getTicker(symbol);
      let currentPrice;
      cnt++;

      if (!tickerData) {
        console.error(`Ticker data not available for ${symbol}`);
        return;
      }

      // run at every 3 seconds
      tickerData.forEach((currentTicker)=> {
        if(currentTicker.market == symbol){
         currentPrice = parseFloat(currentTicker.last_price);
        return;
      }
      });

      if (currentPrice != undefined) {

          const percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;
      
            if((percentageEarned >= targetProfit || percentageEarned < maxLossAccepted) ){  // Extreme case.

               sendLogs(`${prefix(id)} inside targetSell: targetProfit: ${targetProfit} percentageEarned: ${percentageEarned}`); 
               sell(id,symbol,boughtPrice,currentPrice,"",percentageEarned,'','',cnt);
               clearInterval(intervalId);
             }          
            sendLogs(`${prefix(_id)} trying to sell coin: ${symbol} with target: ${targetProfit} cnt: ${cnt} current price: ${currentPrice} Percentage Earned: ${percentageEarned.toFixed(3)}`);
      }

    } catch (error) {
      console.error('An error occurred:', error);
      sendLogs(`${prefix(id)} error in targetSell function inside scheduler: ${error.message}`);
    }
  }, 3000); // 3 seconds in milliseconds
}catch (error) {
  console.log('An error occurred:', error);
  sendLogs(`${prefix(id)} error in targetSell function: ${error.message}`);

}
}



export function getTime() {
  const nowUTC = new Date(); // Current UTC time
  const now = new Date(new Date(nowUTC.getTime() + (5 * 60 + 30) * 60000)); // Adding 5 hours and 30 minutes);

  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');
  const seconds = now.getUTCSeconds().toString().padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
}

async function is0volume(coinToMonitor) {
  try{
  const symbol=coinToMonitor.symbol;
  let pair=getPair(symbol);
  if( ! pair)
  return true;

  let lastCandles=await getLastCandles(pair);
  lastCandles=lastCandles.slice(0,50);

  let cnt=0;
  for(const coinDetails of lastCandles){
    if(coinDetails.volume == 0){
      return true;
    }
  }
}catch(error){
  sendLogs(`${prefix(id)} Error in slowRise, is0Volume: error: ${error.message}`);
}
return false;

}

async function getLastCandles(coinName){    
    return fetch(CONSTANT.publicbaseurl + `/market_data/candles?pair=${coinName}&interval=1m`)
      .then(response => response.json())
      .catch(error => {
        console.error('An error occurred:', error);
        throw error; 
      });
}

function sell(id,symbol,boughtPrice,currentPrice,maxPrice,percentageEarned,cntLoss,cntLossRestore,cnt){
  sendLogs(`${prefix(id)} SlowRise, For: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% cntLoss: ${cntLoss} cntLossRestore: ${cntLossRestore} cnt: ${cnt}`);
  console.log(`For coin: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice} Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
  sendLogs(`${prefix(id)} ----------------------------------------------------------`);
  sendEmail(`From SlowRise, for coin: ${symbol}, \nBought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% `)
 }

function prefix(id){
return `id: ${id} ${getTime()}: `;
}
