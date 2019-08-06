var fs=require('fs');
var data=fs.readFileSync('pool-session.json');
var words=JSON.parse(data);
var bodyparser=require('body-parser');
var express=require('express');
var app=express();
var fs = require('fs');
var getJSON = require('get-json')
var dict;
var user = 0;
var moment = require('moment');
var accountList = [];
var config = require('./burst-pool-config');
var str = "";
var strNp = "";
var nxtjs = require('nxtjs');
app.use(express.static('website'));
app.use(bodyparser.urlencoded({extended:false}));
app.use(bodyparser.json());
var length = 20;
var pool = "";
var winner = "";
var newthings = false;
var lastblock = 0;
var lastFound = 0;
var lastHeight = 547320;
var lastWinner;
var burstjs = require('@burstjs/util');
try {
    var fs = require('fs');
    var data = fs.readFileSync('historicBlocks/lastHeight.txt', 'utf8');
    lastHeight = data;
    console.log(data);
} catch(e) {
    console.log('Error:', e.stack);
}
setInterval(function(){
getJSON('https://explore.burst.cryptoguru.org/api/v1/last_blocks', function(error, response){
for(var i = 99; i > 3; i--) {
  if(lastblock < response.data.blocks[i].height) {
    lastblock = response.data.blocks[i].height;
  var name = response.data.blocks[i].generator_name;
  var a = moment(new Date(response.data.blocks[i].created));
  var b = moment(new Date(response.data.blocks[i-1].created));
  var url = "<a href='https://explore.burst.cryptoguru.org/account/" + response.data.blocks[i].generator_id + "'>" + response.data.blocks[i].generator_id + "</a>";
  var diff = b.diff(a, "minutes");
  if(diff < 1) {
    diff = "0 min " + b.diff(a, "seconds") + " sec ";
  } else {
    var rest = diff % 60;
    diff = b.diff(a, "minutes") + " min " + rest + " sec";
  }
  if(response.data.blocks[i].generator_name == null) {
    name = "-"
  }
  if(response.data.blocks[i].reward_recipient_name == null) {
    pool = "Solo Miner";
  } else {
    pool = response.data.blocks[i].reward_recipient_name;
  }
console.log(response.data.blocks[i].height + " Last Block Feed: " + lastHeight);
if(response.data.blocks[i].reward_recipient_id != config.poolPublic && response.data.blocks[i].height > lastHeight) {
    lastHeight = response.data.blocks[i].height;
    lastFound = response.data.blocks[i].height;
//Writing last height into file
var fs = require('fs');
fs.writeFile('historicBlocks/lastHeight.txt', lastHeight, 'utf8', function (err) {
    if(err) {
        return console.log(err);
    }

    //console.log("The file was saved!");
});
      var value = burstjs.convertNumericIdToAddress(`${response.data.blocks[i].generator_id}`);
      winner = value;
      winner = `<a href="/account?id=${response.data.blocks[i].generator_id}">` + winner + "</a>";

      //console.log(winner);

    lastWinner = response.data.blocks[i].generator_id;
    str  = `<tr style='font-size: 12px;'> <td bgcolor="" width="0%" ><a href=/block?height=${response.data.blocks[i].height}>` + "#" + response.data.blocks[i].height+ "</a></td>"  + "<td width='150px bgcolor=''>" + response.data.blocks[i].created +  "</td> "+ "<td>" + diff + "</td><td>" + winner + "</td>" +  "  <td bgcolor=''> " + name + " </td>" + "<td bgcolor=''>" + parseFloat(words.prevBlocks[0].netDiff).toFixed(2) +  '</td>' +  "<td bgcolor=''>" + words.prevBlocks[0].submitters +  '</td></tr' + "\r\n";

      var fs = require('fs');
      fs.appendFile('public/poolBlocks.csv', str, 'utf8', function (err) {
        if (err) {

        } else{

        }

      });
      newthings = false;

}

} else {
  newthings = false;
  //console.log("No new data found: " + new Date());
}
}




})
}, 60000);
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
    adr = adr.toString();
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
