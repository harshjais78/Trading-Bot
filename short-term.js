
import { apiRespond,getBalance, getCandleChart } from './ApiInfo.js';
import { activeOrders, tradeHistory,tradeableCoinsListInAccount, startBuyCoinProcess } from './trans.js';
import * as CONSTANT from './Constant.js'
import { averagePrice,getStoredJson,saveResults,convertPairIntoCoindcxName, getMiscData, saveMiscResults, daysPassedSince } from './util.js';



// getCoinReadyToBuy()


async function setTargetandSell(){
    let part_result=[];
    let avg=[];
    let bought_price=[];
    let coinList= await tradeableCoinsListInAccount();

    for(let coin of coinList){
      //candle chart
        let chartDetails=await getCandleChart('1w',coin.pair);
        let w_avg=averagePrice(chartDetails);
        avg.push(w_avg);

        let chartDetails1=await getCandleChart('4h',coin.pair);
        let h_avg=averagePrice(chartDetails1);
        avg.push(h_avg);

        let chartDetails2=await getCandleChart('15m',coin.pair);
        let m_avg=averagePrice(chartDetails2);
        avg.push(m_avg);


      //set target
      let target=4;
      if(avg[1]<0){
        target=target-1;
      }
      if(avg[2]<0)
      target-=0.5;
      
      if(avg[0]>0)
      target=target+1;
     else target=target-1;


      let tradehistory=await tradeHistory(coin.coindcx_name );
      const buyOrders = {};
    
      // get last buy-transaction and store coins of only one type among many trascation of same coin(but latest one) and corresponding invested amt
      tradehistory.forEach(entry => {
      if (entry.side === 'buy') {
      const symbol = entry.symbol;
      if (!buyOrders[symbol]) {
        buyOrders[symbol] = {
        symbol: symbol,
        invested: parseFloat(entry.quantity) * parseFloat(entry.price),
        target_percent:target,
        timestamp: entry.timestamp,
        order_id: entry.order_id,
        pair: coin.pair,
        quantity: entry.quantity,
        precision: coin.precision
      };
    } 
  }
 
});

const buyOrdersArray = Object.values(buyOrders);
      bought_price.push(buyOrdersArray);

      
    }
  
    //sell coins
    for (let obj2 of bought_price) {
      for(let obj of obj2) {
        let inc_ppu = (obj.invested + (obj.target_percent / 100) * obj.invested);    
        inc_ppu = inc_ppu / obj.quantity;
        inc_ppu = parseFloat(inc_ppu.toFixed(obj.precision));
        console.log(inc_ppu,obj.precision);
    //  let res=await sellCoins(obj.symbol,obj.quantity,inc_ppu);
    //  console.log(res);
      }
  }
     
}

function maxSubarraySum(nums) {
  let maxEndingHere = nums[0];
  let maxSoFar = nums[0];

  for (let i = 1; i < nums.length; i++) {
    maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
}


export async function getCoinReadyToBuy() {  // run after every 4hrs to check if I can buy coin  --> avoid checking ifAllDecreasingTogether for 1 to 2 turns
try{
  let coinObj=await getStoredJson(CONSTANT.suddenFall);
  let miscObj=await getMiscData();
  let blackList=[];
  let newList=[]; 


  for(let c of miscObj.blackList){  // get list of valid coins name
    let time=c.timestamp;
    let day=daysPassed(time);

    if(day<10){
      blackList.push(c.name);
      newList.push({"name":c.name,"timestamp":c.timestamp});
      console.log("blackList"),JSON.stringify(blackList);
    }
  }
  miscObj.blackList=newList;
  await saveMiscResults(miscObj);
  let coinReadyToTrade=null;

  if(allDecreasingTogether(coinObj))
    return false;

    let pendingList=await getPendingCoinsList();

  for(let coin of coinObj.coin) {
    let curr_market = await getCandleChart("4h", coin.name);
    curr_market = curr_market.slice(0, 5);

    let pos = 0,recent = 0,old = 0;

  for (let obj of curr_market) {
    if (pos == 0) recent = obj.close;
    old = obj.open;
    pos++;
  }

  let perc = ((recent - old) * 100.0) / old;

  if (perc < -3.8 && !pendingList.includes(coin.name) && !blackList.includes(coin.name)) {

    let curr_market_inc = await getCandleChart("1d", coin.name);
    curr_market_inc = curr_market_inc.slice(0, 7);
    let arr=[];

  for (let obj of curr_market_inc) {
    let diff=obj.open-obj.close;
    arr.push(diff);
  }

  let maxInc=maxSubarraySum(arr);

  if(maxInc>7.5){ // if in a day max inc is more than 7 add to black list because in future it will decrease and create error when
    addToBlackListCoin(coin.name,miscObj);
    continue;
  }

    coinReadyToTrade={'name':coin.name,'precision':coin.precision};
     break;
    }
  }

  if(coinReadyToTrade !=null){
    startBuyCoinProcess(coinReadyToTrade,CONSTANT.shortTerm); 
    return true;
  }
}catch(err){console.error(err);return false;}
}


async function allDecreasingTogether(coinObj) {

  let isDec=[];
  try{
  for(let coin of coinObj.coin) {
    let curr_market = await getCandleChart("4h", coin.name);
    curr_market = curr_market.slice(0, 5);

    let pos = 0,recent = 0,old = 0;

  for (let obj of curr_market) {
    if (pos == 0) recent = obj.close;

    old = obj.open;
    pos++;
  }

  let perc = ((recent - old) * 100.0) / old;
  if (perc < -3) isDec.push(true);
  else isDec.push(false);

}
for(let bool of isDec) {
  if(!bool) return false;
}
return true;
}catch(err){console.error(err);return false;}
}


async function getPendingCoinsList(){
  let coinsList=[];
  try{

  let jsonData=await getStoredJson(CONSTANT.suddenFall);
  let coinArray=jsonData.coin;  // all tradeable coins

  for(let coinName of coinArray){

    let active_orders=await activeOrders(convertPairIntoCoindcxName(coinName.name));
    if( active_orders.orders.length>0)
    coinsList.push(coinName.name);
  }

  return coinsList;

}catch(err){console.error(err);return [];}
}

async function addToBlackListCoin(coinName,obj){
let newObj={...obj};  //copy
let a={"name": coinName,'timestamp':new Date().getTime()};
newObj.blackList.push(a);
saveMiscResults(newObj);
}
 
function daysPassed(timestamp) {
  const currentTimestamp = new Date().getTime();
  const timeDifference = currentTimestamp - timestamp;
  const daysPassed = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  return daysPassed;
}