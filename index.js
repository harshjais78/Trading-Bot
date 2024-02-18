import express from 'express';
const app= express();
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { flatCoins, getStoredJson } from './util.js';
import './schedule.js'
import './socket-acc.js'
import * as CONSTANT from './Constant.js'
 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let port=process.env.PORT || 8080;

app.use(cors());

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {

    res.sendFile(path.join(__dirname,   'HansCure.html')); //
});

app.post('/deletion', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    // Check if username and password are provided
    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }
    res.status(200).send('Your account will be deleted in 90 days.');
});

app.get('/check', async (req, res) => {
    try {
        // const st = await getStoredJson(CONSTANT.shortTerm);
        // const sf = await getStoredJson(CONSTANT.suddenFall);
        const ph = await getStoredJson(CONSTANT.priceHistory);
        res.status(200).send({
            // "short-term":st, "sudden fall": sf,
            "FlatCoinsList": flatCoins,
            "priceHistory":ph});  
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send({ error: 'An error occurred' });
    }
});
 
app.listen(port, function() {console.log(`listening on ${port}`)});

 