import  crypto  from "crypto";
import * as CONSTANT from './Constant.js';
import io from "socket.io-client";
import { generateClientOrderId, getStoredJson, moveOrderIdToSell, saveResults } from "./util.js";
import { sendEmail } from "./Email.js";
import { buyCoins, cancelOrder, sellCoins } from "./trans.js";

const socketEndpoint = "wss://stream.coindcx.com";


//connect to server.
const socket = io(socketEndpoint, {
  transports: ['websocket']
});



const body = { channel: "coindcx" };
const payload = Buffer.from(JSON.stringify(body)).toString();
const signature = crypto.createHmac('sha256', CONSTANT.secret).update(payload).digest('hex')

socket.on("connect", () => {
  //Join channel  
  console.log('connected');
  socket.emit('join', {
    'channelName': "coindcx",
    'authSignature': signature,
    'apiKey' : CONSTANT.key
  });
});



socket.on("order-update", async (response) => {
  console.log('order-update');
  try{
  let sudden_fallJson=await getStoredJson(CONSTANT.suddenFall);
  let short_termJson=await getStoredJson(CONSTANT.shortTerm);

  let a=JSON.parse(response.data);

  for(let obj of a) {
    let client_order_id=obj.client_order_id;

    if( obj.status =='cancelled') continue;
  
    if((client_order_id== null || client_order_id==undefined) ){
     await cancelOrder(obj.id);
      await placeSameOrder(obj,short_termJson);  //Note: if order is placed from app then same order will be regenerated with client_order_id 
      // and if side= buy then coin will be sold at short-term profit
      continue; 
    }

    if(obj.side=='sell'){ // coin is sold, Notify
  if(sudden_fallJson.order_id.buy.includes(client_order_id)){
    if(obj.status=='filled' ){
      sendEmail(`You have successfully sold ${obj.target_currency_name} with the profit of 6% probably`);
      moveOrderIdToSell(client_order_id,CONSTANT.suddenFall);
    }
  }else{
    if(client_order_id.endsWith("loss"))
      sendEmail(`You earned loss of more than 13% on ${obj.target_currency_name}`); 
   else if(obj.status=='filled' ){
      sendEmail(`You have successfully sold ${obj.target_currency_name} with the profit of 4% probably`); 
      moveOrderIdToSell(client_order_id,CONSTANT.shortTerm);
      
    }
  }

    }else{  // buy coin is triggered from some where but not yet filled
      if(sudden_fallJson.order_id.buy.includes(client_order_id)){
        if(obj.status=='filled' ){    // buy coin is filled
          let quant=obj.total_quantity;
          let old_ppu=obj.price_per_unit;
          let new_ppu=old_ppu+(old_ppu*6)/100;
          let client_id=generateClientOrderId(obj.market);
          sellCoins(obj.market,quant,new_ppu,client_id);
          sudden_fallJson.order_id.sell.push(client_id);
          saveResults(sudden_fallJson,CONSTANT.suddenFall);
        }
      }else{  //order was set for short-term trade
        if(obj.status=='filled' ){
          let quant=obj.total_quantity;
          let old_ppu=obj.price_per_unit;
          let new_ppu=old_ppu+(old_ppu*4)/100;
          let client_id=generateClientOrderId(obj.market);
          sellCoins(obj.market,quant,new_ppu,client_id);
          short_termJson.order_id.sell.push(client_id);
          saveResults(short_termJson,CONSTANT.shortTerm);
        }
      }
    }

  }
}catch(err){console.error(err);}
});

// In order to leave a channel
// socket.emit('leave', {
//   'channelName': 'coindcx'
// });

async function placeSameOrder(obj,shortTerm) {
  try{
let newShortTerm ={...shortTerm}; // copy of original data
let ppu=obj.price_per_unit;
let market=obj.market;
let quantity=obj.total_quantity;
let client_id=generateClientOrderId(market); 

if(obj.side=='sell'){
   sellCoins(market, quantity,ppu,client_id);
   newShortTerm.order_id.sell.push(client_id);
}else{
   buyCoins(market, quantity,client_id);
   newShortTerm.order_id.buy.push(client_id);
}
 saveResults(newShortTerm,CONSTANT.shortTerm);
}catch(err){console.error(err);}
}