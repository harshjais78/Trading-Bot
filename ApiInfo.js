    import fetch from 'node-fetch'; 
    import crypto from 'crypto';
    import * as CONSTANT from './Constant.js'

    export const apiRespond=async function(isBaseURL,route){
        let url=CONSTANT.publicbaseurl;
        if(isBaseURL)
        url=CONSTANT.baseurl;

        return fetch(url + route) // Return the fetch Promise
        .then(response => response.json())
        .catch(error => {
            console.error('An error occurred:', error);
            throw error; // Re-throw the error to be caught by the caller
        });
    }

    export async function getBalance(){
        const body = {
            "timestamp": Date.now()
        };

        const payload = JSON.stringify(body);
        const signature = crypto.createHmac('sha256', CONSTANT.secret).update(payload).digest('hex');

        const options = {
            method: 'POST',
            headers: {
                'X-AUTH-APIKEY': CONSTANT.key,
                'X-AUTH-SIGNATURE': signature,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        };

        return fetch(CONSTANT.baseurl + "/exchange/v1/users/balances", options)
            .then(response => response.json())
            .then(data => {
                return data;
            })
            .catch(error => {
                console.error('An error occurred:', error);
                
            });
    }

    export async function getCandleChart(interval,coinName){
        const currentDate = new Date();

        // Calculate the date 1 year ago in UTC
        const oneYearAgoUTC = new Date(currentDate.toUTCString());
        oneYearAgoUTC.setUTCFullYear(oneYearAgoUTC.getUTCFullYear() - 1);
        
        // Get the timestamp of 1 year ago in milliseconds
        const timestampOneYearAgo = oneYearAgoUTC.getTime();
        
        return fetch(CONSTANT.publicbaseurl + `/market_data/candles?pair=${coinName}&interval=${interval}&starttime=${timestampOneYearAgo}`)
          .then(response => response.json())
          .catch(error => {
            console.error('An error occurred:', error);
            throw error; 
          });
        
    }

    export async function getINRbalance(){
        try{
        let allBalance=await getBalance();

        for(let balance of allBalance){
        if(balance.currency=='INR'){
            return balance.balance;
        }
        
        } return 0;
        }catch(error) {console.log(error); }
    }

    export async function getMarketDetails(){
        return fetch(CONSTANT.baseurl + CONSTANT.market_details)
        .then(response => response.json())
        .catch(error => {
            console.error('An error occurred:', error);
            throw error; 
        });

    }

        export async function getTicker(){
            return fetch(CONSTANT.baseurl + CONSTANT.ticker)
            .then(response => response.json())
            .catch(error => {
                console.error('An error occurred:', error);
                throw error; 
            });
    }
