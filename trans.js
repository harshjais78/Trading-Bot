import crypto from 'crypto';
import fetch from 'node-fetch'; 


const baseurl = "https://api.coindcx.com"
const publicbaseurl="https://public.coindcx.com";
const key = "86cbedd86423640c942ca12696d8a7b7a47ddc7047deed83";
const secret = "86684c3101cd970dcd873b004a9572e7542112430ced48179708cf74a163cfa0";
const coindcx_id= '0e465e90-e45d-4a8d-a62a-19c1f7eb3967';


export async function buyCoins(name, amount,ppu){
    let quantity=Math.floor(amount/ppu);
    const payload = JSON.stringify({
        "side": "buy",
        "order_type": "limit_order",
        "price_per_unit": ppu,
        "market": name,
        "total_quantity": quantity,
        "timestamp":  Math.floor(Date.now()),
        "client_order_id":coindcx_id
    });
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = baseurl+"/exchange/v1/orders/create";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);  
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function sellCoins(name, amount,ppu){
    let quantity=Math.floor(amount/ppu);
    const payload = JSON.stringify({
        "side": "sell",
        "order_type": "limit_order",
        "price_per_unit": ppu,
        "market": name,
        "total_quantity": quantity,
        "timestamp":  Math.floor(Date.now()),
        "client_order_id":coindcx_id
    });
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = baseurl+"/exchange/v1/orders/create";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}

export async function cancelOrder(id){
    let quantity=Math.floor(amount/ppu);
    const payload = JSON.stringify({
        "id":id,
        "timestamp":  Math.floor(Date.now()),
       
    });
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = baseurl+"/exchange/v1/orders/cancel";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}


export async function activeOrders(coinName, type){
    const payload = JSON.stringify({
        "side": type,
        "market": coinName,
        "timestamp":  Math.floor(Date.now()),
        "client_order_id":coindcx_id
    });
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const headers = {
        'Content-Type': 'application/json',
        'X-AUTH-APIKEY': key,
        'X-AUTH-SIGNATURE': signature
    };
    
    const url = baseurl+"/exchange/v1/orders/active_orders";
    
    return fetch(url, {
        method: 'POST',
        headers: headers,
        body: payload
    })
    .then(response => response.json())
    .then(data => {
        console.log(data); 
    })
    .catch(error => {
        console.error('An error occurred:', error);
    });
}


