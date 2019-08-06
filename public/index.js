$.ajaxSetup({
    cache: true
});


var templateCache = {};
function getTemplate(path, callback){
    if(templateCache.hasOwnProperty(path)){
        callback(templateCache[path]);
    }
    else {
        $.get(path, function(template){
            templateCache[path] = template;
            callback(template);
        });
    }
}

function renderTemplate(templatePath, data, done){
    getTemplate(templatePath, function(template) {
        var rowHtml = Mustache.render(template, data);
        done(rowHtml);
    });
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function sortRowList(containerId,childClass,childValueIdPrefix){
    var rowList = $('#'+containerId);
    var listitems = rowList.children('.'+childClass).get();
    listitems.sort(function(a, b) {
        var id_a = $(a).attr('id').split('-')[1];
        var id_b = $(b).attr('id').split('-')[1];
        var value_a = parseFloat($('#'+childValueIdPrefix+'-'+id_a).text());
        var value_b = parseFloat($('#'+childValueIdPrefix+'-'+id_b).text());
        return value_b - value_a;
    });
    $.each(listitems, function(idx, itm) { rowList.append(itm); });
}
var data2 = [];
var again99 = true;

function setCookies(ID, names) {
  var alerted = localStorage.getItem('add7' + ID);
  if (alerted != names) {
  localStorage.setItem('add7' + ID, names);

}
}
function loadCookies(ID) {
  var cook = localStorage.getItem('add7' + ID);
  return cook;
}
function checkStat() {
 var nxt = new NxtAddress();
 var account = document.getElementById("monitor").value;
 for(var accountId in historicData){
     var data = historicData[accountId];
     if(nxt.set(data.accountId)){
         historicData[data.accountId].accountRS = nxt.toString();
     }
     var add = account;
     if(add.startsWith("Burst")) {
       var arr = [];             //new storage
       add = add.split('-');     //split by spaces
       arr.push(add.shift());    //add the number
       arr.push(add.join('-'));  //and the rest of the string
       add = arr[1];
       account = add;
     } else if(add.startsWith("BURST")) {
       var arr = [];             //new storage
       add = add.split('-');     //split by spaces
       arr.push(add.shift());    //add the number
       arr.push(add.join('-'));  //and the rest of the string
       add = arr[1];
       account = add;
     }
     if(account == historicData[data.accountId].accountRS) {
       var deadline = moment.utc(data.deadline*1000).format("HH : mm : ss");
       var cap = data.capacity;
       var version = data.miner;
       var submitDeadlines = data.roundCount;
       var balance = data.balance;
       var online = data.capacity > 0 ? "online" : "offline";

       document.getElementById("account").innerHTML = "BURST-" + account;
       document.getElementById("status").innerHTML = online;
       document.getElementById("bestDeadline").innerHTML = deadline;
       document.getElementById("capacity").innerHTML = cap;
       document.getElementById("version").innerHTML = version;
       document.getElementById("submitDeadlines").innerHTML = submitDeadlines;
       document.getElementById("balance").innerHTML = balance;


     }
   }
}
var historicData;
function setJsonAllround(json) {
  historicData = json;
}
function getJsonAllround() {
  return historicData;
}
function onShareList(jsonData){
    $('#shareList').empty();
    var nxt = new NxtAddress();
    for(var accountId in jsonData){
        var data = jsonData[accountId];
        data2 = jsonData[accountId];
        data.share = data.share.toFixed(2);
        if(data.deadline == -1){
            data.deadline = "";
            data.deadlineStr = "";
        }
        else {
            data.accountRS = data.accountId;
            var duration = moment.duration(data.deadline*1000);
            data.deadlineStr = moment.utc(data.deadline*1000).format("HH : mm : ss");
        }
        if(again99) {
          rsToName(data.accountId, null);
          var namename = loadCookies(data.accountId);
        }
        data.name = namename;

        if(data.deadline > 60*60 ){
            data.deadlineStr = duration.humanize();
        }
        if(jsonData.deadlineStr == 'Invalid date'){
            jsonData.deadlineStr = '---';
        }
        if(nxt.set(data.accountId)){
            jsonData[data.accountId].accountRS = nxt.toString();
        }
        var roundShareRow = $('#AllRoundItem-'+data.accountId);
        if(roundShareRow.length <= 0){
            renderTemplate('/templates/AllRoundShare.template', data, function(html){
                $('#shareList').prepend(html);
            });
        }
        else{
            $('#AllRoundItem-Deadline-'+data.accountId).html(data.deadline);
            $('#AllRoundItem-Share-'+data.accountId).html(data.share);
        }
    }
    sortRowList('shareList','AllRoundItem','AllRoundItem-Share');
    var processed_json = [];
    var other = 0;
      for (var accountId in jsonData){
      data2 = jsonData[accountId];
      if(data2.share > 5) {
              processed_json.push([jsonData[data2.accountId].accountRS, data2.share*100]);
      } else {
        other = parseFloat(other + data2.share);
      }


      }
        processed_json.push(["Rest", other*100]);


    var chart = Highcharts.chart('container3', {
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: 'Historic Shares Distribution'
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: true,
                    format: '<b>{point.name}</b>: {point.percentage:.1f} %'
                }
            }
        },
        series: [{
            name: 'Percentage',
            colorByPoint: true,
            data: processed_json
        }]
    });

}

function onSentList(jsonData){
    $('#lastSentTx').empty();
    var nxt = new NxtAddress();
    for(var i=0 ; i<jsonData.length ; i++){
        jsonData[i].accountRS = jsonData[i].accountId;
        if(nxt.set(jsonData[i].accountId)){
            jsonData[i].accountRS = nxt.toString();
        }
        var momentObj = moment(jsonData[i].sendTime);
        jsonData[i].amountStr = jsonData[i].amount.toFixed(2);
        jsonData[i].sendTimeStr = momentObj.format("DD/MM HH:mm:ss");
        renderTemplate('/templates/RecentPaymentItem.template', jsonData[i], function(html){
            $('#lastSentTx').prepend(html);
        });
    }
}
function getBlocks() {
$.get('poolBlocks.csv', function(data){


  // start the table
  var html = '<table class="table table-striped">';
  html += "  <tr style='font-size: 12px;'><th class=tg-yw4>Block</th><th class=tg-yw4>Created</th><th class=tg-yw4>Time</th><th class=tg-yw4>Generator</th><th class=tg-yw4>Name</th><th class=tg-yw4>Network Difficulty</th><th class=tg-yw4>Miners</th></tr>";

  // split into lines
  var rows = $.grep(data.split("\n"), Boolean).reverse();

  // parse lines
  rows.forEach( function getvalues(ourrow){

    // start a table row
        html += "<tr style='font-size: 12px;'> ";

    // split line into columns
    var columns = ourrow.split(",");

    html += "" + columns[0] + "";
    //html += "<td>" + columns[1] + "</td>";


    // close row
    html += "</tr>";
  })
  // close table
  html += "</table>";

  // insert into div
    $('#container2').append(html);
    //document.getElementById('container').innerHTML = html;

});
$.get('blocksNp.csv', function(data){


    // start the table
    var html = '<table class="table table-striped"   style="font-size: 12px;" >';
    html += "  <tr style='font-size: 12px;'><th class=tg-yw4>Block</th><th class=tg-yw4>Created</th><th class=tg-yw4>Time</th><th class=tg-yw4>Pool</th><th class=tg-yw4>Account-Name</th><th></th></tr>";

    // split into lines
    var rows = $.grep(data.split("\n"), Boolean).reverse();

    // parse lines
    rows.forEach( function getvalues(ourrow){

      // start a table row
          html += "<tr>";

      // split line into columns
      var columns = ourrow.split(",");

      html += "" + columns[0] + "";
      //html += "<td>" + columns[1] + "</td>";


      // close row
      html += "</tr>";
    })
    // close table
    html += "</table>";

    // insert into div
      $('#containers').append(html);
      //document.getElementById('container').innerHTML = html;

  });
$.get('payments.csv', function(data){


  // start the table
  var html = '<table  id="Payout" class="table table-striped">';
  html += '<thead class="table-dark" ><tr><th scope="col">Burst-Address</th><th scope="col">Amount</th><th scope="col">Date</th><th scope="col">Status</th></tr></thead>';


  // split into lines
  var rows = $.grep(data.split("\n"), Boolean).reverse();

  // parse lines
  rows.forEach( function getvalues(ourrow){

    // start a table row
        html += "<tr style='font-size: 12px;'>";

    // split line into columns
    var columns = ourrow.split(",");

    html += "" + columns[0] + "";
    //html += "<td>" + columns[1] + "</td>";


    // close row
    html += "</tr>";
  })
  // close table
  html += "</table>";

  // insert into div
    $('#Payout').append(html);
    //document.getElementById('container').innerHTML = html;

});
$('#container').html("");
  $.get('blocks2.csv', function(data){


  	// start the table
  	var html = '<table class="table table-striped">';
      html += "<tr class='AllRoundItem'><th class=tg-yw4l>Reed-Solomon</th></th><th class=tg-yw4>Amount</th></th>";

  	// split into lines
  	var rows = $.grep(data.split(","), Boolean).reverse();

  	// parse lines
    var again = true;
  	rows.forEach( function getvalues(ourrow){

  		// start a table row
  		    html += "<tr>";

  		// split line into columns
  		var columns = ourrow.split(":");

      var strings  = columns;
      strings = $.grep(data.split(","), Boolean).reverse();

    if(again) {
      again = false;
      for(var i = 0; i < strings.length; i++) {
        var numeric = strings[i].substring(0, strings[i].indexOf(":"));
        var nameRS= numeric;
        var nxt = new NxtAddress();
        if(nxt.set(numeric)){
            nameRS = nxt.toString();

        }
      if(strings[i].substring(strings[i].indexOf(":") + 1) > 20) {
      html += "<tr><td>" + nameRS + "</td>" + "<td>"+ strings[i].substring(strings[i].indexOf(":") + 1); + "</td></tr>";
    }
      }
    }
  		// close row
  		html += "</tr>";

  	})
  	// close table
  	html += "</table>";

  	// insert into div
  	  $('#Networks').html(html);

      //$('#Pending').html("Total Pending: " + totalPending +" <br> Total Miners" + totalPendMiner);
      //document.getElementById('container').innerHTML = html;

  });
}
var userBalance = {};
function onRoundShare(jsonData){
    jsonData.share = jsonData.share.toFixed(2);
    jsonData.balance = '---';

    if(jsonData.deadline == -1){
        jsonData.deadline = "";
        jsonData.deadlineStr = "";
    }
    else {
        var duration = moment.duration(jsonData.deadline * 1000);
        jsonData.deadlineStr = moment.utc(jsonData.deadline*1000).format("HH : mm : ss");
        if (jsonData.deadline > 60 * 60) {
            jsonData.deadlineStr = duration.humanize();
        }
        if (jsonData.deadlineStr == 'Invalid date') {
            jsonData.deadlineStr = '---';
        }
    }
    if(userBalance.hasOwnProperty(jsonData.accountId)){
        jsonData.balance = userBalance[jsonData.accountId].toFixed(1);
    }
    var roundShareRow = $('#CurrentRoundItem-'+jsonData.accountId);
    if(roundShareRow.length <= 0){
        getTemplate('/templates/CurrentRoundShare.template', function(template) {
            jsonData.accountRS = jsonData.accountId;
            var nxt = new NxtAddress();
            if(nxt.set(jsonData.accountId)){
                jsonData.accountRS = nxt.toString();
            }
            var rowHtml = Mustache.render(template, jsonData);
            $('#roundShares').prepend(rowHtml);
        });
    }
    else{
        $('#CurrentRoundItem-Deadline-'+jsonData.accountId).html(jsonData.deadlineStr);
        $('#CurrentRoundItem-Share-'+jsonData.accountId).html(jsonData.share);
    }

    sortRowList('roundShares','CurrentRoundItem','CurrentRoundItem-Share');
}

var logRowCount = 0;
function onLog(data){
    logRowCount++;

    if(logRowCount > 50){

    }
    //$('html, body').animate({ scrollTop: $(document).height() }, 1000);
}

var blockGo = 0;
var skip = false;
function nextPayment(blocks) {
  if(skip == true && blocks > blockGo) {
    return;
  }
  skip = true;
  blockGo = parseInt(blocks);
  var block2 = parseInt(miningInfo.height) + parseInt(blockGo);
  $('#pays').html(block2);
    $('#nextPay').html("Next Payments on Block #" + block2);
}

var miningInfo = {};
function onMiningInfo(jsonData) {
    miningInfo = jsonData;
    updateRoundTime();
}
function rsToName(ID, RS) {
  //var elements = document.getElementsByClassName(ID);
  function loadJSON(callback) {

      var xobj = new XMLHttpRequest();
      xobj.overrideMimeType("application/json");
      xobj.open('GET', 'thing.json', true);
      xobj.onreadystatechange = function() {
          if (xobj.readyState == 4 && xobj.status == "200") {

              // .open will NOT return a value but simply returns undefined in async mode so use a callback
              callback(xobj.responseText);

          }
      }
      xobj.send(null);

  }
  // Call to function with anonymous callback
  loadJSON(function(response) {
      // Do Something with the response e.g.
      var stringify = JSON.parse(response);
      for (var y = 0; y < 2; y++) {
          for(var i = 0; i < stringify.table.length; i++) {
              if(stringify.table[i].id == ID) {
                var names = stringify.table[i].name
                setCookies(ID, names);
                //names = elements[y].innerHTML = names;
                $('#AllRoundItem-Name-'+ID).html(names);
		break;
              }
          }

          //names = elements[y].innerHTML = names;
      }


        });
}
function updateRoundTime(){
    if(miningInfo.hasOwnProperty('height')){
        var currentTime   = new Date().getTime();
        var roundStart    = miningInfo.roundStart;
        var bestDeadline  = miningInfo.bestDeadline*1000;
        var targetTime    = roundStart + bestDeadline;
        var elapsed       = currentTime - roundStart;
        var progress      = 100 * elapsed / bestDeadline;

        var momentDeadline = moment.utc(bestDeadline).format("HH:mm:ss.S");
        var momentElapsed  = moment.utc(elapsed).format("HH:mm:ss.S");

        var cap =0;
		    cap =(miningInfo.poolCapacity/1048576).toFixed(2);
		    //Against Header-Manipulation
		    if(cap>0) {
          $('#cap').html((cap/10).toFixed(2));
        }
        else {
          $('#cap').html(cap);
        }

        $('#BestDeadlineLabel').html(momentDeadline);
        $('#RoundElapseTimeLabel').html(momentElapsed);
        $('#CurrentBlockLabel').html(miningInfo.height);
        $('#NetDiffLabel').html(miningInfo.netDiff.toFixed(1));
        $('#MinersLabel').html(miningInfo.submitters);
        $('#TotalShareLabel').html(miningInfo.totalShare.toFixed(3));
    }
}
var data;

function initTemplateCache(done){
    getTemplate('/templates/CurrentRoundShare.template', function(template) {
        getTemplate('/templates/AllRoundShare.template', function(template){
            getTemplate('/templates/RecentPaymentItem.template', function(template){
                done();
            });
        });
    });
}

$(document).ready(function(){
    initTemplateCache(function(){
      var serverUrl = window.location.protocol+'//'+location.hostname+':8880';
      var socket = io.connect(serverUrl,{"force new connection":true, transports:['websocket']});
        var root = $('body');

        root.on('click','.chartGroupSelectorBtn',function(event){
            var id = event.target.id;
            var group = id.split('-')[1];
            var statId = id.split('-')[2];

            $('.chartGroupBtn-'+group).removeClass('chartGroupSelectorBtnActive');
            $('#'+id).addClass('chartGroupSelectorBtnActive');

            $('.canvasArea-'+group).hide();
            $('#chartContainer-'+statId).show();

        });

        socket.on('log', onLog);

                   socket.on('ping', function(data){
                       socket.emit('pong', {beat: 1});
                   });

                   socket.on('sentList', function(data){
                       var jsonData = JSON.parse(data);
                       onSentList(jsonData);
                   });

                   socket.on('shareList',function(data){
                       var jsonData = JSON.parse(data);
                       onShareList(jsonData);
                       setJsonAllround(jsonData);
                   });

                   socket.on('miningInfo', function(data){
                       var jsonData = JSON.parse(data);
                       onMiningInfo(jsonData);
                   });

                   socket.on('roundShares', function(data){
                       var jsonData = JSON.parse(data);
                       onRoundShare(jsonData);
                   });

                   socket.on('blockHistory', function(data){
                       var jsonData = JSON.parse(data);
                       blockHistory = jsonData;

                   });

                   socket.on('balance', function(data){
                       var jsonData = JSON.parse(data);
                       userBalance = jsonData;
                   });

                   socket.on('submitNonce', function(data){
                       var jsonData = JSON.parse(data);
                       console.log(jsonData);
                   });
				     socket.on('nextPayment', function(data){
                     nextPayment(data);
                   });

        $('#chatInput').keypress(function(e) {
            if(e.which == 13) {
                var text = escapeHtml($('#chatInput').val());
                if(text.length > 256){
                    text = text.substring(0, 255);
                }

                socket.emit('chat',text);
                $('#chatInput').val('');
            }
        });

        setInterval(updateRoundTime,100);
    });
});
