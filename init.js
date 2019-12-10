var http = require('http');
var fs = require('fs'); //require filesystem module
var io = require('socket.io')(http) //require socket.io module and pass the http object (server)
var express = require('express');
var app = express();
var path = require('path');
let ejs = require('ejs');
var curl =  require('curl');
var request = require('request');
var config = require('./burst-pool-config');
const upstreamProxy = require('upstream-proxy');

init();
//Set Engine
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  request({
          url: `${config.wallets3[0].walletUrl}/burst?requestType=getBlockchainStatus`,
          method: "GET",
          json: true,
      },
      function(error, response, body) {
        console.log(config.wallets3[0].walletUrl);
        curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlock`, function(err, response, data){
        var html = " ";
        var wallet = body.version;
        var rs = data.generatorRS;
        var rew = data.blockReward;
        var height = data.height;
        var fee = (data.totalFeeNQT / 100000000).toFixed(2);
        var totalReward = parseFloat(rew) + parseFloat(fee);
        var accountGen = [];
        var names = [];
        curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlocks&firstIndex=0&lastIndex=100`, function(err, response, data){
        var html = " ";
        var rew = data.blocks[0].blockReward;
        var scoopNum = data.blocks[0].scoopNum;
        var lastBlock = data.blocks[0].height;
        var blocks = [];
        var networkDiff = [];
        var numberOfTransactions = [];
        var blockReward = [];
        for(var i = 0; i < data.blocks.length; i++) {
          var time = Date.UTC(2014, 7, 11, 2, 0, 0, 0) + data.blocks[i].timestamp * 1000;
          time = new Date(time).toGMTString();
          var height = data.blocks[i].height;
          var gen = data.blocks[i].generatorRS;
          var reward = data.blocks[i].blockReward;
          var trans = data.blocks[i].numberOfTransactions;
          var totalFee = (data.blocks[i].totalFeeNQT / 100000000).toFixed(2);
          var network = 18325193796 / data.blocks[i].baseTarget;
          network = network.toFixed(2);
          networkDiff.push(network);
          html = html + buildHtml(time, height, gen, reward, trans, totalFee);
          blocks.push(data.blocks[i].height);
          numberOfTransactions.push(data.blocks[i].numberOfTransactions);
          blockReward.push(parseFloat(data.blocks[i].blockReward) + parseFloat(data.blocks[i].totalFeeNQT / 100000000));
        }
        curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccountTransactions&account=${config.poolPublic}&lastIndex=50`, async function(err, response, data){
          var trans = '';
          for(var y = 0; y < data.transactions.length; y++) {
            var action = '';
            var transId = data.transactions[y].transaction;
            var amount = typeof data.transactions[y].transaction == 'undefined' ? 0: (data.transactions[y].amountNQT / 100000000).toFixed(2);
            var sender = data.transactions[y].senderRS;
            var recipient = data.transactions[y].recipientRS;
            //Check if reci exist
            if(typeof recipient == 'undefined') {
              recipient = "";
            }
            var time = Date.UTC(2014, 7, 11, 2, 0, 0, 0) +  data.transactions[y].timestamp * 1000;
            time = new Date(time).toGMTString();
            if(amount > 1) {
            trans = trans + buildHtmlTransaction("Payment", transId, amount, sender, time, recipient);
            }
          }


        res.render('80', {
          rew: rew,
          rs: rs,
          wallet: wallet,
          totalReward: totalReward,
          fee: fee,
          height: height,
          html: html,
          trans: trans,
          networkDiff: networkDiff[0],
          networkDiff2: networkDiff[1],
          networkDiff3: networkDiff[2],
          networkDiff4: networkDiff[3],
          networkDiff5: networkDiff[4],
          networkDiff6: networkDiff[5],
          networkDiff7: networkDiff[6],
          networkDiff8: networkDiff[7],
          networkDiff9: networkDiff[8],
          networkDiff10: networkDiff[9],
          networkDiff11: networkDiff[10],
          networkDiff12: networkDiff[11],
          networkDiff13: networkDiff[12],
          networkDiff14: networkDiff[13],
          networkDiff15: networkDiff[14],
          networkDiff16: networkDiff[15],
          block: blocks[0],
           block2: blocks[1],
           block3: blocks[2],
           block4: blocks[3],
           block5: blocks[4],
           block6: blocks[5],
           block7: blocks[6],
           block8: blocks[7],
           block9: blocks[8],
           block10: blocks[9],
            block11: blocks[10],
            block12: blocks[11],
            block13: blocks[12],
            block14: blocks[13],
            block15: blocks[14],
            block16: blocks[15],
            //configuration
            port: config.poolPort,
            rewardAdd: config.poolPublicRS,
            rewardNumeric: config.poolPublic,
            payoutDelay: config.payoutDelay,
            fee: config.poolFee*100,
            url: config.url,
            distribution: config.cumulativeFundReduction,
            threshold: config.minThreshold,
            discord: config.discordInvite,
            displayDiscordIcon: config.displayDiscordIcon,
            logoURL: config.logoURL,
            navigationDesign: config.navigationDesign,

          });
                });
              });
                  });
            }
          )
        });
        //Get Block Details
                app.get('/block', async function(req, res) {
                   var height = req.query.height;
                   var isNumber = onlyDigits(height);
                   if(!height || !isNumber || height == null || typeof height === 'undefined' || req.query.height === undefined) {
                     curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlockchainStatus`, async function(err, response, datas){
                       var wallet = datas.version;
                     res.render('error', {
                       wallet: wallet,
                     });
                     });
                   } else {
                   curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlock&height=${height}`, async function(err, response, data){
                     var blockSign = data.blockSignature;
                     var blockDelegator =  data.generatorRS;
                     var blockFee = parseFloat(data.totalFeeNQT / 100000000).toFixed(2);
                     var blockGenerator = data.generator;
                     var blockGenReward = parseFloat(data.blockReward).toFixed(2);
                     var blockGatReward = data.numberOfTransactions;
                     var scoop = data.scoopNum;
                     var blockGenNumber = data.baseTarget;
                     var time = Date.UTC(2014, 7, 11, 2, 0, 0, 0) + data.timestamp * 1000;
                     time = new Date(time).toGMTString()
                     curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getRewardRecipient&account=${blockGenerator}`, async function(err, response, datas){
                       var forger = datas.rewardRecipient;
                        curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlockchainStatus`, async function(err, response, datas){
                          var wallet = datas.version;
                       curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccount&account=${forger}`, async function(err, response, datas2){
                         var name = datas2.name;
                     res.render('block', {
                       height: height,
                       blockSign: blockSign,
                       blockFee: blockFee,
                       blockGenerator: blockGenerator,
                       blockGenReward: blockGenReward,
                       blockGatReward: blockGatReward,
                       scoop: scoop,
                       wallet: wallet,
                       blockDelegator: blockDelegator,
                       blockGenNumber: blockGenNumber,
                       time: time,
                       forger: forger,
                       name: name,
                       });
                     });
                      });
                       });
                       });
                   }
                 });
        //Get Account Details
        app.get('/account', async function(req, res) {
          request({
                  url: `${config.wallets3[0].walletUrl}/burst?requestType=getAccount&account=${req.query.id}`,
                  method: "GET",
                  json: true,
                  gzip: true,
                    jar: true,
              },function(error, response, body) {
          var account = req.query.id;
          if(!req.query.id || account == null || typeof account === 'undefined' || body.errorCode == 4 || body.errorCode == 5 ) {
              curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlockchainStatus`, async function(err, response, data){
                var wallet = data.version;
            res.render('error', {
              wallet: wallet,
              });
              });
          } else {
          curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccount&account=${account}`, async function(err, response, data){
            var accountRS = data.accountRS;
            var name = data.name;
            var balance = (data.balanceNQT / 100000000).toFixed(2);
            var assets;
            var publicKey = data.publicKey;
            var accountId = data.account;
            var outgoing = 0;
            var incoming = 0;
            curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccountTransactions&account=${account}&lastIndex=200`, async function(err, response, data){
              var trans = '';
              for(var y = 0; y < data.transactions.length; y++) {
                var action = '';
                if(data.transactions[y].senderRS.toString().trim() === accountRS.toString()) {
                  action = '<p style="color: red; font-size: 18px;"> 	<i class="fa fa-arrow-circle-left" aria-hidden="true"></i>	 </p>';
                  outgoing = outgoing + data.transactions[y].amountNQT / 100000000;
                } else {
                  action ='<p style="color: green; font-size: 18px;"> <i class="fa fa-arrow-circle-right" aria-hidden="true"></i> </p>';
                  incoming = incoming + data.transactions[y].amountNQT / 100000000;
                }
                var transId = data.transactions[y].transaction;
                var amount = typeof data.transactions[y].transaction == 'undefined' ? 0: (data.transactions[y].amountNQT / 100000000).toFixed(2);
                var sender = data.transactions[y].senderRS;
                var recipient = data.transactions[y].recipientRS;
                //Check if reci exist
                if(typeof recipient == 'undefined') {
                  recipient = "";
                }
                var time = Date.UTC(2014, 7, 11, 2, 0, 0, 0) +  data.transactions[y].timestamp * 1000;
                time = new Date(time).toGMTString();
                trans = trans + buildHtmlTransaction(action, transId, amount, sender, time, recipient);
              }
              curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getRewardRecipient&account=${accountId}`,  function(err, response, datas){
                var forger = datas.rewardRecipient;
                curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccount&account=${forger}`,  function(err, response, datas2){
                  var names = datas2.name;
                  curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getBlockchainStatus`,  function(err, response, datas3){
                    var wallet = datas3.version;
                  curl.getJSON(`${config.wallets3[0].walletUrl}/burst?requestType=getAccountBlocks&account=${accountId}`, function(err, response, data){
                      var html2 = '';
                    for(var i = 0; i < data.blocks.length; i++) {
                      var dateString = data.blocks[i].timestamp;
                      dateString = Date.UTC(2014, 7, 11, 2, 0, 0, 0) +  dateString * 1000;
                      dateString = new Date(dateString).toGMTString();
                      var height = data.blocks[i].height;
                      var fee = data.blocks[i].totalFeeNQT / 100000000;
                      var numb = data.blocks[i].numberOfTransactions;
                      var reward = parseFloat(data.blocks[i].blockReward) + parseFloat(data.blocks[i].totalFeeNQT / 100000000) ;
                      var length = data.blocks.length;
                      html2 = html2 + buildPoolAccounts(height, dateString, fee, numb, reward);
                    }
            res.render('account', {
              accountRS: accountRS,
              name:name,
              outgoing: outgoing,
              incoming: incoming,
              wallet: wallet,
              balance:balance,
              assets:assets,
              publicKey:publicKey,
              accountId:accountId,
              trans: trans,
              names: names,
              forger: forger,
              html2: html2,
              length: length,
              });
            });
            });
            });
            });
            });
            });
          }
        }
        )
        });

        //Building Tables
        function buildHtml(time, height, gen, reward, trans, totalFee) {
        var html =  `
          <tr style='font-size: 12px;'>
          <td>
          <span class="info-box-text"><a href='/block?height=${height}'>#${height}</a> </span></td>
            <td>
            <span class="info-box-text"> ${time} </span>
            </td><td>
            <span class="info-box-text">  <a href='/account?id=${gen}' id='sign'> ${gen} </a> </span></td><td>
            <span class="info-box-text">${reward} + ${totalFee} </span></td><td>
            <span class="info-box-text">${trans} </span></td>
          </tr>
          `
          return html;
        }
        //Building Tables
        function buildPoolAccounts(block, date, amount, confirmations, reward) {
          var html =  `
            <tr>
            <td>
            <span class="info-box-text" style="color:green; border-left: 3px solid ${getRandomColor()};">  </span>
            </td>
            <td>
            <span class="info-box-text"><a href='/block?height=${block}'>  #${block} </a> </span>
            </td>
            <td>
            <span class="info-box-text">  ${date} </span>
            </td>
            <td>
            <span class="info-box-text">  ${amount} </span>
            </td>
            <td>
            <span class="info-box-text">  ${confirmations} </span>
            </td>
            <td>
            <span class="info-box-text">  ${reward} </span>
            </td>

            </tr>
            `
          return html;
        }
        //Building Tables
        function buildLastBlocks(block, date, amount, confirmations) {
          var html =  `
            <tr>
            <td>
            <span class="info-box-text" style="color:green;">  >>> </span>
            </td>
            <td>
            <span class="info-box-text"><a href='/block?height=${block}'>  #${block} </a> </span>
            </td>
            <td>
            <span class="info-box-text">  ${date} </span>
            </td>
            <td>
            <span class="info-box-text">  ${amount} </span>
            </td>
            <td>
            <span class="info-box-text">  ${confirmations} </span>
            </td>

            </tr>
            `
          return html;
        }
        //Building Tables
        function buildPoolAccounts(block, date, amount, confirmations, reward) {
          var html =  `
            <tr>
            <td>
            <span class="info-box-text" style="color:green; border-left: 3px solid ${getRandomColor()};">  </span>
            </td>
            <td>
            <span class="info-box-text"><a href='/block?height=${block}'>  #${block} </a> </span>
            </td>
            <td>
            <span class="info-box-text">  ${date} </span>
            </td>
            <td>
            <span class="info-box-text">  ${amount} </span>
            </td>
            <td>
            <span class="info-box-text">  ${confirmations} </span>
            </td>
            <td>
            <span class="info-box-text">  ${reward} </span>
            </td>

            </tr>
            `
          return html;
        }
        //Building Tables
        function buildHtmlTransaction(action, transId, amount, sender, date, reci) {
          var html =  `
            <tr>
              <td>
              <span class="info-box-text">  ${action} </span>
              </td>
              <td>
              <span class="info-box-text">  ${transId} </span>
              </td>
              <td>
              <span class="info-box-text">  ${amount} </span>
              </td>
              <td>
              <span class="info-box-text"> <a href='./account?id=${sender}'> ${sender} </a> </span>
              </td>
              <td>
              <span class="info-box-text">  ${date} </span>
              </td>
              <td>
              <span class="info-box-text">  ${reci} </span>
              </td>
            </tr>
            `
            return html;
        }
        //Get Random Color
        function getRandomColor() {
          var letters = '0123456789ABCDEF';
          var color = '#';
          for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
          }
          return color;
        }
        //Convert Timestamp
        function timeConverter(UNIX_timestamp){
          var a = new Date(UNIX_timestamp);
          var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
          var year = a.getFullYear();
          var month = months[a.getMonth()];
          var date = a.getDate();
          var hour = a.getHours();
          var min = a.getMinutes();
          var sec = a.getSeconds();
          var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
          return time;
        }
        //Getter for Digits Check
        function onlyDigits(s) {
        for (let i = s.length - 1; i >= 0; i--) {
          const d = s.charCodeAt(i);
          if (d < 48 || d > 57) return false
        }
        return true;
      }
      function init() {
        console.log(
        `
        #######
        #       #####   ####   ####
        #       #    # #    # #
        #####   #    # #    #  ####
        #       #####  #    #      #
        #       #   #  #    # #    #
        ####### #    #  ####   ####
        programmed by TWBN alias Burstneon

        if you want to support the software, switch on burst-pool-config / devFee: true

        `
        );
        //Listen Port
        app.listen(config.FrontendHttpPort);
        console.log("Frontend listing on " + config.FrontendHttpPort);
        if(config.upstreamUsed) {
        let myConfig = [
        {
            name: 'Nxt',
            hostnames: [ 'localhost' ],
            endpoint: { host: '127.0.0.1', port: config.upstreamPort }
        }
        ];
        let proxy = new upstreamProxy(myConfig);
        proxy.listen(config.upstreamPortStart).start();
        console.log("Upstream listing on " + config.upstreamPortStart + " to Endpoint " + config.upstreamPort + " " + proxy.getStatus());
        }
      }
