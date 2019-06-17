// 'use strict';

var express = require('express');
var bodyParser = require('body-parser')

var mongoose = require('mongoose');
var dns = require('dns');
var crypto = require('crypto'), shasum = crypto.createHash('sha1')
var cors = require('cors');


var app = express();
var bodyParser = bodyParser.urlencoded({extended: false})

app.use(cors(), bodyParser);
// Basic Configuration 
var port = process.env.PORT || 3000;
/** this project needs a db !! **/ 

mongoose.connect(process.env.MONGO_URI);
console.log("MongoDBConnectionState: " + mongoose.connection.readyState);

var Schema = mongoose.Schema;

// Create URL Schema
var urlSchema  = new Schema({
  url: {type: String, required: true},
  hash: {type: String, required: true}
});
var UrlModel = mongoose.model("UrlModel", urlSchema);


/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// Generate new URL
app.post("/api/shorturl/new", (req, res) => {
  
  var protocolPattern = /^https?:\/\/(.*)/i;
  let url = req.body.url;
  
  let hasMatch = url.match(protocolPattern);
  
  if (hasMatch){
    url = hasMatch[1];
  }
  
  dns.lookup(url, (err, address, family) => {
    if(err){
      res.json({"error":"invalid URL"});
    }else{
      UrlModel.findOne({url: url}, (err, foundUrl) => {
        if(err){
          return err;
        }
        if (foundUrl){
          res.json({url: foundUrl.url, hash: foundUrl.hash});
        }else{
          let hash = shasum.update(url).digest('hex').slice(0,9)

          UrlModel.create({url: url, hash: hash}, (err, data) => {
            if(err){
              return err;
            }
            res.json({url: data.url, hash: data.hash});
          })
        }
      });
    }
  });
});


app.get("/api/shorturl/:hash", (req, res) => {
  UrlModel.findOne({hash: req.params.hash}, (err, data) => {
    if (err){
      res.json({"error":"invalid URL"});
    }
    if (data){
      res.redirect("http://" + data.url);
    } else {
      res.json({"error":"No short url found for given input"});
    }
  })  
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});