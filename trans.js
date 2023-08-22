import crypto from 'crypto';
import fetch from 'node-fetch'; 
import * as CONSTANT from './Constant.js'
import { timestampDaysBack,timestampToDay,getStoredJson } from './util.js';



export async function buyCoins(name, quantity,ppu){
    
    // =Math.floor(amount/ppu);
    const payload = JSON.stringify({
        "side": "buy",
        "order_type": "limit_order",
        "price_per_unit": ppu,
        "market": name,
        "total_quantity": quantity,
        "timestamp":  Math.floor(Date.now()),
        // "client_order_id":CONSTANT.coindcx_id
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = CONSTANT.baseurl+"/exchange/v1/orders/create";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
       return data; 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function buyCoinsNow(name, quantity,client_order_id){
    
    // =Math.floor(amount/ppu);
    const payload = JSON.stringify({
        "side": "buy",
        "order_type": "market_order",
        "market": name,
        "total_quantity": quantity,
        "timestamp":  Math.floor(Date.now()),
        "client_order_id":client_order_id,
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = CONSTANT.baseurl+"/exchange/v1/orders/create";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
       return data; 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function sellCoins(name, quantity,ppu,client_order_id){
     
    const payload = JSON.stringify({
        "side": "sell",
        "order_type": "limit_order",
        "price_per_unit": ppu,
        "market": name,
        "total_quantity": quantity,
        "timestamp":  Math.floor(Date.now()),
        "client_order_id":client_order_id
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = CONSTANT.baseurl+"/exchange/v1/orders/create";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        return data;
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function cancelOrder(id){
   
    const payload = JSON.stringify({
        "id":id,
        "timestamp":  Math.floor(Date.now()),
       
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = CONSTANT.baseurl+"/exchange/v1/orders/cancel";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
      return( data);
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function activeOrders(coinName){
    const payload = JSON.stringify({
        // "side": 'sell',
        "market": coinName,
        "timestamp":  Math.floor(Date.now())
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = CONSTANT.baseurl+"/exchange/v1/orders/active_orders";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        return data;
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function orderStatus(id){
    const payload = JSON.stringify({
                
        "timestamp":  Math.floor(Date.now()),
        // "id": id,
        "client_order_id": id
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url =CONSTANT.order_status;
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        return data 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function tradeHistory(dcx_name){
    const payload = JSON.stringify({
                
        "timestamp":  Math.floor(Date.now()),
        
        "limit": 25,
        "sort": "desc",
        // "from_timestamp": timestampDaysBack()
        // "to_timestamp": Date.now(),  
        "symbol": dcx_name
    });
    
    const signature = crypto
        .createHmac('sha256', CONSTANT.secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': CONSTANT.key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url =CONSTANT.trade_history;
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        return data; 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function tradeableCoinsListInAccount() {
    try{
       
    let coinDetails = await apiRespond(true,CONSTANT.market_details);


    let allBalance=await getBalance();
    
    // get unused balance more than 0
    const filteredCurrencies = allBalance.filter(entry => {
        const balance = parseFloat(entry.balance);
        const lockedBalance = parseFloat(entry.locked_balance);
        return balance - lockedBalance > 0;
      });

      
      // get name of currencies excpet INR ready to be tracked
      const currencyNames = filteredCurrencies
      .filter(entry =>{
        if( entry.currency == 'INR') return false;
        return true;
        })
      .map(entry =>entry.currency);
      
    //   console.log(currencyNames);

      //storing details of coins present in my account 
      const trackable_coins_obj = coinDetails.filter(entry => {
        return (
            currencyNames.includes( entry.target_currency_short_name ) 
        &&  entry.base_currency_short_name =='INR'
        );
      });

      const livePrice=await apiRespond(true,CONSTANT.ticker);
      let coin_code_obj=[];
      // console.log(filteredCurrencies);
      // console.log(trackable_coins_obj);

      //store name of coin and pair
      for( let entry of filteredCurrencies){
        console.log(entry);
        const balance = parseFloat(entry.balance);
        const lockedBalance = parseFloat(entry.locked_balance);
        const remBalance=balance-lockedBalance;
        let currency=entry.currency;

        trackable_coins_obj.forEach(element => {
        // console.log(`rembalance ${remBalance} currency ${currency} minq ${element.min_quantity} coindcx Nmae${element.coindcx_name}`);

            if(element.target_currency_short_name==currency  ){ 
                let currName=element.coindcx_name;
                
                for(let priceNow of livePrice){
                if(priceNow.market==currName && priceNow.last_price*remBalance>=100 ){
                    console.log( priceNow.last_price*remBalance)//
                let obj={
                    'coin': currency,
                    'pair':element.pair,
                    'coindcx_name': element.coindcx_name,
                    precision:element.base_currency_precision
                }
                coin_code_obj.push(obj);
            }
            }
            }
        });

      }
      coin_code_obj.push({'coin':'shib',pair:'I-SHIB_INR',coindcx_name:'SHIBINR',precision:6});

    return coin_code_obj;
    }

    catch(err) {console.error(err);
};}

export async function startBuyCoinProcess(coinObj,type) {

    let balance=await getINRbalance();
    console.log(balance);
    if(balance>100){   // min balance
        let curr_market = await getCandleChart("1m", coinObj.name);
        let curr_price=curr_market[0].close;    //remember if price increases quantity will decrease and quantity will increase should be more than min quantity
        console.log('curr_price');
        
        let quant=102/curr_price;   // min quantity to buy
        quant=quant.toFixed(coinObj.precision);

        let name=convertPairIntoCoindcxName(coinObj.name);
       
        let client_order_id=generateClientOrderId(coinObj.name);

        let coinBuyres=await buyCoins(name,quant,curr_price,client_order_id);
        let jsonStored=await getStoredJson(type);
        jsonStored.order_id.buy.push(client_order_id);
        sendEmail(`You have bought ${name} for ₹102, quantity ${quant} and orderid: ${client_order_id} from ${type}`);
        console.log(coinBuyres);
        saveResults(jsonStored,type);   
     

        // let sellingPrice=curr_price+(6/100)*curr_price; // 6% profit
        // sellCoins(name,quant,sellingPrice,client_order_id);
    }


}

// export async function getCandleObj(coinName){
//     const marketData=await getCandlechart();
//     const desiredMarket = marketData.find(market => market.name === desiredMarketName);
// }
