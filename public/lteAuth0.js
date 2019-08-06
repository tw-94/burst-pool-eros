function getBal(name) {
$.get('blocks2.csv', function(data){


  // start the table
  var html = '<table class="table ">';
    html += "<tr class='AllRoundItem'><th class='box'>Reed-Solomon</th></th><th class='box'>Balance</th></th>";

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
      var nameRS = name;

      var add = nameRS;
			if(add == numeric) {
							  var bal = parseInt(strings[i].substring(strings[i].indexOf(":") + 1)).toFixed(2) + " Burst";
								$('#bal').html(bal);
								var next = (bal / 20) * 100;
								$('#next').html(next);

                      var progress = (parseInt(strings[i].substring(strings[i].indexOf(":") + 1)) / 21.5 * 100).toFixed(2) + "%";
                      $('#proc').html(progress);
                      document.getElementById('progress').setAttribute("style",`width:${progress}`);

			}
      var nxt = new NxtAddress();
      if(nxt.set(numeric)){
          var nameRS2 = nxt.toString();
      }
      if(nameRS2 == nameRS) {
      if(nxt.set(numeric)){
          nameRS = nxt.toString();

      }

  }
  }

  }
    // close row
    html += "</tr>";

  })
  // close table
  html += "</table>";

  // insert into div



    //$('#Pending').html("Total Pending: " + totalPending +" <br> Total Miners" + totalPendMiner);
    //document.getElementById('container').innerHTML = html;

});
}
function getPoolBlocks() {
  $.get('blocks.csv', function(data){


    // start the table
    var html = '<table id="pool" class="table">';
    html += "  <tr><th class=tg-yw4>Block</th><th class=tg-yw4>Block Created</th><th class=tg-yw4>Time</th><th class=tg-yw4>Reed-Solomon</th><th class=tg-yw4>Account-Name</th><th class=tg-yw4>Network Difficulty</th><th class=tg-yw4>Submitters</th></tr>";

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
      $('#container2').append(html);
      //document.getElementById('container').innerHTML = html;

  });
}
