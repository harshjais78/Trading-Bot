import crypto from 'crypto';
import fetch from 'node-fetch'; 


export async function sendEmail (message){
const data = {
    // service_id: 'Coindcx alert', //uncomment this to use the service
    template_id: 'template_rpcqp5h',
    user_id: 'C1wF5QXy4IUHVBrql',
    template_params: {
        to_name: 'Harsh',
        message: message
        
    },
    accessToken:'O342h4LQQ7DlYj1EaBP8K'
};

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
