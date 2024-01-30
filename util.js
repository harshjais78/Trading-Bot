import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import * as CONSTANT from './Constant.js'
import { getMarketDetails } from "./ApiInfo.js";
import { sendLogs } from "./firebase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const suddenFall_FilePath = path.join(__dirname, "/fs/sudden-fall.json");
const shortTerm_FilePath = path.join(__dirname, "/fs/short-term.json");
const misc_FilePath = path.join(__dirname, "/fs/misc.json");
const priceHistory_FilePath = path.join(__dirname, "/fs/priceHistory.json");

export function timestampToDay(timestamp) {
    const date = new Date(timestamp);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are 0-indexed, so we add 1
    const year = date.getFullYear();
  
    return `${day}-${month}-${year}`;
  }

  export function timestampDaysBack(x_day_back){
    const currentTimeStamp = Date.now();
    const xDaysInMillis = x_day_back * 24 * 60 * 60 * 1000;
    return currentTimeStamp - xDaysInMillis;
  }

  export function averagePrice(jsonData){ 
  const latestThreeData = jsonData.slice(0, 3);

  // Calculate the sum of (high - low) for each data point
  const sumHighLow = latestThreeData.reduce((sum, data) => sum + (data.close - data.open)/2.0, 0);
  
  // Calculate the average
  const averageHighLow = sumHighLow / latestThreeData.length; //>0 then profit 
  return averageHighLow ;
  }

  export function convertPairIntoCoindcxName(pair){
    pair=pair.substring(2);
    pair=pair.replace('_','');
    return pair;
  }

  export function generateClientOrderId(coinName){
    let timestamp = new Date().getTime();
    return timestamp+coinName;
  }

  export function generateLossOrderId(coinName){
    let timestamp = new Date().getTime();
    return coinName+timestamp+'loss';
  }

  export async function getStoredJson(type) {
    try {
      let filePath=shortTerm_FilePath;
      if(type==CONSTANT.suddenFall)
      filePath=suddenFall_FilePath;
     else if (type==CONSTANT.priceHistory)
      filePath = priceHistory_FilePath;

      const data = await fs.promises.readFile(filePath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error(err);
      return {}; // Return an empty object or handle the error as needed
    }
  }
  
  export async function saveResults(results,type) {
    const json = JSON.stringify(results, null, 2);

    let filePath=shortTerm_FilePath;
    if(type==CONSTANT.suddenFall)
    filePath=suddenFall_FilePath;

    fs.promises
      .writeFile(filePath, json)
      .then(() => {
        console.log("Results saved successfully.");
      })
      .catch((err) => {
        console.error("Error saving poll results:", err);
      });
  }


  export async function getMiscData() {
    try {
      const data = await fs.promises.readFile(misc_FilePath, "utf8");
      return JSON.parse(data);
    } catch (err) {
      console.error(err);
      return {}; // Return an empty object or handle the error as needed
    }
  }

  export async function saveMiscResults(results) {
    const json = JSON.stringify(results, null, 2);

    fs.promises
      .writeFile(misc_FilePath, json)
      .then(() => {
        console.log("Misc results saved successfully.");
      })
      .catch((err) => {
        console.error("Error saving poll results:", err);
      });
  }


  export async function moveOrderIdToSell(orderId,type) {
    let data=await getStoredJson(type);
    let newData=data;
    let buy=[];
  
    if(data.coin.buy.includes(orderId))
    newData.order_id.buy =newData.order_id.buy.filter(item=> item !==orderId);

  
    newData.order_id.sell.push(orderId);
    saveResults(newData,type);
  }

  export function daysPassedSince(dateString) {
    const millisecondsPerDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    const targetDate = new Date(dateString);
    
    const timeDifference = Date.now() - targetDate.getTime();
    const daysPassed = Math.floor(timeDifference / millisecondsPerDay);
    
    return daysPassed;
  }

  export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  export async function buildPair() {
    try {
      let marketDetails = await getMarketDetails();
  
      // Convert marketDetails array to an object with symbol as keys
      const pairsObject = marketDetails.reduce((accumulator, item) => {
        accumulator[item.symbol] = item.pair;
        return accumulator;
      }, {});
  
      // Convert the object to JSON string
      const jsonString = JSON.stringify(pairsObject, null, 2);
  
      // Write the JSON string to a file named 'pairs.json'
      fs.writeFileSync('pairs.json', jsonString);
  
      console.log('Pairs information has been saved to pairs.json');
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }

  export function getPair(symbol) {
    try {
      const fileContent = fs.readFileSync('pairs.json', 'utf8');
        const pairsObject = JSON.parse(fileContent);
  
      // Check if the symbol exists in the object
      if (symbol in pairsObject) {
        return pairsObject[symbol];
      } 
    } catch (error) {
      console.error('An error occurred:', error);
      return 'Error retrieving pair information';
    }
  }


  const MAX_COIN_HISTORY = 140; 
 export const PRICE_HISTORY_FILE = path.join(__dirname, "/fs/priceHistory.json");

export async function updatePriceHistory(coinsData) {
    try {
        console.log('updatePriceHistory');
        if (!coinsData || !Array.isArray(coinsData)) {
            console.log('Invalid input data. Expected a JSON array.');
            return;
        }

        // Read current prices from the local file
        let currentPrices = {};
        try {
          const filePath = path.resolve(__dirname, PRICE_HISTORY_FILE);
          const fileData = await fs.promises.readFile(filePath, 'utf-8');
            currentPrices = JSON.parse(fileData);
        } catch (error) {
            console.log('Error reading Price History file:', error);
        }

        // Update coin prices with the new data
        coinsData.forEach((coin) => {
            const { market, last_price } = coin;

            if (market && last_price !== undefined) {
                // Initialize an array for the coin if it doesn't exist
                if (!currentPrices[market]) {
                    currentPrices[market] = [];
                }

                // Append the new price to the array
                currentPrices[market].push(last_price);

                // Ensure the array does not exceed the maximum length
                if (currentPrices[market].length > MAX_COIN_HISTORY) {
                    currentPrices[market].shift(); // Remove the oldest entry
                }
            }
        });

        // Write the updated prices to the local file
        try {
            const filePath = path.resolve(__dirname, PRICE_HISTORY_FILE);
            await fs.promises.writeFile(filePath, JSON.stringify(currentPrices, null, 2), 'utf-8');
        } catch (error) {
            console.error('Error storing Price History:', error);
        }
    } catch (error) {
        console.error('Error:', error);
        sendLogs('Failed to updatePriceHistory. Error: ' + error.message);

    }
}

export async function getPriceHistory(market) {
    try {
        market = market.toUpperCase();

        // Read price history from the local file
        const filePath = path.resolve(__dirname, PRICE_HISTORY_FILE);
        const fileData = await fs.promises.readFile(filePath, 'utf-8');
        const priceHistory = JSON.parse(fileData)[market];

        // Return the price history array
        return priceHistory ? priceHistory.map(str => parseFloat(str)) : [];
    } catch (error) {
        console.error('Error:', error);
        // Handle errors appropriately (e.g., throw an error, return a default value)
        sendLogs('Failed to retrieve price history. Error: ' + error.message);
    }
}

export let flatCoins = [];
export async function updateFlatCoinsList() {
  let priceHistoryList;
  while (!priceHistoryList) {
    try {
      // Read price history from the local file
      const filePath = path.resolve(__dirname, PRICE_HISTORY_FILE);
      const fileData = await fs.promises.readFile(filePath, "utf-8");
      priceHistoryList = JSON.parse(fileData);
    } catch (error) {
      console.error("Error:", error);
      sendLogs(
        "Failed to retrieve price history in updateFlatCoinsList. Error: " +
          error.message
      );
      await sleep(1000); //avoiding race condition
    }
  }

  for (const symbol in priceHistoryList) {
    try{
   
    let priceHistory=  priceHistoryList[symbol];
      // console.log(`Key: ${symbol}, Value: ${JSON.stringify(priceHistory)}`);
      priceHistory = priceHistory.slice(0,-12);
      
      if(priceHistory && priceHistory.length > 6){
        let temp=priceHistory[0];
    
        for(let i=1; i<priceHistory.length; i++){
          if( ( (Math.abs(temp - priceHistory[i]) * 100 )/ Math.min(temp,priceHistory[i])) > 4.1 ){
           continue;
          }
        temp = priceHistory[i];
      }

       priceHistory.sort((a, b) => b - a); // desc remember original array is modified.
       if( priceHistory.length > 49 && ((0.12 * priceHistory[50]) + priceHistory[50] ) < priceHistory[0]) {  // max till now should be lesser 15%
        continue;
      }
    
      flatCoins.push(symbol)
    }
    } catch (error) {sendLogs( `${prefix(id)} Catch error in updateFlatCoinsList: ${error}` );}    
    }

 

}