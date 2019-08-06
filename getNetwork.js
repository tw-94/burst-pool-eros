var fs = require('fs');
var data = fs.readFileSync('pool-session.json');
var words = JSON.parse(data);
var bodyparser = require('body-parser');
var express = require('express');
var app = express();
var fs = require('fs');
var getJSON = require('get-json')
var config = require('./burst-pool-config');
var dict;
var user = 0;
var moment = require('moment');
var accountList = [];
var str = "";
var strNp = "";
var nxtjs = require('nxtjs');
app.use(express.static('website'));
app.use(bodyparser.urlencoded({
    extended: false
}));
app.use(bodyparser.json());
var length = 20;
var pool = "";
var winner = "";

var burstjs = require('@burstjs/util');

getJSON('https://explore.burst.cryptoguru.org/api/v1/last_blocks', function(error, response) {
    for (var i = 99; i > 3; i--) {
        var name = response.data.blocks[i].generator_name;
        var a = moment(response.data.blocks[i].created);
        var b = moment(response.data.blocks[i - 1].created);
        var url = "<a href='https://explore.burst.cryptoguru.org/account/" + response.data.blocks[i].generator_id + "'>" + response.data.blocks[i].generator_id + "</a>";
        var diff = b.diff(a, "minutes");
        if (diff < 1) {
            diff = "0 min " + b.diff(a, "seconds") + " sec ";
        } else {
            var rest = diff % 60;
            diff = b.diff(a, "minutes") + " min " + rest + " sec";
        }
        if (response.data.blocks[i].generator_name == null) {
            name = "-"
        }
        if (response.data.blocks[i].reward_recipient_name == null) {
            pool = "Solo Miner";
        } else {
            pool = response.data.blocks[i].reward_recipient_name;
        }

        if (response.data.blocks[i].reward_recipient_id == config.poolPublic) {
            const value = burstjs.convertNumericIdToAddress(`${response.data.blocks[i].reward_recipient_id}`);
            winner = value
            str = str + '<td bgcolor="" width="0%" >' + response.data.blocks[i].height + "</a></td>" + "<td width='150px bgcolor=''>" + response.data.blocks[i].created + "</td> " + "<td>" + diff + "</td><td>" + winner + "</td>" + "  <td bgcolor=''> " + name + " </td>" + "<td bgcolor=''>" + words.prevBlocks[0].submitters + '</td></tr>';
        }
        if (response.data.blocks[i].reward_recipient_id == config.poolPublic) {

            strNp = strNp + '<td bgcolor="orange" width="0%" >' + response.data.blocks[i].height + "</a></td>" + "<td width='150px' bgcolor='orange'>" + response.data.blocks[i].created + "</td> " + "<td bgcolor='orange'>" + diff + "</td><td bgcolor='orange'>" + pool + "</td>" + "  <td bgcolor='orange'> " + name + "<td bgcolor='orange'></tr>";

        } else {

            strNp = strNp + '<td bgcolor="" width="0%" >' + response.data.blocks[i].height + "</a></td>" + "<td width='150px' bgcolor=''>" + response.data.blocks[i].created + "</td> " + "<td width='150px'>" + diff + "</td><td>" + pool + "</td>" + "  <td bgcolor=''> " + name + " </td>" + "<td bgcolor=''></tr>";
        }

    }
    if (str == "") {
        str = "No entries last 99 blocks";
    }
    var fs = require('fs');

    fs.writeFile('public/blocksNp.csv', strNp, 'utf8', function(err) {
        if (err) {

        } else {

        }

    });
})
