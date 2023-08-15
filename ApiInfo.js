import fetch from 'node-fetch'; 
import crypto from 'crypto';

const baseurl = "https://api.coindcx.com"
const publicbaseurl="https://public.coindcx.com";
const key = "86cbedd86423640c942ca12696d8a7b7a47ddc7047deed83";
const secret = "86684c3101cd970dcd873b004a9572e7542112430ced48179708cf74a163cfa0";
const coindcx_id= '0e465e90-e45d-4a8d-a62a-19c1f7eb3967';

export const apiRespond=async function(isBaseURL,route){
    let url=publicbaseurl;
    if(isBaseURL)
    url=baseurl;

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
    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const options = {
        method: 'POST',
        headers: {
            'X-AUTH-APIKEY': key,
            'X-AUTH-SIGNATURE': signature,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };

    return fetch(baseurl + "/exchange/v1/users/balances", options)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            
        })
        .catch(error => {
            console.error('An error occurred:', error);
            
        });
}


// export default apiRespond
 