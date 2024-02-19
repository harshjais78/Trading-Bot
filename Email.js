import fetch from 'node-fetch'; 

// let service_id = 'Coindcx alert'//uncomment this to use the service
// let template_id =  'template_rpcqp5h'
// let user_id = 'C1wF5QXy4IUHVBrql'
// let accessToken = 'O342h4LQQ7DlYj1EaBP8K'
let lastCallTimestamp = 0;
let callCount = 0;

// second account

let service_id = 'service_7he2dof'
let template_id =  'template_9irwoio'
let user_id = '5g-mymygD04J2rc1o'
let accessToken = 'sr8Y2E8P-N12Wl-Kn6x-k'


export async function sendEmail (message){
const data = {
   service_id , 
    template_id,
    user_id ,
    template_params: {
        to_name: 'Harsh',
        message: message
        
    },
    accessToken
};
sendData(data)
}

export async function sendErrorMail (message){
    const data = {
        service_id , 
         template_id,
         user_id ,
         template_params: {
             to_name: 'Harsh',
             message: message
             
         },
         accessToken
     };
     sendData(data)
}

async function sendData(data){

    const now = Date.now();
    const elapsed = now - lastCallTimestamp;
    
    // Reset call count 
    if (elapsed > 60000) {
        lastCallTimestamp = now;
        callCount = 0;
    }
    
    if (callCount <= 5) {
        lastCallTimestamp = now;
        callCount++;
       
fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('Email Response status:', response.statusText);
})

.catch(error => {
    console.error('Fetch error:', error);
});
    } else {
        console.log("Rate limit reached. Cannot send data.");
    }

}

