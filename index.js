import express from 'express';
const app= express();
import fetch from 'node-fetch'; 
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import crypto from 'crypto';
import { apiRespond,getBalance } from './ApiInfo.js';
import { buyCoins,sellCoins,activeOrders } from './trans.js';
import {sendEmail} from './Email.js'
// import './socket.js'

 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseurl = "https://api.coindcx.com"
const publicbaseurl="https://public.coindcx.com";
const key = "86cbedd86423640c942ca12696d8a7b7a47ddc7047deed83";
const secret = "86684c3101cd970dcd873b004a9572e7542112430ced48179708cf74a163cfa0";
const coindcx_id= '0e465e90-e45d-4a8d-a62a-19c1f7eb3967';
const market = '/exchange/v1/markets';
const market_details= "/exchange/v1/markets_details";
const ticker='/exchange/ticker';
const candle="/market_data/candles?pair=I-SHIB_INR&interval=4h";
const order_book="/market_data/orderbook?pair=B-BTC_USDT"; //publicbaseurl
const timeStamp = Math.floor(Date.now());

app.use(cors());


 
app.get('/', async (req, res) => {
    let homePath=path.join(__dirname,'home.html');
    res.sendFile(homePath);
});


app.get('/check', async (req, res) => {
    try {
        const response = await apiRespond(false,order_book);
        res.json(response); // Send the API response as JSON
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred' });
    }
});

// sellCoins("SHIBINR",500,0.000890);


// let balance=await getBalance();
// console.log(balance);

// (async()=>{ 
//     let active_orders=await activeOrders('SNTBTC',"buy");
//     console.log(active_orders);
// })()




app.listen(8080, function() {`listening on 8080}`});