var fs = require('fs');

var enabled = true;
var toConsole = true;
var toFile = true;
var toGeneralFile = true;
var generalLogFilename = 'log_general.txt';

function TimeStamp() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return year + "-" + month + "-" + day + "_" + hour + "-" + min + "-" + sec;
}
function TimeStampFile() {
    var date = new Date();
    var hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;
    var min  = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;
    var sec  = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;
    var day  = date.getDate();
    day = (day < 10 ? "0" : "") + day;
    return  day+ "-" + month + "-" + year;
}

function write(name,text){
	if (enabled){
		if (toFile){
			fs.appendFile('log_'+name+'.txt', TimeStamp()+' '+text+'\n', function (err) {
				if (err) throw err;
			});
		}
		if (toGeneralFile){
			fs.appendFile(generalLogFilename, TimeStamp()+' ('+name+') '+text+'\n', function (err) {
				if (err) throw err;
			});
		}
		if (toConsole){
			console.log('(logger.'+name+") "+text)
		}
	}
}
function writeDateLog(text){
    	if (enabled){

    		if (toFile){
    		fs.exists('./Logs/log_'+TimeStampFile()+'.txt', function(exists) {
              if (exists) {
                	fs.appendFile('./Logs/log_'+TimeStampFile()+'.txt', TimeStamp()+' '+text+'\n', function (err) {
                    				if (err) throw err;
                    			});
              } else {
              fs.writeFile('./Logs/log_'+TimeStampFile()+'.txt', TimeStamp()+' '+text+'\n', function(err) {
                  if(err) {
                      return console.log(err);
                  }

                //  console.log("The file was saved!");
              });
              }
            });

    		}

    	}
    }
module.exports = {
	write : write,
	writeDateLog:writeDateLog,
	TimeStamp : TimeStamp
};
