import dotenv from 'dotenv';
dotenv.config();

export const baseurl = "https://api.coindcx.com"
export const publicbaseurl="https://public.coindcx.com";
 
export const key = "86cbedd86423640c942ca12696d8a7b7a47ddc7047deed83";
export const secret = process.env.COINDCX_SECRET;
export const coindcx_id= '0e465e90-e45d-4a8d-a62a-19c1f7eb3967';
 
export const market = '/exchange/v1/markets';
export const market_details= "/exchange/v1/markets_details";   //baseurl
export const ticker='/exchange/ticker';
export const candle="/market_data/candles?pair=I-SHIB_INR&interval=4h";
export const order_book="/market_data/orderbook?pair=B-BTC_USDT"; //publicbaseurl
export const order_status=baseurl + "/exchange/v1/orders/status";
export const trade_history=baseurl + "/exchange/v1/orders/trade_history";
export const suddenFall='sudden-fall';
export const shortTerm='short-term';
export const priceHistory='priceHistory';