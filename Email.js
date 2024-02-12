import fetch from 'node-fetch'; 

let service_id = 'Coindcx alert'//uncomment this to use the service
let template_id =  'template_rpcqp5h'
let user_id = 'C1wF5QXy4IUHVBrql'
let accessToken = 'O342h4LQQ7DlYj1EaBP8K'

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

fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
        'Content-Type': 'application/json'
    }
})
.then(response => {
    console.log('Email Response status:', response.status);
})

.catch(error => {
    console.error('Fetch error:', error);
});
}

