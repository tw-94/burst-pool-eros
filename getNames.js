var fs=require('fs');
var data=fs.readFileSync('pool-share.json');
var words=JSON.parse(data);
var bodyparser=require('body-parser');
var express=require('express');
var app=express();
var fs = require('fs');
var config = require('./burst-pool-config');
var getJSON = require('get-json')
var dict;
var user = 0;
var accountList =  { table: [] };
app.use(express.static('website'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
for(var i = 0; i < words.accountShare.length; i++) {
getJSON(`${config.wallets3.walletUrl}/burst?requestType=getAccount&account=`+words.accountShare[i], function(error, response){
  if (response.name != null){
        accountList.table.push({id: response.account, name: response.name});
    if(i == words.accountShare.length) {
       //JSON.stringify(accountList);
      writeToCsv(accountList);
    }

  }
})
}
function writeToCsv(dataToWrite) {
   var json = JSON.stringify(dataToWrite); //convert it back to json
  fs.writeFile('public/thing.json', json, function (err) {
  if (err) throw err;
  console.log('Saved!');
});
}
