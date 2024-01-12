import { getCandleChart,getMarketDetails,getTicker } from "./ApiInfo.js";
import { sendEmail } from "./Email.js";
import fetch from 'node-fetch'; 
import {  startBuyCoinProcess} from "./trans.js";
import { sendLogs } from "./firebase.js";
import { getPair, sleep } from "./util.js";
import * as CONSTANT from './Constant.js'

/*
Target: Some coins suddenly increase by more than 100% or such in few hours/min.

Logic: target coins who have increased by more than @priceHikeThreshold in 10 minutes or combining prev 2 
candles of 10 min hike is more than 30% and also
make sure before buying coin that price have not started to decrease by more than 6%. If it is decreased 
don't buy otherwise buy immediately and sell.

Sell: bought coins should be sell in two ways
 1. If I have bought right coin at right time then most probably coin will increase more than 10%. So wait for 10% profit if predicted wrong then -11% loss.
 If coin is longer than 3 min bw -8 to -11 sell it.
2. greedy way @beGreedy().
In greedySell() function, idea is wait for coin to reach max price and as soon as it starts to decrease
sell it because coins which have hiked suddenly also decrease suddenly. Observed that they mostly follow
monotonic inc/dec. 

Remove:
Case 1: Where volume is 0. becuase it could have altered by huge investors and no chance to increase further.
case 2: If condition is met but price is not currently increasing.

*/



let id=0;

export async function coinHiked(ticker15minAgo,ticker20minAgo,lag1min,no) {
  console.log('coinHiked function called');
  id=no;
  if(ticker15minAgo == undefined) 
   return ;
  checkPriceHike(ticker15minAgo,ticker20minAgo,lag1min, true);
}


async function checkPriceHike(previousData,ticker20minAgo,lag1min, canCheckBranch) {
  try {
    const currentTicker = await getTicker();
    const priceHikeThreshold = 14; // Percentage threshold for considering a price hike
    const combineHikeThreshold = 16;
    const recheckThreshold = 8;
    let coinsWithHike = [];
    let coinsFailedHike = [];
    let prevChangePerc = 0;
    let price20minBack=0;
    let matched=true;

    currentTicker.forEach((currentCoin,idx) => {
      const symbol = currentCoin.market;
      const previousCoin=previousData[idx];
      // console.log(`previousData ${previousCoin}`);
      const previousPrice = parseFloat(previousCoin.last_price);

      if(symbol !==previousCoin.market)
      return;

      if(ticker20minAgo){
        let coin20minAgo = ticker20minAgo[idx];
        if(coin20minAgo.market == symbol ){
        let prev20minPrice = parseFloat(coin20minAgo.last_price);
        let prev10minDeltaPerc = ((previousPrice - prev20minPrice)/prev20minPrice) *100; 
        price20minBack = prev20minPrice;
        if(prev10minDeltaPerc >= 2) 
          prevChangePerc = prev10minDeltaPerc;
          else
          prevChangePerc = 0;

        }
        else{
          ticker20minAgo.forEach((coin20minAgo)=>{
            if(coin20minAgo.market == symbol){
            let prev20minPrice = parseFloat(coin20minAgo.last_price);
            let prev10minDeltaPerc = ((previousPrice - prev20minPrice)/prev20minPrice) *100; 
            price20minBack = prev20minPrice;
            if(prev10minDeltaPerc >= 2 ) 
              prevChangePerc = prev10minDeltaPerc;
              else
              prevChangePerc = 0;
            return;
          }

          })
          matched = false;
      }
        }
      // console.log(symbol, previousCoin.market)

      if (previousPrice) {
        const currentPrice = parseFloat(currentCoin.last_price);
        const priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
         // current should be increasing
         // sendLogs(`id: ${id} ${getTime()} current candle priceChangePercent: ${priceChangePercent}`);
         
         
        if (priceChangePercent >= priceHikeThreshold || ( priceChangePercent + prevChangePerc >= combineHikeThreshold && priceChangePercent > 1 )) { 
          coinsWithHike.push({
            symbol,
            priceChangePercent,
            combineChangePercent: (prevChangePerc+priceChangePercent),
            currentPrice,
            previousPrice,
            price20minBack,
          });
        }
        else if(priceChangePercent >= recheckThreshold && canCheckBranch ){
         canCheckBranch = false;
         setTimeout(() => {
         sendLogs(`id: ${id} ${getTime()} running after Timeout for coin: ${symbol}, price was: ${currentPrice}`);
          id= id+'#';
         checkPriceHike(previousData,ticker20minAgo,lag1min, false);
       }, 1000 * 30);
        }
        else{
          coinsFailedHike.push({
            symbol,
            curr10minDeltaPerc: priceChangePercent.toFixed(3),
            combineChangePercent: (prevChangePerc+priceChangePercent).toFixed(3),
            currentPrice,
            previousPrice,
            price20minBack,
          });
        }
      }

      price20minBack=0;
      prevChangePerc = 0;
    });

    if(!matched){
    sendLogs(`id: ${id} ${getTime()} current symbol doesnot match with prev20min symbol`);
      console.log(`id: ${id} not matched`);
  }else{
    sendLogs(`id: ${id} ${getTime()} matched`);
    console.log(`id: ${id}  matched`);
    }

    if(coinsWithHike.length > 0) {
    // Sort coins by price change percentage in descending order
    coinsWithHike.sort((a, b) => b.priceChangePercent - a.priceChangePercent);

    console.log(`id: ${id} ${getTime()}: Coins with Price Hike (>20%): ${JSON.stringify(coinsWithHike)}`);
    sendLogs(`id: ${id} ${getTime()}: Coins with Price Hike ***** (>${priceHikeThreshold}/${combineHikeThreshold}%): ${JSON.stringify(coinsWithHike)}`)

    for(let i = 0; i < coinsWithHike.length; i++){
      checkAndBuy(coinsWithHike,i);
     }
    }
    else{
      // send log for both type of comparisons
    coinsFailedHike.sort((a, b) => b.curr10minDeltaPerc - a.curr10minDeltaPerc);
    let coinsFailedHike2 = [...coinsFailedHike];
    coinsFailedHike2.sort((a, b) => b.combineChangePercent - a.combineChangePercent);

    console.log('No coin met the criteria of sudden hike')
    sendLogs(`id: ${id} ${getTime()}: No coin met the criteria of sudden hike`);
    sendLogs(`id: ${id} ${getTime()}: Max reached alone: ${JSON.stringify(Object.entries(coinsFailedHike).slice(0, 3))} Max reached combined: ${JSON.stringify(Object.entries(coinsFailedHike2).slice(0, 2))}`);
  
    if(id.includes('#') && !id.includes('##$$')){
      if(id.includes('##')){
    setTimeout(() => {
      sendLogs(`id: ${id} ${getTime()} running after Timeout`);
       id= id+'$';
      checkPriceHike(previousData,ticker20minAgo,lag1min, false);
    }, 1000 * 30);
  }else if(id.includes('##$')){
    setTimeout(() => {
      sendLogs(`id: ${id} ${getTime()} running after Timeout`);
       id= id+'$';
      checkPriceHike(previousData,ticker20minAgo,lag1min, false);
    }, 1000 * 30);
  }else{
    setTimeout(() => {
      sendLogs(`id: ${id} ${getTime()} running after Timeout`);
       id= id+'#';
      checkPriceHike(previousData,ticker20minAgo,lag1min, false);
    }, 1000 * 30);
  }
  }
  }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function checkAndBuy(coinsWithHike,i){
  let isStillinc = await isStillIncr(coinsWithHike[i]);
  sendLogs(`id: ${id} ${getTime()} isStillinc= ${isStillinc}`);
  if (! isStillinc ){
   sendLogs(`id: ${id} ${getTime()} second candle's first 30sec returned false, returning...`);
   return;
  }
  
 
 let incTicker = await getTicker(); // need update
 
 while (isPriceEqual(incTicker, coinsWithHike[i]) && false) {
   await sleep(2000);
   incTicker = await getTicker();
   console.log('Checking again...');
 }

 incTicker.forEach(async (ticker1minBack)=> {
  if(ticker1minBack.market == coinsWithHike[i].symbol){
   let delta =(parseFloat(coinsWithHike[i].currentPrice) - parseFloat(ticker1minBack.last_price)) /parseFloat(ticker1minBack.last_price) * 100;
   if( delta < -5 ){
   // if coins value is decreased more than 5% then, most porbably coins will decrease further.
   console.log('Price started to dec');
   sendLogs(`id: ${id} ${getTime()}: Price started to dec. delta value: ${delta}`)
   return; // most probably coin have started to decr.
  }
   else{
     let result =await isSingleMinHike(coinsWithHike[i]);
    sendLogs(`id: ${id} ${getTime()} result of singleminHike = ${result}`);
     if(result){
       sendLogs(`id: ${id} ${getTime()}:For Coin ${coinsWithHike[i].symbol} : Single Min Hiked, recommended return...`);
       console.log(`id: ${id} ${getTime()} For Coin ${coinsWithHike[i].symbol} Single Min Hiked, recommended return...`);
       return;
     }
   sendLogs(`id: ${id} ${getTime()}: +++++ virtual Coin: ${coinsWithHike[i].symbol} bought at ${ticker1minBack.last_price}. Preparing to sell`)
   console.log(`virtual Coin: ${coinsWithHike[i].symbol} bought at ${ticker1minBack.last_price} preparing to sell`);
   //buy at current market
   coinsWithHike[i].currentPrice=ticker1minBack.last_price;
   greedySell(coinsWithHike[i]);
 }
 return;
 }

 });
}

async function greedySell(coinsWithHike){
  try {
  const boughtPrice=coinsWithHike.currentPrice;
  const symbol=coinsWithHike.symbol;

  var maxPrice = parseFloat(boughtPrice);
  console.log(maxPrice);
  let cnt = 0;
  let cntLoss=0;
  let cntLossRestore=0;
  let _id=id;

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

        if (currentPrice >= maxPrice) {
          maxPrice = currentPrice;
          console.log(`New max price for ${symbol}: ${maxPrice}`);
        }
        else{
          //sell coin and replace sold coin price with currentPrice
          const percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;
          if ( percentageEarned > 3 || percentageEarned <= -8 ){  // if price is bw -8 to 3 then do nothing, hope coin to inc more than 3%

            if(percentageEarned <= -8 && percentageEarned > -11 ){ // wait for approx. 3 min if price remains between given cnd. then sell. 
              cntLoss++; 
              cntLossRestore=0;             
            }

            if(percentageEarned > 8 || cntLoss > 50 || percentageEarned < -11){
          
              if(cntLoss > 50 || cnt > 10000  || percentageEarned < -11){
                // sell if waited for appr. 3min bw -8 to -11 or it is more than 30 min or too much of loss
              sell(intervalId,_id,symbol,boughtPrice,currentPrice,maxPrice,percentageEarned,cntLoss,cntLossRestore,cnt)
            }else{
              beGreedy(coinsWithHike,_id);
              clearInterval(intervalId);
             }

            }
            sendLogs(`id: ${_id} ${getTime()} trying to sell coin: ${symbol} cnt: ${cnt} current price: ${currentPrice} cntLoss: ${cntLoss} Percentage Earned: ${percentageEarned}`);
          }
         else{
          sendLogs(`id: ${_id} ${getTime()} trying to sell coin: ${symbol} cnt: ${cnt}, pending Percentage Earned: ${percentageEarned} cntLossRestore: ${cntLossRestore}`);
          cntLossRestore++;
          if(cntLossRestore > 4) // if price remained better than -8% atleast for 4*3 sec then restore cntLoss variable to 0 
            cntLoss= 0;
            if(cnt > 4800 && percentageEarned > 0){
              beGreedy(coinsWithHike,_id)
            }
        } 
        }
      }
    } catch (error) {
      console.error('An error occurred:', error);
    }
  }, 3000); // 3 seconds in milliseconds
}catch (error) {
  console.log('An error occurred:', error);
}
}

function isPriceEqual(incTicker,coinsWithHike){
const symbol=coinsWithHike.symbol;
const price=parseFloat(coinsWithHike.currentPrice); // bought price
for (const currentTicker of incTicker) {
  if (currentTicker.market === symbol) {
    console.log(parseFloat(currentTicker.last_price), price, parseFloat(currentTicker.last_price) === price);

    if (parseFloat(currentTicker.last_price) === price) {
      return true;
    } else {
      return false;
    }
  }
}
return true;
}

async function beGreedy(coinsWithHike, id){
  try {
    const boughtPrice=coinsWithHike.currentPrice;
    const symbol=coinsWithHike.symbol;
    sendLogs(`id: ${id} ${getTime()} inside beGreedy`);
  
    var maxPrice =-1;
    console.log(maxPrice);
    let cnt = 0;
  
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
          if(maxPrice == -1)
           maxPrice = currentPrice;
          return;
        }
        });
  
        console.log(currentPrice,maxPrice);
        if (currentPrice != undefined) {
  
          if (currentPrice >= maxPrice) {
            maxPrice = currentPrice;
            console.log(`New max price for ${symbol}: ${maxPrice}`);
          }
          else{
          const priceChangePercent = ((currentPrice - maxPrice ) / maxPrice) * 100;
  
          if (priceChangePercent <= -2) {
            const percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;
            sell(intervalId,id,symbol,boughtPrice,currentPrice,maxPrice,percentageEarned,'','',cnt)  
          }
          sendLogs(`id: ${_id} ${getTime()} inside beGreedy current price: ${currentPrice} priceChange%: ${priceChangePercent} maxPrice: ${maxPrice}` );          
          }
          
        }
      } catch (error) {
        console.error('An error occurred:', error);
      }
    }, 3000); // 3 seconds in milliseconds
  }catch (error) {
    console.log('An error occurred:', error);
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

async function isSingleMinHike(coinToMonitor) {
  const symbol=coinToMonitor.symbol;
  const hikeRecordedPerc=coinToMonitor.priceChangePercent;
  let pair=getPair(symbol);
  if( ! pair)
  return true;

  let lastCandles=await getLastCandles(pair);
  lastCandles=lastCandles.slice(0,9);

  const priceChange = coinToMonitor.currentPrice - coinToMonitor.previousPrice;

  let cnt=0;
  for(const coinDetails of lastCandles){
    if(coinDetails.volume == 0){
      sendLogs(`id: ${id} ${getTime()}: in singleMinHike volume == ${coinDetails.volume}`);
      return true;
    }
  }
  lastCandles=lastCandles.slice(0,4);

  for(const coinDetails of lastCandles){
    let open=coinDetails.open;
    let close=coinDetails.close;
    let changePerc= ((close - open)/priceChange) * 100;
    // console.log(`changePerc ${changePerc}`);
    if (changePerc > 60 && cnt==0){ // current min is increasing 
      sendLogs(`id: ${id} ${getTime()}: in singleMinHike changePerc > 60 && cnt==0`);
     return false;
    }
    else if(changePerc > 60 ){
      sendLogs(`id: ${id} ${getTime()}: in singleMinHike changePerc > 60`);
      return true;
    }
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

function sell(intervalId,id,symbol,boughtPrice,currentPrice,maxPrice,percentageEarned,cntLoss,cntLossRestore,cnt){
  sendLogs(`id: ${id} ${getTime()}: For coin: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% cntLoss: ${cntLoss} cntLossRestore: ${cntLossRestore} cnt: ${cnt}`);
  console.log(`For coin: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice} Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
  sendLogs(`id: ${id} ${getTime()}:----------------------------------------------------------`);
  sendEmail(`From Hike, for coin: ${symbol}, \nBought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% `)
 //clear the interval
 clearInterval(intervalId);
}

async function isStillIncr( coinsWithHike ){
 for ( let i=0; i<10; i++ ){
     await sleep(3 * 1000);
     let secFurtherList= await getTicker();
     
    for (const secFurther of secFurtherList) {
     if (secFurther.market === coinsWithHike.symbol) {
     let delta = (parseFloat(secFurther.last_price)- parseFloat(coinsWithHike.currentPrice)) / parseFloat(coinsWithHike.currentPrice) * 100;

     if (delta >= 1 ) {
     // sendLogs(`id: ${id} ${getTime()} second candle's first 30sec delta: ${delta} and secFurther: ${parseFloat(secFurther.last_price)}, returning...`);
      sendLogs(`id: ${id} ${getTime()} second candle's first ${i} loop delta: ${delta} and secFurther: ${parseFloat(secFurther.last_price)}`);
       coinsWithHike.currentPrice = parseFloat(secFurther.last_price);
      return true;
      }
      if (i == 9 ){
       sendLogs(`id: ${id} ${getTime()} second candle's first ${i} loop delta: ${delta} and secFurther: ${parseFloat(secFurther.last_price)}, returning`);
      }
      break;
  }
    }

 }
 return false;


}


