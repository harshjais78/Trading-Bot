import { getCandleChart,getMarketDetails,getTicker } from "./ApiInfo.js";
import { sendEmail } from "./Email.js";
import {  startBuyCoinProcess} from "./trans.js";
import { sendLogs } from "./firebase.js";

/*
Target: Some coins suddenly increase by more than 100% in 2 hours.

Logic: target coins who have increased by more than @priceHikeThreshold in 10 minutes
make sure before buying that coins have not started to decrease. If it is decreased even the 
slightest, don't buy else buy immediately and sell

Sell: bought coins should be sell in two ways 1. limit price of about 25% and greedy way @greedySell().
In greedySell() function, idea is wait for coin to reach max price and as soon as it starts to decrease
sell it because coins which have hiked suddenly also decrease suddenly. Observed that they mostly follow
monotonic inc/dec. 

*/



let id=0;

export async function coinHiked(ticker15minAgo,no) {
  console.log('coinHiked function called');
  id=no;
  if(ticker15minAgo == undefined) 
   return ;
  checkPriceHike(ticker15minAgo);
}


async function checkPriceHike(previousData) {
  try {
    const currentTicker = await getTicker();
    const priceHikeThreshold = 25; // Percentage threshold for considering a price hike
    const coinsWithHike = [];

    currentTicker.forEach((currentCoin,idx) => {
      const symbol = currentCoin.market;
      const previousCoin=previousData[idx];
      // console.log(`previousData ${previousCoin}`);
      const previousPrice = parseFloat(previousCoin.last_price);

      // console.log(symbol, previousCoin.market)
      if(symbol !==previousCoin.market)
      return;

      if (previousPrice) {
        const currentPrice = parseFloat(currentCoin.last_price);
        const priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;

        if (priceChangePercent > priceHikeThreshold) {
          coinsWithHike.push({
            symbol,
            priceChangePercent,
            price:currentPrice,
          });
        }
      }
    });

    if(coinsWithHike.length > 0) {
    // Sort coins by price change percentage in descending order
    coinsWithHike.sort((a, b) => b.priceChangePercent - a.priceChangePercent);
    await sleep(3000); // sleep for 3 sec

    let incTicker = await getTicker();
    console.log('Coins with Price Hike (>26%):', coinsWithHike);
    sendLogs(`id: ${id} ${getTime()}: Coins with Price Hike (>26%): ${JSON.stringify(coinsWithHike)}`)

    while (isPriceEqual(incTicker, coinsWithHike[0])) {
      await sleep(2000);
      incTicker = await getTicker();
      console.log('Checking again...');
    }

    sendLogs(`id: ${id} ${getTime()}: Price is not same`)
    incTicker.forEach((currentTicker)=> {

     if(currentTicker.market == coinsWithHike[0].symbol){
     if(parseFloat(coinsWithHike[0].price) > parseFloat(currentTicker.last_price)){
      console.log('Price started to dec');
      sendLogs(`id: ${id} ${getTime()}: Price started to dec`)
      return; // most probably coin have started to decr.
     }
      else{
      sendLogs(`id: ${id} ${getTime()}: virtual Coin: ${coinsWithHike[0].symbol} bought at ${currentTicker.last_price}. Preparing to sell`)
      console.log(`virtual Coin: ${coinsWithHike[0].symbol} bought at ${currentTicker.last_price} preparing to sell`);
      //buy at current market
      coinsWithHike[0].price=currentTicker.last_price;
      greedySell(coinsWithHike[0]);
    }
    return;
    }

    });

    }
    else{
    console.log('No coin met the criteria of sudden hike')
    sendLogs(`id: ${id} ${getTime()}: No coin met the criteria of sudden hike`);
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
        const priceChangePercent = ((maxPrice-currentPrice ) / maxPrice) * 100;

        if (priceChangePercent >= 2) {
          //sell coin and replace sold coin price with currentPrice
          const percentageEarned = ((currentPrice - boughtPrice) / currentPrice) * 100;

          sendLogs(`id: ${id} ${getTime()}: Bought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned: ${percentageEarned.toFixed(2)}%`);
          console.log(`Bought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
          sendEmail(`From Hike, \nBought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% `)
          
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
const price=parseFloat(coinsWithHike.price);
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


function getTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  return `${hours}:${minutes}`;
}


