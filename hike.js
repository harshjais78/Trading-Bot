import { getCandleChart,getMarketDetails,getTicker } from "./ApiInfo.js";
import { sendEmail } from "./Email.js";
import {  startBuyCoinProcess} from "./trans.js";
import { sendLogs } from "./firebase.js";
import { sleep } from "./util.js";

/*
Target: Some coins suddenly increase by more than 100% in 2 hours.

Logic: target coins who have increased by more than @priceHikeThreshold in 10 minutes or combining prev 2 
candles of 10 min hike is more than 30% and also
make sure before buying coin that price have not started to decrease by more than 6%. If it is decreased 
don't buy otherwise buy immediately and sell.

Sell: bought coins should be sell in two ways 1. limit price of about 25% and greedy way @greedySell().
In greedySell() function, idea is wait for coin to reach max price and as soon as it starts to decrease
sell it because coins which have hiked suddenly also decrease suddenly. Observed that they mostly follow
monotonic inc/dec. 

*/



let id=0;

export async function coinHiked(ticker15minAgo,ticker20minAgo,lag1min,no) {
  console.log('coinHiked function called');
  id=no;
  if(ticker15minAgo == undefined) 
   return ;
  checkPriceHike(ticker15minAgo,ticker20minAgo,lag1min);
}


async function checkPriceHike(previousData,ticker20minAgo,lag1min) {
  try {
    const currentTicker = await getTicker();
    const priceHikeThreshold = 20; // Percentage threshold for considering a price hike
    const combineHikeThreshold = 30;
    let coinsWithHike = [];
    let coinsFailedHike = [];
    let prevChangePerc = 0;
    let price20minBack=0;

    currentTicker.forEach((currentCoin,idx) => {
      const symbol = currentCoin.market;
      const previousCoin=previousData[idx];
      // console.log(`previousData ${previousCoin}`);
      const previousPrice = parseFloat(previousCoin.last_price);
      if(ticker20minAgo){
        let coin20minAgo = ticker20minAgo[idx];
        if(coin20minAgo.market == symbol){
        let prev20minPrice = parseFloat(coin20minAgo.last_price);
        let prev10minDeltaPerc = ((previousPrice - prev20minPrice)/prev20minPrice) *100; 
        price20minBack = prev20minPrice;
        if(prev10minDeltaPerc >= 9) 
          prevChangePerc = prev10minDeltaPerc;
          else
          prevChangePerc = 0;
        // console.log(`id: ${id} ${getTime()}    ${symbol} matched ${coin20minAgo.market}`)

        }
        else{
          prevChangePerc = 0;
        //  sendLogs(`id: ${id} ${getTime()} current symbol ${symbol} doesnot match with prev20min symbol ${coin20minAgo.market}`);
        // console.log(`id: ${id} ${getTime()} current symbol  ${symbol} doesnot match with prev20min symbol ${coin20minAgo.market}`)
      }
        }

      // console.log(symbol, previousCoin.market)
      if(symbol !==previousCoin.market)
      return;

      if (previousPrice) {
        const currentPrice = parseFloat(currentCoin.last_price);
        const priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

        if (priceChangePercent >= priceHikeThreshold || priceChangePercent+prevChangePerc >=combineHikeThreshold) { 
          coinsWithHike.push({
            symbol,
            priceChangePercent,
            combineChangePercent: (prevChangePerc+priceChangePercent),
            currentPrice,
            previousPrice,
            price20minBack,
          });
        }else{
          coinsFailedHike.push({
            symbol,
            curr10minDeltaPerc: priceChangePercent,
            combineChangePercent: (prevChangePerc+priceChangePercent),
            currentPrice,
            previousPrice,
            price20minBack,
          });
        }
        price20minBack=0;
        prevChangePerc = 0;
      }
    });

    if(coinsWithHike.length > 0) {
    // Sort coins by price change percentage in descending order
    coinsWithHike.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
   

    let incTicker = lag1min;
    console.log(`id: ${id} ${getTime()}: Coins with Price Hike (>20%): ${JSON.stringify(coinsWithHike)}`);
    sendLogs(`id: ${id} ${getTime()}: Coins with Price Hike (>20%): ${JSON.stringify(coinsWithHike)}`)

    while (isPriceEqual(incTicker, coinsWithHike[0])) {
      await sleep(2000);
      incTicker = await getTicker();
      console.log('Checking again...');
    }

    sendLogs(`id: ${id} ${getTime()}: Price is not same`);

    incTicker.forEach((ticker1minBack)=> {
     if(ticker1minBack.market == coinsWithHike[0].symbol){
      let delta =(parseFloat(coinsWithHike[0].price) - parseFloat(ticker1minBack.last_price)) /parseFloat(ticker1minBack.last_price) * 100;
     
      if( delta < -5 ){
      // if coins value is decreased more than 6% then, most porbably coins will decrease further.
      console.log('Price started to dec');
      sendLogs(`id: ${id} ${getTime()}: Price started to dec. delta value: ${delta}`)
      return; // most probably coin have started to decr.
     }
      else{
      sendLogs(`id: ${id} ${getTime()}: virtual Coin: ${coinsWithHike[0].symbol} bought at ${ticker1minBack.last_price}. Preparing to sell`)
      console.log(`virtual Coin: ${coinsWithHike[0].symbol} bought at ${ticker1minBack.last_price} preparing to sell`);
      //buy at current market
      coinsWithHike[0].price=ticker1minBack.last_price;
      greedySell(coinsWithHike[0]);
    }
    return;
    }

    });

    }
    else{
      // send log for both type of comparisons
    coinsFailedHike.sort((a, b) => b.curr10minDeltaPerc - a.curr10minDeltaPerc);
    let coinsFailedHike2 = [...coinsFailedHike];
    coinsFailedHike2.sort((a, b) => b.combineChangePercent - a.combineChangePercent);

    console.log('No coin met the criteria of sudden hike')
    sendLogs(`id: ${id} ${getTime()}: No coin met the criteria of sudden hike`);
    sendLogs(`id: ${id} ${getTime()}: Max reached alone: ${JSON.stringify(Object.entries(coinsFailedHike).slice(0, 4))} Max reached combined: ${JSON.stringify(Object.entries(coinsFailedHike2).slice(0, 5))}`);
  }

  } catch (error) {
    console.error('An error occurred:', error);
  }
}


async function greedySell(coinsWithHike){
  try {
  const boughtPrice=coinsWithHike.price;
  const symbol=coinsWithHike.symbol;

  var maxPrice = parseFloat(boughtPrice);
  console.log(maxPrice);

  // Fetch ticker data every 3 seconds
  const intervalId = setInterval(async () => {
    try {
      const tickerData = await getTicker(symbol);

      if (!tickerData) {
        console.error(`Ticker data not available for ${symbol}`);
        return;
      }

      let currentPrice;

      // run at every 3 seconds
      tickerData.forEach((currentTicker)=> {
        if(currentTicker.market == symbol){
         currentPrice = parseFloat(currentTicker.last_price);
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
          //sell coin and replace sold coin price with currentPrice
          const percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;

          sendLogs(`id: ${id} ${getTime()}: Bought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
          console.log(`Bought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
          sendLogs(`id: ${id} ${getTime()}:----------------------------------------------------------`);
          // sendEmail(`From Hike, \nBought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% `)
          
          //clear the interval
          clearInterval(intervalId);
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


export function getTime() {
  const nowUTC = new Date(); // Current UTC time
  const now = new Date(new Date(nowUTC.getTime() + (5 * 60 + 30) * 60000)); // Adding 5 hours and 30 minutes);

  const hours = now.getUTCHours().toString().padStart(2, '0');
  const minutes = now.getUTCMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}


