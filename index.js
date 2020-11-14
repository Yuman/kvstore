const Database = require("@replit/database")
const db = new Database()
const tokenCache = [];
//https://docs.repl.it/misc/database

// const checkToken = async (tok) =>{val= await db.get(tok, {raw: true}); return val;}

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


app.get('/favicon.ico', (req, res) => {
   res.redirect('https://www.apache.org/favicon.ico');
})

app.get('/create', (req, res) => {
   console.log("input url: " + req.query.url);
   let url = req.query.url;
   let buff = Buffer.from(url);
   let base64url = buff.toString('base64');
   console.log("encoded url: " + base64url);
  db.get(base64url).then(token => {
      if(token){
        console.log("existing url:" + base64url);
        console.log("existing token:" + token);
        res.json({ "token": token, "url": base64url, "existing": true}); 
      }
      else{
        console.log("new url:" + base64url);
        let newToken = tokenCache.pop();
        console.log("created Token:" + newToken);
        addUrl(newToken, base64url);
        res.json({ "token": newToken, "url": url, "existing": false})
      }    
    })           

 })

//given a token, redirects to the corresponding url
app.get('/:token', (req, res) => {
  let token = req.params.token;
  console.log("Entering /token: " + token);

  db.get(token).then( (value) => {     
    if(value){
       console.log("retrieved: " + value);
       let buff = Buffer.from(value, 'base64');
       let url = buff.toString('ascii');
       res.redirect(url); 
    }
    else{
      res.redirect('/badtoken.html');
    }
  } )
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
        let newToken = tokenCache.pop();
        console.log("created Token:" + newToken);
        addUrl(newToken, url);
        res.json({ "token": newToken, "url": url, "existing": false})
      }    
    })

})


app.listen(3000, () => {
    console.log('server started: ');
    createToken();
  }
)

const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

const createToken =  function(){
  tok = '';
  for (let i = 0; i < 7; i++){
           tok += chars[Math.floor(Math.random()*62)]
  }
  console.log("New Token: " + tok);
  db.get(tok).then(url => {
     console.log("Checking constructed Token: " + tok);
       if(url){
           console.log("Checking Token, exsits: " + tok);
           tok = createToken();
       }
       else{
         console.log("Checking Token, !exsits: " + tok);
         tokenCache.push(tok);
       }
   }
   )
   .catch(err => console.log(err))
}