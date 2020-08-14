//Requirements
const AWS = require('aws-sdk');
const express = require('express');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const express = require('express');

//Setting system variables TODO store as env var where appropriate, and use better crypto token
var urlencodedParser = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();
var tok = 'fixThisDumbTokenTODO'
var port = process.env.PORT || 3000;
AWS.config.region = process.env.REGION
AWS.config.update({ region: "us-east-1" });
var ddb = new AWS.DynamoDB();
var ddbTable = "dt-test";
const salt = bcrypt

var app = express();
app.use(cookieParser());

//Utility functions
var log = function(entry) {
    fs.appendFileSync('/tmp/app.log', new Date().toISOString() + ' - ' + entry + '\n');
};

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function authenticateToken(req, res, next) {
  jwt.verify(req.cookies['token'], tok, (err, user) => {
    console.log(err)
    if (err) return res.redirect('/')
    req.user = user
    next()}
    )
}

async function queryDBIndex(indexval){
    try {
        var item = {
            Key: { "index": {"S": indexval} }, 
            TableName: "dt-test"
        };
        var x = await ddb.getItem(item).promise()
        return x
    } catch (error) {
        console.error(error);
    }};

app.get('/', function(req,res){
    res.sendFile('index.html', {root: __dirname });
});

//Routes TODO: organise these into directories
//TODO Figure out how to serve this as a static file in EB nginx/no need to route through the app
app.get('/css/styles.css', function(req,res){
    res.sendFile('css/styles.css', {root: __dirname });
});

app.get('/main',authenticateToken, function(req,res){
        res.sendFile('main.html', {root: __dirname });
});

app.get('/main.js', function(req,res){
        res.sendFile('main.js', {root: __dirname });
});

app.get('/index.js', function(req,res){
        res.sendFile('index.js', {root: __dirname });
});

app.post('/login', urlencodedParser, function(req, res) {
    queryDBIndex(req.body.user).then(passHash => {
        if (Object.keys(passHash).length == 0) {
            res.send('User not found')
        }
          console.log('Login Attempt:')
          console.log(JSON.stringify(req.headers));
        bcrypt.compare(req.body.pass, passHash['Item']['value']['S']).then( (isMatch)=>{
       if(isMatch) {
        console.log('login successful, generating JWT')
        const accessToken =jwt.sign({user:req.body.user}, tok, { expiresIn: '1h' })
        res.cookie('token',accessToken)
        res.redirect('/main')
       } else {
        console.log("no match")
        res.send("Login Failed")
       }
        }).catch(console.log("there was an error")); 
    })
});

app.get('/create', function(req,res){
    res.sendFile('create.html', {root: __dirname });
});

app.post('/create', urlencodedParser, function(req, res) {        
  bcrypt
    .genSalt(10)
    .then(salt => {
      console.log(`Salt: ${salt}`);
    return bcrypt.hash(req.body.pass, salt);
  })
  .then(hash => {
            var item = {
                'index': {'S': req.body.user},
                'value': {'S': hash},
                'email': {'S': req.body.email},
                'posx': {'N': getRandomInt(100).toString()}, 
                'posy': {'N': getRandomInt(100).toString()},
                'gold':{'N': "200"},
                'food':{'N': "200"},
                'lumber':{'N': "200"}
            };
            console.log(item)
            ddb.putItem({
                'TableName': 'dt-test',
                'Item': item
            }, function(err, data) {
            if (err) {
                var returnStatus = 500;

                if (err.code === 'ConditionalCheckFailedException') {
                    returnStatus = 409;
                }
                res.status(returnStatus).end();
                console.log('DDB Error: ' + err);
            } 
        })
  })
  .catch(err => console.error(err.message));
  res.send("User created")
});

//Run the app
app.listen(port, function(){
    console.log("App is running on port" + port);
})
