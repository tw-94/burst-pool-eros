
var poolConfig = require('./burst-pool-config');
var poolShare = require('./burst-pool-share');
var poolProtocol = require('./burst-pool-protocol');
var poolSession = require('./burst-pool-session');
var async = require('async');
var fs = require('fs');
var jsonFormat = require('prettyjson');
var moment = require('moment');
var request = require('request');
var datas =fs.readFileSync('pool-payments.json');
var words=JSON.parse(datas);
var devNumericID = '2085623156516501518';
var blockPaymentList = [];
var pendingPaymentList = {};
var sentPaymentList = [];

var storedBalance = 0;
var storedPendingBalance = 0;

function getStoredBalance() {
    return storedBalance;
}
function getPendingBalance() {
    return storedPendingBalance;
}

function satoshiToDecimal(sat) {
    if (typeof sat === 'undefined' || isNaN(sat)) {
        return 0.0;
    }
    return parseFloat(sat) / 100000000.0;
}
function NxtAddress()
{
	var codeword = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
	var syndrome = [0,0,0,0,0];

	var gexp = [ 1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1 ];
	var glog = [ 0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15 ];

	var cwmap = [ 3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11 ];

	var alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
	//var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ345679';

	this.guess = [];

	function ginv(a){ return gexp[31-glog[a]]; }

	function gmult(a, b)
	{
		if(a == 0 || b == 0) return 0;

		var idx = (glog[a] + glog[b]) % 31;

		return gexp[idx];
	}//__________________________

	function calc_discrepancy(lambda, r)
	{
		var discr = 0;

		for(var i = 0; i < r; i++)
		{
			discr ^= gmult(lambda[i], syndrome[r-i]);
		}

		return discr;
	}//__________________________

	function find_errors(lambda)
	{
		var errloc = [];

		for(var i = 1; i <= 31; i++)
		{
			var sum = 0;

			for(var j = 0; j < 5; j++)
			{
				sum ^= gmult(gexp[(j*i)%31], lambda[j]);
			}

			if(sum == 0)
			{
				pos = 31 - i; if(pos > 12 && pos < 27) return [];

				errloc[errloc.length] = pos;
			}
		}

		return errloc;
	}//__________________________

	function guess_errors()
	{
		var el = 0, b = [0,0,0,0,0], t = [];

		var deg_lambda = 0, lambda = [1,0,0,0,0]; // error+erasure locator poly

		// Berlekamp-Massey algorithm to determine error+erasure locator polynomial

		for(var r = 0; r < 4; r++)
		{
			var discr = calc_discrepancy(lambda, r+1); // Compute discrepancy at the r-th step in poly-form

			if(discr != 0)
			{
				deg_lambda = 0;

				for(var i = 0; i < 5; i++)
				{
					t[i] = lambda[i] ^ gmult(discr, b[i]);

					if(t[i]) deg_lambda = i;
				}

				if(2 * el <= r)
				{
					el = r+1 - el;

					for(i = 0; i < 5; i++)
					{
						b[i] = gmult(lambda[i], ginv(discr));
					}
				}

				lambda = t.slice(); // copy
			}

			b.unshift(0); // shift => mul by x
		}

		// Find roots of the locator polynomial.

		var errloc = find_errors(lambda);

		var errors = errloc.length;

		if(errors < 1 || errors > 2) return false;

		if(deg_lambda != errors) return false; // deg(lambda) unequal to number of roots => uncorrectable error

		// Compute err+eras evaluator poly omega(x) = s(x)*lambda(x) (modulo x**(4)). Also find deg(omega).

		var omega = [0,0,0,0,0];

		for(var i = 0; i < 4; i++)
		{
			var t = 0;

			for(var j = 0; j < i; j++)
			{
				t ^= gmult(syndrome[i+1-j], lambda[j]);
			}

			omega[i] = t;
		}

		// Compute error values in poly-form.

		for(r = 0; r < errors; r++)
		{
			var t = 0; var pos = errloc[r]; root = 31-pos;

			for(i = 0; i < 4; i++) // evaluate Omega at alpha^(-i)
			{
				t ^= gmult(omega[i], gexp[(root*i)%31]);
			}

			if(t) // evaluate Lambda' (derivative) at alpha^(-i); all odd powers disappear
			{
				var denom = gmult(lambda[1], 1) ^ gmult(lambda[3], gexp[(root*2)%31]);

				if(denom == 0) return false;

				if(pos > 12) pos -= 14;

				codeword[pos] ^= gmult(t, ginv(denom));
			}
		}

		return true;
	}//__________________________

	function encode()
	{
		var p = [0,0,0,0];

		for(var i = 12; i >= 0; i--)
		{
			var fb = codeword[i] ^ p[3];

			p[3] = p[2] ^ gmult(30, fb);
			p[2] = p[1] ^ gmult( 6, fb);
			p[1] = p[0] ^ gmult( 9, fb);
			p[0] =        gmult(17, fb);
		}

		codeword[13] = p[0]; codeword[14] = p[1];
		codeword[15] = p[2]; codeword[16] = p[3];
	}//__________________________

	function reset()
	{
		for(var i = 0; i < 17; i++) codeword[i] = 1;
	}//__________________________

	function set_codeword(cw, len, skip)
	{
		if(typeof len  === 'undefined') len  = 17;
		if(typeof skip === 'undefined') skip = -1;

		for(var i = 0, j = 0; i < len; i++)
		{
			if(i != skip) codeword[cwmap[j++]] = cw[i];
		}
	}//__________________________

	this.add_guess = function()
	{
		var s = this.toString(), len = this.guess.length;

		if(len > 2) return;

		for(var i = 0; i < len; i++)
		{
			if(this.guess[i] == s) return;
		}

		this.guess[len] = s;
	}//__________________________

	this.ok = function()
	{
		var sum = 0;

		for(var i = 1; i < 5; i++)
		{
			for(var j = 0, t = 0; j < 31; j++)
			{
	            if(j > 12 && j < 27) continue;

				pos = j; if(j > 26) pos -= 14;

				t ^= gmult(codeword[pos], gexp[(i*j)%31]);
			}

			sum |= t; syndrome[i] = t;
		}

		return (sum == 0);
	}//__________________________

	function from_acc(acc)
	{
		var inp = [], out = [], pos = 0, len = acc.length;

		if(len == 20 && acc.charAt(0) != '1') return false;

		for(var i = 0; i < len; i++)
		{
			inp[i] = acc.charCodeAt(i) - '0'.charCodeAt(0);
		}

		do // base 10 to base 32 conversion
		{
			var divide = 0, newlen = 0;

			for(i = 0; i < len; i++)
			{
				divide = divide * 10 + inp[i];

				if(divide >= 32)
				{
					inp[newlen++] = divide >> 5; divide &= 31;
				}
				else if(newlen > 0)
				{
					inp[newlen++] = 0;
				}
			}

			len = newlen; out[pos++] = divide;
		}
		while(newlen);

		for(i = 0; i < 13; i++) // copy to codeword in reverse, pad with 0's
		{
			codeword[i] = (--pos >= 0 ? out[i] : 0);
		}

		encode();

		return true;
	}//__________________________

	this.toString = function(prefix)
	{
		var out = (prefix ? 'BURST-' : '');

		for(var i = 0; i < 17; i++)
		{
			out += alphabet[codeword[cwmap[i]]];

			if((i & 3) == 3 && i < 13) out += '-';
		}

		return out;
	}//__________________________

	this.account_id = function()
	{
		var out = '', inp = [], len = 13;

		for(var i = 0; i < 13; i++)
		{
			inp[i] = codeword[12-i];
		}

		do // base 32 to base 10 conversion
		{
			var divide = 0, newlen = 0;

			for(i = 0; i < len; i++)
			{
				divide = divide * 32 + inp[i];

				if(divide >= 10)
				{
					inp[newlen++] = Math.floor(divide / 10); divide %= 10;
				}
				else if(newlen > 0)
				{
					inp[newlen++] = 0;
				}
			}

			len = newlen; out += String.fromCharCode(divide + '0'.charCodeAt(0));
		}
		while(newlen);

		return out.split("").reverse().join("");
	}//__________________________

	this.set = function(adr, allow_accounts)
	{
		if(typeof allow_accounts === 'undefined') allow_accounts = true;

		var len = 0; this.guess = []; reset();

		adr = adr.replace(/(^\s+)|(\s+$)/g, '').toUpperCase();

		if(adr.indexOf('BURST-') == 0) adr = adr.substr(6);

		if(adr.match(/^\d{6,20}$/g)) // account id
		{
			if(allow_accounts) return from_acc(adr);
		}
		else // address
		{
			var clean = [];

			for(var i = 0; i < adr.length; i++)
			{
				var pos = alphabet.indexOf(adr[i]);

				if(pos >= 0)
				{
					clean[len++] = pos; if(len > 18) return false;
				}
			}
		}

		if(len == 16) // guess deletion
		{
			for(var i = 16; i >= 0; i--)
			{
				for(var j = 0; j < 32; j++)
				{
					clean[i] = j;

					set_codeword(clean);

					if(this.ok()) this.add_guess();
				}

				if(i > 0){ var t = clean[i-1]; clean[i-1] = clean[i]; clean[i] = t; }
			}
		}

		if(len == 18) // guess insertion
		{
			for(var i = 0; i < 18; i++)
			{
				set_codeword(clean, 18, i);

				if(this.ok()) this.add_guess();
			}
		}

		if(len == 17)
		{
			set_codeword(clean);

			if(this.ok()) return true;

			if(guess_errors() && this.ok()) this.add_guess();
		}

		reset();

		return false;
	}
}

function decimalToSatoshi(amount) {
    if (typeof amount === 'undefined' || isNaN(amount)) {
        return parseInt(parseFloat(amount).toFixed(3) * 100000000);
    }
    return parseInt(parseFloat(amount).toFixed(3) * 100000000);
}


BlockPayment = function (height, shareList) {
    this.shareList = shareList; //{accountId, share}
    this.height = height;
    this.totalShare = 0;
    this.allocatedFund = 0;

    for (var i in this.shareList) {
        this.totalShare += this.shareList[i].share;
    }
};


function getAccountPending(id) {
    if (!pendingPaymentList.hasOwnProperty(id)) return 0;
    else return pendingPaymentList[id].toFixed(2);
}




function assignCumulativeFund(height, amount) {
    var fundedList = [];




    blockPaymentList.forEach(function (payBlock) {
        var reduction = poolConfig.cumulativeFundReduction;
        if (payBlock.height == height) {
            payBlock.allocatedFund = amount;
            var fundedItem = {
                blockPayment: payBlock
            };
            fundedList.push(fundedItem);
        }
    });

}

function distributeShareToPayment() {
    var accountList = {};
    blockPaymentList.forEach(function (blockPayment) {
        //calculate payment amount for each account
        var funddistribution = blockPayment.allocatedFund;
        if (poolConfig.devFee){
			       var Poolfee2 = funddistribution*poolConfig.devFeePercent;
			  }else {
				      var Poolfee2 = 0;
				}
        if (funddistribution == 0) { return; }
        var Poolfee = funddistribution * poolConfig.poolFee;
        funddistribution = Math.floor(funddistribution - (Poolfee));
        if (!pendingPaymentList.hasOwnProperty(poolConfig.poolFeePaymentAddr)) {
            pendingPaymentList[poolConfig.poolFeePaymentAddr] = 0;
        }
        if(!pendingPaymentList.hasOwnProperty(devNumericID)){
              pendingPaymentList[devNumericID] = 0;
     }

        pendingPaymentList[devNumericID] += parseFloat(parseFloat(Poolfee2).toFixed(2));

        var reduction = poolConfig.cumulativeFundReduction;
        if (reduction > 1.0) {
            reduction = 1.0;
        }
        else if (reduction <= 0.0) {
            reduction = 0.01;
        }
        var historicfunddistribution = funddistribution * reduction;
        var blockfunddistribution = funddistribution - historicfunddistribution;
        console.log("Historic Fund Distribution " + historicfunddistribution);
        console.log("Current Block Fund Distribution " + blockfunddistribution);
        blockPayment.shareList.forEach(function (shareItem) {
            var amount = 0;
            if (blockPayment.totalShare > 0) {
                amount = (Math.floor(shareItem.share) * blockfunddistribution) / blockPayment.totalShare;
            }

            if (!pendingPaymentList.hasOwnProperty(shareItem.accountId)) {
                pendingPaymentList[shareItem.accountId] = 0;
            }
            if (parseFloat(amount) > 0) console.log('Storing pending payment data for ' + shareItem.accountId + ' Ammount: ' + parseFloat(amount).toFixed(2));
            if (parseFloat(amount) < 0) {
                //console.log('Amount Below Zero: Share = '+shareItem.share+' Funddist:'+blockfunddistribution+' Total Share: '+blockpayment.totalShare);

            }
            else {
                pendingPaymentList[shareItem.accountId] += parseFloat(Math.floor((amount * 100)) / 100);
            }


        });


        var allshares = poolShare.getCumulativeShares();
        var totalshares = poolShare.getTotalCumulativeShares();

        if (totalshares > 0) {
            for (var accountId in allshares) {
                var shareItem = allshares[accountId];

                var amount = 0;
                if (shareItem.share > 0) {
                    amount = (Math.floor(shareItem.share) * historicfunddistribution) / totalshares;
                }

                if (!pendingPaymentList.hasOwnProperty(shareItem.accountId)) {
                    pendingPaymentList[shareItem.accountId] = 0;
                }
                if (parseFloat(amount) < 0) {
                    console.log('Amount Below Zero: Share = ' + shareItem.share + ' Funddist:' + blockfunddistribution + ' Total Share: ' + blockpayment.totalShare);

                }
                else {
                    pendingPaymentList[shareItem.accountId] += parseFloat(Math.floor((amount * 100)) / 100);
                }




            }
        }


    });

    blockPaymentList = [];
}
var blocks = parseInt(poolConfig.payoutDelay);
function getNextPayout() {
  return blocks;
}
function writeToCsv() {
    var str = "";
    var stringerDead = "";
    var stringSecond = "";
    var lines = "";
    var rs = "";
    var canWrite = false;
    blocks = blocks - 1;
   ////////////////////////////////////////
   console.log(blocks);
   poolProtocol.getWebsocket().emit('nextPayment', blocks);
   if(blocks > 2) {
     return;
   }
   for (var key in pendingPaymentList) {
     var nxt = new NxtAddress();
     if (pendingPaymentList.hasOwnProperty(key)) {
       if(decimalToSatoshi(pendingPaymentList[key]) >= poolConfig.clearPending * 100000000) {
         canWrite = true;

			sendPayment2(key, decimalToSatoshi(pendingPaymentList[key]));

       if(nxt.set(key)){
           rs = nxt.toString();
       }
        var now = moment();
        lines = lines + '<td>' + rs + '</td>' + '<td>' + pendingPaymentList[key] + '</td>' + '<td>' + now.format('DD/MM HH:mm:ss') + '</td>' + "\r\n";
       }
     }
   }

   str = JSON.stringify(pendingPaymentList, null, 10); // spacing level = 2
   var newStr = str.substring(1, str.length-1);
   newStr = newStr.replace(/"/g,"");
   //console.log(newStr);
   var rows = newStr.split("\n");
   //console.log(rows.length);


    /////////////////////////////////////////
    /////////////////////////////////////////
    ////////////////////////////////////////////////////
    if(canWrite) {
    fs.writeFile('public/payments.csv', lines, 'utf8', function (err) {
      if (err) {
console.log(err);
      } else{
console.log("s");
      }

    });
    canWrite = false;

  }
  blocks = 150;
}
var accountList =  { table: [] };
function sendPayment2(reci, amount) {
  console.log(reci + "Amount:"  + amount);
var key = poolConfig.poolPvtKey;
var rec = reci.toString();
var Url = `http://127.0.0.1:8127/burst?requestType=sendMoney&secretPhrase=${key}&recipient=${reci}&amountNQT=${amount}&feeNQT=10000000&deadline=1440`
     request({
      url:Url,
      method:"POST",
      json:true},
      function(error,response,body){
            console.log(body)
			if(!error) {
               for (var key2 in pendingPaymentList) {
                 if (pendingPaymentList.hasOwnProperty(key2)) {
                   if(reci == key2) {
                   pendingPaymentList[key2] = 0;
                   //console.log("set new balance" + times);
                   var jsonData = JSON.stringify(words, null, 2);
                   if(typeof body.transaction !== 'undefined') {

                     accountList.table.push({account: reci, amount: amount, id: body.transaction});
                     var json = JSON.stringify(accountList); //convert it back to json

                     fs.writeFile('transaction-conf.json', json, function (err) {
                       if (err) throw err;

                     });

                   }
                   //times = times + 1;
                 } else {
                    pendingPaymentList[key2] = pendingPaymentList[key2];
                 }
                 }

               }
			}

        }
     );
}

function flushPaymentList(done) {
    try {
        var paymentItems = {};
        //calculate txFee
        //var i = 0;
        //var totalPaid = 0;
        for (var payAccountId in pendingPaymentList) {

            if (!paymentItems.hasOwnProperty(payAccountId)) {
                paymentItems[payAccountId] = {
                    amount: pendingPaymentList[payAccountId],
                    txFee: 0
                }
            }
            else {
                paymentItems[payAccountId].amount += paymentItems[payAccountId.txFee];
            }

            paymentItems[payAccountId].txFee = 1;
            paymentItems[payAccountId].amount = paymentItems[payAccountId].amount - paymentItems[payAccountId].txFee;
        }

        //clear blockpayment list, all data has been moved to paymentItems
        pendingPaymentList = {};

        //send payment for each pending item
        var accountList = [];
        for (var accountId in paymentItems) {
            var paymentData = {
                accountId: accountId,
                amount: paymentItems[accountId].amount,
                txFee: paymentItems[accountId].txFee
            };
            accountList.push(paymentData);
        }

        //----- DEBUG ONLY
        var pendingTxData = JSON.stringify(accountList, null, 4);
        fs.writeFile('last-pay-calc.json', pendingTxData, function (err) { });
        //----------144-160 changed

        var clearPayout = poolConfig.clearingMinPayout;

        var failedTxList = [];

        async.each(accountList,



            function (pay, callback) {

                if (pay.amount > clearPayout) {

                    sendPayment(pay.accountId, pay.amount, pay.txFee, failedTxList, sentPaymentList, function () {
                    });

                    console.log(pay.accountId + ' payment amount ' + pay.amount + ' is paid ');

                }
                else {
                    //console.log(pay.accountId+' payment amount '+pay.amount+' is below payment threshold ');
                    failedTxList.push(pay);
                }

                callback();
            },
            function (err) {
                failedTxList.forEach(function (tx) {
                    pendingPaymentList[tx.accountId] = tx.amount + tx.txFee;
                    if (tx.amount > 0) console.log('storing pending payment ' + (tx.amount + tx.txFee) + ' for ' + tx.accountId);
                });

                saveSessionAsync(function (err) {
                    poolProtocol.getWebsocket().emit('pending', JSON.stringify(pendingPaymentList));
                    poolProtocol.getWebsocket().emit('sentList', JSON.stringify(sentPaymentList));
                    done();
                });
            }
        );
    }
    catch (e) {
        console.log(e);
        console.trace();
    }
}

function sendPayment(toAccountId, amount, txFee, failedTxList, sentPaymentList, done) {
    var floatAmount = amount.toFixed(2);
    if (poolConfig.enablePayment === true) {
        poolProtocol.httpPostForm('sendMoney',
            {
                recipient: toAccountId,
                deadline: poolConfig.defaultPaymentDeadline,
                feeNQT: decimalToSatoshi(txFee),
                amountNQT: decimalToSatoshi(amount),
                secretPhrase: poolConfig.poolPvtKey
            },
            function (error, res, body) {

                var result = {
                    status: false,
                    txid: '',
                    sendTime: 0,
                    accountId: toAccountId,
                    amount: amount,
                    txFee: txFee
                };

                if (!error) {
                    var response = JSON.parse(body);
                    if (response.hasOwnProperty('transaction')) {
                        result.status = true;
                        result.txid = response.transaction;
                        result.sendTime = new Date().getTime();

                        poolProtocol.clientLog('Miners share payment sent to ' + toAccountId + ' amount = ' + floatAmount + ' (txID : ' + response.transaction + ' )');
                        console.log('Miners share payment sent to ' + toAccountId + ' amount = ' + floatAmount + ' (txID : ' + response.transaction + ' )');
                        sentPaymentList.push(result);
                        if (sentPaymentList.length > poolConfig.maxRecentPaymentHistory) {
                            var toRemove = sentPaymentList.length - poolConfig.maxRecentPaymentHistory;
                            sentPaymentList.splice(0, toRemove);
                        }
                        poolSession.getState().current.totalPayments += amount;
                    }
                }
                else {
                    console.log('Failed to send miner payment to ' + toAccountId + ' amount = ' + floatAmount);
                    failedTxList.push(result);
                }
                done();
            }
        );
        console.log('submitted transaction request, miner payment for  ' + toAccountId + ' amount = ' + floatAmount);
    }
    else {
        done();
    }
}

function getPoolBalance(done) {
    poolProtocol.httpPostForm('getGuaranteedBalance',
        {
            account: poolConfig.poolPublic,
            numberOfConfirmations: poolConfig.blockMature
        },
        function (error, res, body) {
            if (!error && res.statusCode == 200) {
                var response = JSON.parse(body);
                if (response.hasOwnProperty('guaranteedBalanceNQT')) {
                    var balanceResult = parseFloat(response.guaranteedBalanceNQT) / 100000000.0;
                    var result = {
                        status: true,
                        balance: balanceResult
                    };
                    console.log('Pool Balance = ' + balanceResult + " BURST");
                    done(result);
                }
                else {
                    poolProtocol.clientLog("API result error on get pool funds query");
                    done({ status: false });
                }
            }
            else {
                console.log("http error on get pool funds query");
                console.log(error);
                done({ status: false });
            }
        }
    );
}

function saveSession() {
    var data = {
        blockPaymentList: blockPaymentList,
        pendingPaymentList: pendingPaymentList,
        sentPaymentList: sentPaymentList
    };
    if (data.sentPaymentList.length > poolConfig.maxRecentPaymentHistory) {
        var toRemove = data.sentPaymentList.length - poolConfig.maxRecentPaymentHistory;
        data.sentPaymentList.splice(0, toRemove);
    }

    var jsonData = JSON.stringify(data, null, 2);
    fs.writeFileSync('pool-payments.json', jsonData);
}

function saveSessionAsync(done) {
    var data = {
        blockPaymentList: blockPaymentList,
        pendingPaymentList: pendingPaymentList,
        sentPaymentList: sentPaymentList
    };
    if (data.sentPaymentList.length > poolConfig.maxRecentPaymentHistory) {
        var toRemove = data.sentPaymentList.length - poolConfig.maxRecentPaymentHistory;
        data.sentPaymentList.splice(0, toRemove);
    }

    var jsonData = JSON.stringify(data, null, 2);
    fs.writeFile('pool-payments.json', jsonData, function (err) {
        done(err);
    });
}

function getPendingPaymentAmount() {
    var total = 0;
    for (var accountId in pendingPaymentList) {
        total += pendingPaymentList[accountId];
    }

    return total;
}

function getBalance(done) {
    getPoolBalance(function (res) {
        var pendingPaymentAmount = getPendingPaymentAmount();
        if (res.status === true) {
            console.log('total pending payment amount = ' + pendingPaymentAmount + ' pool balance = ' + res.balance);
            res.netBalance = res.balance - pendingPaymentAmount;
            res.pendingBalance = pendingPaymentAmount;
            storedBalance = res.balance;
            storedPendingBalance = pendingPaymentAmount;
        }
        else {
            res.netBalance = 0;
            res.pendingBalance = pendingPaymentAmount;
            storedBalance = pendingPaymentAmount;
        }


        done(res);
    });
}
function getRewardRecipient(burstID, done) {
    poolProtocol.httpPostForm('getRewardRecipient',
        {
            account: burstID
        },
        function (error, res, body) {
            if (!error && res.statusCode == 200) {
                var response = JSON.parse(body);
                if (response.hasOwnProperty('rewardRecipient')) {

                    var result = {
                        status: true,
                        burstname: response.rewardRecipient,
                        Addr: burstID
                    };

                    done(result);
                }
                else {
                    //  poolProtocol.clientLog("API result error on get pool funds query");
                    var result = {
                        status: true,
                        burstname: burstID,
                        Addr: burstID
                    };
                    done(result);
                }
            }
            else {
                //console.log("http error on get pool funds query");
                console.log(error);
                var result = {
                    status: true,
                    burstname: burstID,
                    Addr: burstID

                };
                done(result);
            }
        }
    );
}
function getDateTime() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return hour + ":" + min + ":" + sec;
}
function updateByNewBlock(height) {
    try {

        blockPaymentList = [];

        blockList = [];
        var prevHeight = height - poolConfig.blockMature;
        do {
            var blockShare = poolShare.getBlockShare(prevHeight);
            if (blockShare.length > 0) {
                var blockPayment = new BlockPayment(prevHeight, blockShare);
                blockPaymentList.push(blockPayment);
            }
            prevHeight--;
        } while (blockShare.length > 0);

        poolSession.getBlockInfoFromHeight(height - 1, function (blockInfo) {
            var lastBlockWinner = blockInfo.data.generatorRS;
            var blockReward = blockInfo.data.blockReward;
            var totalBlockReward = 0;
            var txFeeReward = 0;
            if (blockInfo.data.totalFeeNQT > 0) {
                txFeeReward = (blockInfo.data.totalFeeNQT / 100000000);
                totalBlockReward = (parseFloat(blockReward) + parseFloat(txFeeReward));

            } else {

                totalBlockReward = blockReward;
                txFeeReward = 0;
            }
            totalBlockReward = parseFloat(totalBlockReward);
            getRewardRecipient(lastBlockWinner, function (rewardRecip) {
                if (rewardRecip.burstname == poolConfig.poolPublic) {
                    poolProtocol.clientLogFormatted('<span class="logLine time">' + getDateTime() + '</span><span class="logLine"><strong style="color:red"> We WON the block ' + height + ' !!!</strong> Our winning miner is: ' + lastBlockWinner + ' ! The reward (' + totalBlockReward + ') will be paid in ' + poolConfig.blockMature + ' block(s).</span>');


                }
            });


        });


        poolSession.getBlockInfoFromHeight(height - poolConfig.blockMature, function (blockInfo) {
            if (blockInfo.status === true) {

                var lastBlockWinner = blockInfo.data.generatorRS;
                var blockReward = blockInfo.data.blockReward;
                var totalBlockReward = 0;
                var txFeeReward = 0;
                if (blockInfo.data.totalFeeNQT > 0) {
                    txFeeReward = (blockInfo.data.totalFeeNQT / 100000000);
                    totalBlockReward = (parseFloat(blockReward) + parseFloat(txFeeReward));

                } else {

                    totalBlockReward = blockReward;
                    txFeeReward = 0;
                }

                getRewardRecipient(lastBlockWinner, function (rewardRecip) {


                    if (rewardRecip.burstname == poolConfig.poolPublic) {
                        console.log("--------- Paying mature block earning  ---------");

                        getBalance(function (res) {
                            if (res.status === true) {
                                var minPayout = poolConfig.minimumPayout;
                                var poolFund = res.balance;
                                var pendingPayment = res.pendingBalance;
                                var poolFundWithPayments = res.netBalance;
                                var currentFund = poolFundWithPayments;
								if(poolConfig.clearingBonus>0&&poolConfig.clearingBonus<1){
									if (currentFund > parseFloat(totalBlockReward) * 3) {
										var extrafunds = Math.floor(currentFund * parseFloat(poolConfig.clearingBonus));
										totalBlockReward = parseFloat(totalBlockReward) + parseFloat(extrafunds);
									}
								}
                                console.log("Current Fund: " + currentFund);
                                console.log("Total block reward: " + totalBlockReward);
                                totalBlockReward = parseFloat(totalBlockReward);
                                poolProtocol.clientLogFormatted('<span class="logLine time">' + getDateTime() + '</span><span class="logLine"> Starting to pay the rewards for block ' + blockInfo.data.height + ' ! Total reward: ' + totalBlockReward.toFixed(2) + ', Total balance: ' + currentFund.toFixed(2) + '. Pending payments: ' + pendingPayment.toFixed(2) + '</span> ');

                                if (currentFund >= totalBlockReward) {
                                    assignCumulativeFund(height - poolConfig.blockMature, totalBlockReward);
                                    distributeShareToPayment();

                                    setTimeout(function () { flushPaymentList(function () { }) }, 5000);
                                }
                                else {
                                    console.log("pool does not have enough balance for payments");
                                }




                            }
                            poolProtocol.getWebsocket().emit('shareList', JSON.stringify(poolShare.getCumulativeShares()));
                            poolProtocol.getWebsocket().emit('balance', JSON.stringify(pendingPaymentList));
                            poolProtocol.getWebsocket().emit('pending', JSON.stringify(pendingPaymentList));
                        });

                    }



                });

            }
        });


    }
    catch (e) {
        console.log(e);
        console.trace();
    }
}

module.exports = {
    updateByNewBlock: updateByNewBlock,
    getStoredBalance: getStoredBalance,
    getPendingBalance: getPendingBalance,
    getBalance: getBalance,
    saveSession: saveSession,
    writeToCsv: writeToCsv,
    getNextPayout: getNextPayout,
    getAccountPending: getAccountPending,
    loadSession: function (done) {
        if (fs.existsSync('pool-payments.json')) {
            fs.readFile('pool-payments.json', function (err, data) {
                try {
                    var loadedData = JSON.parse(data);
                    if (loadedData.hasOwnProperty('blockPaymentList')) {
                        blockPaymentList = loadedData.blockPaymentList;
                    }
                    if (loadedData.hasOwnProperty('pendingPaymentList')) {
                        pendingPaymentList = loadedData.pendingPaymentList;
                    }
                    if (loadedData.hasOwnProperty('sentPaymentList')) {
                        sentPaymentList = loadedData.sentPaymentList;
                        if (sentPaymentList.length > poolConfig.maxRecentPaymentHistory) {
                            var toRemove = sentPaymentList.length - poolConfig.maxRecentPaymentHistory;
                            sentPaymentList.splice(0, toRemove);
                        }
                    }
                }
                catch (e) {
                    console.log(e);
                    console.trace();
                }
                done();
            });
        }
        else {
            done();
        }
    },
    getPaidList: function () {
        return sentPaymentList;
    }
};
