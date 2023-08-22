import express from 'express';
const app= express();
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { getStoredJson } from './util.js';
import './schedule.js'
import './socket-acc.js'
import * as CONSTANT from './Constant.js'
 

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let port=process.env.PORT || 8080;

app.use(cors());

app.get('/',  (req, res) => {
    let homePath=path.join(__dirname,'home.html');
    res.send('homePath');
});


app.get('/check', async (req, res) => {
    try {
        const st = await getStoredJson(CONSTANT.shortTerm);
        const sf = await getStoredJson(CONSTANT.suddenFall);
        res.status(200).send({"short-term":st, "sudden fall": sf});  
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).send({ error: 'An error occurred' });
    }
});
 
app.listen(port, function() {`listening on ${port}`});

 