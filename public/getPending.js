var fs=require('fs');
var data=fs.readFileSync('pool-payments.json');
var words=JSON.parse(data);
var bodyparser=require('body-parser');
var express=require('express');
writeToCsv(data);
var app=express();
  var fs = require('fs');

app.use(express.static('website'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
function writeToCsv(dataToWrite) {
    var str = "";
    var stringerDead = "";
    var stringSecond = "";
   ////////////////////////////////////////


   str = JSON.stringify(words.pendingPaymentList, null, 10); // spacing level = 2

   var newStr = str.substring(1, str.length-1);
   newStr = newStr.replace(/"/g,"");
 

    /////////////////////////////////////////
    /////////////////////////////////////////
    ////////////////////////////////////////////////////
    fs.writeFile('public/blocks2.csv', newStr, 'utf8', function (err) {
      if (err) {
console.log(err);
      } else{
console.log("s");
      }

    });
}
