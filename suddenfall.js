import { getCandleChart } from "./ApiInfo.js";
import {  startBuyCoinProcess} from "./trans.js";
import * as CONSTANT from "./Constant.js";
import { getStoredJson } from "./util.js";


//candles for 4 hrs
//last three times
// if all dec assume market is down


// suddenFallAlgo();

async function isPriceDec(coinObj) {
  try{
  for (let itr of coinObj) {

    let curr_market = await getCandleChart("4h", itr.name);
    curr_market = curr_market.slice(0, 13);
    
    let pos = 0,
      recent = 0,
      old = 0;
    for (let obj of curr_market) {
      if (pos == 0) recent = obj.close;

      old = obj.open;
      pos++;

    }
    let perc = ((recent - old) * 100.0) / old;

    if (perc < -8) {return itr;}
  }
}catch(e){console.error(e); return "";}
}

export async function suddenFallAlgo() {
  let data = await getStoredJson(CONSTANT.suddenFall);
  let coinObj = data.coin;
  let check = await isPriceDec(coinObj);
 
  if (check ) {  
    let times=1;
   let intervalId=setInterval(async () => {
    let cond=await buyIfPriceIncreaseStart(check);
    if( cond || times++ > 317){ // true means bought, false means need more time to check
      clearInterval(intervalId);
    }
  },5*60*1000);// 5 min

  if(buyIfPriceIncreaseStart(check))  // run for the first time
  clearInterval(intervalId);

  }
}

async function buyIfPriceIncreaseStart(itr) { //check after every 5min wheather coin price started to increase--> if bought then break loop
   
  try{
    let curr_market = await getCandleChart("5m", itr.name);
    curr_market = curr_market.slice(0, 2);

    let pos = 0,
      recent = 0,
      old = 0;
    for (let obj of curr_market) {
      if (pos == 0) recent = obj.close;

      old = obj.open;
      pos++;
    }

    if (recent - old > 0) {
     startBuyCoinProcess(itr,CONSTANT.suddenFall);
      return true;
  }
  return false;
}catch(e){console.error(e);}
}

