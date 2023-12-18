import { fileURLToPath } from "url";
import fs from "fs";
import path from "path";
import * as CONSTANT from './Constant.js'
import { getMarketDetails } from "./ApiInfo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const suddenFall_FilePath = path.join(__dirname, "/fs/sudden-fall.json");
const shortTerm_FilePath = path.join(__dirname, "/fs/short-term.json");
const misc_FilePath = path.join(__dirname, "/fs/misc.json");

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