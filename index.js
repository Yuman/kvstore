const Database = require("@replit/database")
const db = new Database()

// following https://repl.it/talk/learn/NodeJs-Express-tutorial/23519

// ref https://expressjs.com/en/api.html#req
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
let tu, ut, url;
const addUrl =  function(token, url) {
  db.set(token, url).then(()=>{}).catch(error => console.log("error: " + error));

  db.set(url, token).then(() => {}).catch(error => console.log("error: " + error));

  console.log("saved: " + token);
  return { token: token, "url": url }
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

// app.get('/', (req, res) => {
//   console.log(new Date() + req);
//   res.sendFile('/home/runner/public/index.html')
// })

//given a token, redirects to the corresponding url
app.get('/:token', (req, res) => {
  let token = req.params.token;
  console.log("Entering /token:" +token);

  let url;
  db.get(token).then((value) => { 
    console.log("retrieved: " + value);
    url = value; 
    res.json({ "token": token, "value": url })})
  
})


//given a url, return the corresponding token
app.get('/tokenize/:url', (req, res) => {  
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent

  //https://repl.it/talk/learn/Replit-DB/43305
  let urlenc = req.params.url;
  let url = decodeURIComponent(urlenc)
  console.log("Entering /tokenizer:" + url);
  db.get(url, {raw: true}).then(token => {
      if(token){
        console.log("existing url:" + url);
        console.log("existing token:" + token);
        res.json({ "token": token, "url": url, "existing": true}); 
        return;
      }
      else{
        console.log("new url:" + url);
        let newToken = createToken();
        console.log("created Token:" + newToken);
        addUrl(newToken, url);
        res.json({ "token": newToken, "url": url, "existing": false})
      }    
    })

})


app.listen(3000, () => console.log('server started: ' + new Date()));

let chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const createToken = function(){
  tok = '';
  for (let i = 0; i < 7; i++){
           tok += chars[Math.floor(Math.random()*62)]
  }
  db.get(tok).then(url => {
      if(url)
          tok = createToken();
      else 
          return tok;
  }
  )
}