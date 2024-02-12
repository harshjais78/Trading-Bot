import { getCandleChart,getMarketDetails,getTicker } from "./ApiInfo.js";
import { sendEmail, sendErrorMail } from "./Email.js";
import fetch from 'node-fetch'; 
import {  startBuyCoinProcess} from "./trans.js";
import { sendLogs } from "./firebase.js";
import { getPair, sleep,getPriceHistory } from "./util.js";
import * as CONSTANT from './Constant.js'
import { prefix } from "./hike.js";

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

export async function hikeAtOnce(ticker5minAgo,ticker10minAgo,no) {
  console.log('coinHiked function called');
  id=no+"";
  if(ticker5minAgo == undefined) 
   return ;
  checkPriceHike(ticker5minAgo,ticker10minAgo, true);
}


// async function checkPriceHike(previousData,ticker10minAgo, canCheckBranch) {
//   try {
//     const currentTicker = await getTicker();
//     const priceHikeThreshold = 20; // Percentage threshold for considering a price hike
//     const combineHikeThreshold = 31;
//     const recheckThreshold = 8;
//     let coinsWithHike = [];
//     let coinsFailedHike = [];
//     let prevChangePerc = 0;
//     let price20minBack=0;
//     let matched=true;

//     currentTicker.forEach((currentCoin,idx) => {
//       const symbol = currentCoin.market;
//       let previousCoin=previousData[idx];
//       // console.log(`previousData ${previousCoin}`);
//       let previousPrice;

//       if(symbol !==previousCoin.market){
//         previousData.forEach((preData) => {
//             if(preData.market === symbol){
//                 previousPrice = parseFloat(preData.last_price);
//                 return;
//             }
//         });
//         }else{
//         previousPrice = parseFloat(previousCoin.last_price);
//         }

//         if(ticker10minAgo){
//             let coin10minAgo = ticker10minAgo[idx];
//             if(coin10minAgo.market == symbol ){
//             let prev20minPrice = parseFloat(coin10minAgo.last_price);
//             let prev10minDeltaPerc = ((previousPrice - prev20minPrice)/prev20minPrice) *100; 
//             price20minBack = prev20minPrice;
//             if(prev10minDeltaPerc >= 0.7) 
//               prevChangePerc = prev10minDeltaPerc;
//               else
//               prevChangePerc = 0;
    
//             }
//             else{
//               ticker10minAgo.forEach((coin10minAgo)=>{
//                 if(coin10minAgo.market == symbol){
//                 let prev20minPrice = parseFloat(coin10minAgo.last_price);
//                 let prev10minDeltaPerc = ((previousPrice - prev20minPrice)/prev20minPrice) *100; 
//                 price20minBack = prev20minPrice;
//                 if(prev10minDeltaPerc >= 0.7 ) 
//                   prevChangePerc = prev10minDeltaPerc;
//                   else
//                   prevChangePerc = 0;
//                 return;
//               }
    
//               })
//               matched = false;
//           }
//             }

//       if (previousPrice) {
//         const currentPrice = parseFloat(currentCoin.last_price);
//         const priceChangePercent = ((currentPrice - previousPrice) / previousPrice) * 100;
//          // current should be increasing
         
//         if (priceChangePercent >= priceHikeThreshold || ( priceChangePercent + prevChangePerc >= combineHikeThreshold && priceChangePercent > 1 )) { 

//           coinsWithHike.push({
//             symbol,
//             priceChangePercent,
//             combineChangePercent: (prevChangePerc+priceChangePercent),
//             currentPrice,
//             previousPrice,
//             price20minBack,
//           });
        
//         }
//     //     else if(priceChangePercent >= recheckThreshold && canCheckBranch ){
//     //      canCheckBranch = false;
//     //      setTimeout(() => {
//     //      sendLogs(`${prefix(id)}  running after Timeout for coin: ${symbol}, price was: ${currentPrice}`);
//     //       id= id+'#';
//     //      checkPriceHike(previousData,ticker10minAgo,lag1min, false);
//     //    }, 1000 * 30);
//     //     }
//         else{
//           coinsFailedHike.push({
//             symbol,
//             curr10minDeltaPerc: priceChangePercent.toFixed(3),
//             combineChangePercent: (prevChangePerc+priceChangePercent).toFixed(3),
//             currentPrice,
//             previousPrice,
//             price20minBack,
//           });
//         }
//       }

//       price20minBack=0;
//       prevChangePerc = 0;
//     });

//     if(!matched){
//     sendLogs(`${prefix(id)}  current symbol doesnot match with prev20min symbol`);
//       console.log(`id: ${id} not matched`);
//   }else{
//     sendLogs(`${prefix(id)}  matched`);
//     console.log(`id: ${id}  matched`);
//     }

//     if(coinsWithHike.length > 0) {
//     // Sort coins by price change percentage in descending order
//     coinsWithHike.sort((a, b) => b.priceChangePercent - a.priceChangePercent);

//     console.log(`${prefix(id)}  Coins with Price Hike (>17%): ${JSON.stringify(coinsWithHike)}`);
//     sendLogs(`${prefix(id)}  Coins with Price Hike ***** (>${priceHikeThreshold}/${combineHikeThreshold}%): ${JSON.stringify(coinsWithHike)}`)

//     for(let i = 0; i < coinsWithHike.length; i++){
//       if(i != 0)
//       id = id + '-';
//       checkAndBuy(coinsWithHike,i,id);
//      }
//     }
//     else{
//       // send log for both type of comparisons
//     coinsFailedHike.sort((a, b) => b.curr10minDeltaPerc - a.curr10minDeltaPerc);
//     let coinsFailedHike2 = [...coinsFailedHike];
//     coinsFailedHike2.sort((a, b) => b.combineChangePercent - a.combineChangePercent);

//     console.log('No coin met the criteria of sudden hike')
//     sendLogs(`${prefix(id)}  No coin met the criteria of sudden hike`);
//     sendLogs(`${prefix(id)}  Max reached alone: ${JSON.stringify(Object.entries(coinsFailedHike).slice(0, 3))} Max reached combined: ${JSON.stringify(Object.entries(coinsFailedHike2).slice(0, 2))}`);
  
//     if(id.includes('#') && !id.includes('##$$')){
//       if(id.includes('##')){
//     setTimeout(() => {
//       sendLogs(`${prefix(id)}  running after Timeout`);
//        id= id+'$';
//       checkPriceHike(previousData,ticker10minAgo,lag1min, false);
//     }, 1000 * 30);
//   }else if(id.includes('##$')){
//     setTimeout(() => {
//       sendLogs(`${prefix(id)}  running after Timeout`);
//        id= id+'$';
//       checkPriceHike(previousData,ticker10minAgo,lag1min, false);
//     }, 1000 * 30);
//   }else{
//     setTimeout(() => {
//       sendLogs(`${prefix(id)}  running after Timeout`);
//        id= id+'#';
//       checkPriceHike(previousData,ticker10minAgo,lag1min, false);
//     }, 1000 * 30);
//   }
//   }
//   }

//   } catch (error) {
//     console.error('An error occurred:', error);
//     sendLogs(`${prefix(id)} error in checkPriceHike function: ${error.message}`);
//   }
// }

// async function checkAndBuy(coinsWithHike,i,id){
//   let haveInc = await haveIncBehind(coinsWithHike[i], id);
//   sendLogs(`${prefix(id)}  isStillinc= ${isStillinc}`);
//   if ( haveInc ){
//    sendLogs(`${prefix(id)}  Have incereased behind, returning...`);
//    return;
//   }

//    sendLogs(`${prefix(id)}  +++++ virtual Coin: ${coinsWithHike[i].symbol} bought at ${coinsWithHike.currentPrice}. Preparing to sell`)
//    console.log(`virtual Coin: ${coinsWithHike[i].symbol} bought at ${coinsWithHike.currentPrice} preparing to sell`);
//    //buy at current market
// //    coinsWithHike[i].currentPrice=ticker1minBack.last_price;
// spikeGreedySell(coinsWithHike[i], id);

// }

export async function spikeGreedySell(coinsWithHike, id){
  try {
    sendLogs(`${prefix(id)} spikeGreedySell: `);
  const boughtPrice=coinsWithHike.currentPrice;
  const symbol=coinsWithHike.symbol;

  var maxPrice = parseFloat(boughtPrice);
  console.log(maxPrice);
  let cnt = 0;
  let cntLoss=0;
  let cntLossRestore=0;
  let _id=id;
  let isMoreThan3 =false;
  let moreThan3cnt = 0;
  let maxLossAccepted = -0.6*(coinsWithHike.combineChangePercent) > -10 ? -10: -0.6*(coinsWithHike.combineChangePercent);
  let targetProfit = (coinsWithHike.combineChangePercent) < 20 ? 23:(coinsWithHike.combineChangePercent) ;
  let lastcnt = 0;
  let lastPrice = 10000;
  let profitArr=[]
  let moreThan12cnt = 0;
  let is1minInc = false;


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

          //sell coin and replace sold coin price with currentPrice
          let percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;
          if(cnt > 150) {
            sendLogs(`${prefix(_id)} Enough time given, Selling, cnt: ${cnt} Earned, ${percentageEarned}`);
            
        }

        if(percentageEarned >= 3.6 || percentageEarned <maxLossAccepted){
          beGreedy(coinsWithHike,_id,0);
          clearInterval(intervalId);
        }
          sendLogs(`${prefix(_id)} inside spikeGreedySell: price: ${currentPrice}  percentageEarned: ${percentageEarned}`); 

        //   if ( percentageEarned >= 3 || percentageEarned < maxLossAccepted ){  // if price is bw -8 to 3 then do nothing, hope coin to inc more than 3%

        //     if(percentageEarned >= 7)
        //     moreThan3cnt++;

        //     if(percentageEarned >= 12)
        //      moreThan12cnt++;

        //      if(moreThan12cnt >= 3)
        //        maxLossAccepted = 3;

        //     if(isMoreThan3){
        //       if(lastcnt + 2 <= cnt ){ // after 2 min
        //         if(currentPrice < lastPrice){
        //           maxLossAccepted = -5;
        //         } 
        //         if(currentPrice < lastPrice){
        //             if(profitArr.length > 3 && (profitArr[3]- profitArr[1] < -15 ||  profitArr[3]- profitArr[0] < -15 )){ // decreased suddenly.
        //                 sendLogs(`${prefix(_id)} seems to be -ve wick,so skipping selling part. Sum of last 3 percEarned: ${profitArr[0]} ${profitArr[1]}  ${profitArr[2]}  ${profitArr[3]}`);
        //             }else{
        //         sendLogs(`${prefix(_id)} Being Greedy: perc. Earned: ${percentageEarned.toFixed(3)}% last Price: ${lastPrice} currentPrice: ${currentPrice}`);
        //         // beGreedy(coinsWithHike,_id,-0.5);
        //           clearInterval(intervalId);
        //         }
        //     }else{
        //         is1minInc = true;
        //     }
        //         lastPrice = currentPrice;
        //         lastcnt = cnt;
        //         sendLogs(`${prefix(_id)} After 2 min perc. Earned: ${percentageEarned.toFixed(3)}% last Price: ${lastPrice} `);
        //       }

        //       profitArr.push(percentageEarned);
        //       if(profitArr.length >3){
        //       profitArr=profitArr.slice(-4);
        //       sendLogs(`${prefix(_id)} profitArr: ${profitArr.toString()}`);
        //       if( profitArr[2] -profitArr[0] >= 15 || profitArr[3] - profitArr[0] >= 15){   // increased suddenly
        //         sendLogs(`${prefix(_id)} seems to be wick, so selling. Sum of last 3 percEarned: ${profitArr[2] - profitArr[0]}`);
        //         beGreedy(coinsWithHike,_id,-1);
        //     }else if(profitArr.length > 3 && (profitArr[3]- profitArr[1] < -15 ||  profitArr[3]- profitArr[0] < -15 )){ // decreased suddenly.
        //         sendLogs(`${prefix(_id)} seems to be -ve wick,so skipping selling part. Sum of last 3 percEarned: ${profitArr[0]} ${profitArr[1]}  ${profitArr[2]}  ${profitArr[3]}`);
        //         return;
        //     }
        //     }
        //     if(is1minInc){
        //         sendLogs(`${prefix(_id)} 1min candle is still increasing, so skip selling. Earned ${percentageEarned}`);
        //         return; // increase as far as possible.
        //     }
        //     }

        //     if(moreThan3cnt >= 4){
        //       isMoreThan3 = true;
        //       lastPrice = currentPrice;
        //       sendLogs(`${prefix(_id)} more than 3 = true: ${percentageEarned.toFixed(3)}`);
        //     }

        //     if(percentageEarned >= targetProfit || percentageEarned < maxLossAccepted){
          
        //       if( percentageEarned < maxLossAccepted){
        //         // sell if waited for appr. 2hrs bw -8 to -11 or it is more than 30 min or too much of loss
        //       sell(intervalId,_id,symbol,boughtPrice,currentPrice," ",percentageEarned,cntLoss,cntLossRestore,cnt)
        //     }else{
        //       sendLogs(`${prefix(_id)} inside greedy sell: targetProfit: ${targetProfit} percentageEarned: ${percentageEarned}`); 
        //         beGreedy(coinsWithHike,_id,0);
        //       clearInterval(intervalId);
        //      }

        //     }
         
        //     sendLogs(`${prefix(_id)} trying to sell coin: ${symbol} with (>3% or <-8%) cnt: ${cnt} current price: ${currentPrice} Percentage Earned: ${percentageEarned.toFixed(3)} targetProfit: ${targetProfit}`);
        //   }
        //  else{
        //   sendLogs(`${prefix(_id)} trying to sell coin: ${symbol} cnt: ${cnt}, pending Percentage Earned: ${percentageEarned.toFixed(3)} cntLossRestore: ${cntLossRestore}`);
        //     moreThan3cnt = 0;
        // } 
        
      }
    } catch (error) {
      console.error('An error occurred:', error);
      sendLogs(`${prefix(id)} error in greedySell function inside scheduler: ${error.message}`);
      sendErrorMail(`Found Error: in greedySell function inside scheduler in hikeAtOnce ${error.message}` );

    }
  }, 60*1000); // 3 seconds in milliseconds
}catch (error) {
  console.log('An error occurred:', error);
  sendLogs(`${prefix(id)} error in greedySell function: ${error.message}`);
  sendErrorMail(`Found Error: in greedySell function in hikeAtOnce ${error.message}` );

}
}





async function beGreedy(coinsWithHike, id, maxGreedy){
  try {
    const boughtPrice=coinsWithHike.currentPrice;
    const symbol=coinsWithHike.symbol;
    sendLogs(`${prefix(id)}  inside beGreedy`);
  
    // var maxPrice =-1;
    // console.log(maxPrice);
    // let cnt = 0;
    
    // if (maxGreedy == undefined)
    //   maxGreedy = -2;
     
    // // Fetch ticker data every 3 seconds
    // const intervalId = setInterval(async () => {
    //   try {
        const tickerData = await getTicker();
        let currentPrice;
    //     cnt++;

        if (!tickerData) {
          console.error(`Ticker data not available for ${symbol}`);
          return;
        }

    //     // run at every 3 seconds
        tickerData.forEach((currentTicker)=> {
          if(currentTicker.market == symbol){
           currentPrice = parseFloat(currentTicker.last_price);
          // if(maxPrice == -1)
          //  maxPrice = currentPrice;
          return; // leaves only current iteration
        }
        });
  
    //     console.log(currentPrice,maxPrice);
    //     if (currentPrice != undefined) {
  
    //       if (currentPrice >= maxPrice) {
    //         maxPrice = currentPrice;
    //         console.log(`New max price for ${symbol}: ${maxPrice}`);
    //         sendLogs(`${prefix(id)} updated maxPrice: ${maxPrice}` );          

    //       }
    //       else{
          // const priceChangePercent = ((currentPrice - maxPrice ) / maxPrice) * 100;
  
    //       if (priceChangePercent <= maxGreedy) {
            const percentageEarned = ((currentPrice - boughtPrice) / boughtPrice) * 100;
            sell('',id,symbol,boughtPrice,currentPrice,'',percentageEarned,'','','')  
        //   }
        //   sendLogs(`${prefix(id)} inside beGreedy current price: ${currentPrice} priceChange%: ${priceChangePercent} maxPrice: ${maxPrice}` );          
        //   }
          
        // }
    //   } catch (error) {
    //     console.error('An error occurred:', error);
    //   }
    // }, 3000); // 3 seconds in milliseconds
  }catch (error) {
    console.log('An error occurred:', error);
    sendErrorMail(`Found Error: in beGreedy function in hikeAtOnce ${error.message}` );

  }
}


function sell(intervalId,id,symbol,boughtPrice,currentPrice,maxPrice,percentageEarned,cntLoss,cntLossRestore,cnt){
  sendLogs(`${prefix(id)} GreedySpike, For coin: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% cntLoss: ${cntLoss} cntLossRestore: ${cntLossRestore} cnt: ${cnt}`);
  console.log(`For coin: ${symbol} Bought Price: ${boughtPrice}  Selling Price: ${currentPrice} max price: ${maxPrice} Percentage Earned/loss: ${percentageEarned.toFixed(2)}%`);
  sendLogs(`${prefix(id)} ----------------------------------------------------------`);
  sendEmail(`From GreedySpike, for coin: ${symbol}, \nBought Price: ${boughtPrice}  Selling Price: ${currentPrice}  Percentage Earned/loss: ${percentageEarned.toFixed(2)}% `)
 //clear the interval
 clearInterval(intervalId);
}

