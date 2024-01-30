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
    res.sendFile(path.join(__dirname,   'Home.html')); //
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

 