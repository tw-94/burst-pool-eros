#!/usr/bin/env node
var fs = require('fs');
var url = require('url');
var moment = require('moment');
var config = require('./burst-pool-config');
var poolSession = require('./burst-pool-session');
var poolShare = require('./burst-pool-share');
var poolPayment = require('./burst-pool-payment');
var poolProtocol = require('./burst-pool-protocol');
var async = require('async');


function addExtraData(cumulativeShare) {
    for (var accountId in cumulativeShare) {
        cumulativeShare[accountId].balance = poolPayment.getAccountPending(accountId);
    }
    return cumulativeShare;
}

function onNewBlock(miningInfo) {
    poolProtocol.clientLog('<strong style="color:blue">New block #' + miningInfo.height + ' Difficulty:' + poolSession.getNetDiff() + '</strong>');

    try {
        poolSession.updateByNewBlock(miningInfo.height, miningInfo.baseTarget, function () {
            poolShare.deleteRoundShareByDistance(config.maxRoundCount);
            poolShare.deleteAccountShareBelowThresshold(1.0, config.maxRoundCount);
            poolShare.saveSession();
            poolShare.updateByNewBlock(miningInfo.height, miningInfo.baseTarget);
            poolPayment.updateByNewBlock(miningInfo.height);
            poolPayment.saveSession();
            poolSession.saveSession();
            logMiningRound();
            poolPayment.writeToCsv();
            console.log('new block #' + miningInfo.height + ' BT:' + miningInfo.baseTarget + ' ND:' + poolSession.getNetDiff());
            var cumulativeShare = addExtraData(poolShare.getCumulativeShares());
            poolProtocol.getWebsocket().emit('shareList', JSON.stringify(cumulativeShare));
            poolProtocol.getWebsocket().emit('blockHistory', JSON.stringify(poolSession.getState().prevBlocks));
        });
    }
    catch (e) {
        console.log(e);
        console.trace();
    }
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
function logMiningRound(socket) {
    var blockHeight = poolSession.getCurrentBlockHeight();
    var roundStart = poolSession.getCurrentRoundStartTime();
    var currentTime = new Date().getTime();
    var elapsed = currentTime - roundStart;
    var duration = moment.duration(elapsed).humanize(true);
    var roundShare = poolShare.getCurrentRoundShares();
    var submitters = roundShare.submitters;
    var netDiff = poolSession.getNetDiff();
    var sessionState = poolSession.getState();
    var miningInfo = {
        height: blockHeight,
        currentTime: currentTime,
        totalShare: roundShare.totalShare,
        submitters: roundShare.submitters,
        historicShares: poolShare.getTotalCumulativeShares(),
        roundStart: roundStart,
        netDiff: netDiff,
        bestDeadline: sessionState.current.bestDeadline
    };
    sessionState.current.submitters = roundShare.submitters;
    sessionState.current.totalShare = roundShare.totalShare;
    miningInfo.poolCapacity = poolShare.getPoolCapacity();
    miningInfo.poolBalance = poolPayment.getStoredBalance().toFixed(0);
    miningInfo.poolPendingBalance = poolPayment.getPendingBalance().toFixed(0);

    if (typeof socket === 'undefined') {
        poolProtocol.getWebsocket().emit('miningInfo', JSON.stringify(miningInfo));
        poolProtocol.clientLog("round #" + blockHeight + " diff " + netDiff.toFixed(1) + ", elapsed " + duration + ", " + submitters + " Miners, total shares " + roundShare.totalShare.toFixed(2) + ', best deadline ' + roundShare.bestDeadline + ' from ' + roundShare.bestDeadlineAccount);
    }
    else {
        socket.emit('miningInfo', JSON.stringify(miningInfo));
        poolProtocol.clientUnicastLog(socket, "round #" + blockHeight + " diff " + netDiff.toFixed(1) + ", elapsed " + duration + ", " + submitters + " Miners, total shares " + roundShare.totalShare.toFixed(2) + ', best deadline ' + roundShare.bestDeadline + ' from ' + roundShare.bestDeadlineAccount);
    }
}

function onNonceSubmitReq(req) {

    var minerReq = null;
    try {
        minerReq = url.parse(req.url, true);
    }
    catch (e) {
        minerReq = null;
    }

    if (minerReq != null &&
        Object.prototype.hasOwnProperty.call(minerReq, 'query') &&
        Object.prototype.hasOwnProperty.call(minerReq.query, 'requestType')) {
        if (minerReq.query.requestType.toLowerCase() == 'submitnonce') {

            var remoteAddr = req.connection.remoteAddress + ':' + req.connection.remotePort;
            var minerData = {
                nonce: 0,
                from: remoteAddr,
                xMiner: ''

            };
            req.url = '/burst?requestType=submitNonce';

            if (Object.prototype.hasOwnProperty.call(minerReq.query, 'nonce')) {
                req.url += '&nonce=' + minerReq.query.nonce;
                minerData.nonce = parseInt(minerReq.query.nonce);
            }
            if (req.headers.hasOwnProperty('x-miner')) {
                minerData.xMiner = req.headers['x-miner'];
            }

            if (req.headers.hasOwnProperty('x-capacity')) {
                poolShare.AddCapacity(minerReq.query.accountId, req.connection.remoteAddress, req.headers['x-capacity'], poolSession.getCurrentBlockHeight(), req.headers['x-miner']);
            }
            if (Object.prototype.hasOwnProperty.call(minerReq.query, 'accountId')) { //<------ POOL MINING
                req.url += '&accountId=' + minerReq.query.accountId;
                minerData.accountId = minerReq.query.accountId;

                minerReq.query.secretPhrase = config.poolPvtKey;
                req.url += '&secretPhrase=' + config.poolPvtKey;
            }
            else {
                if (Object.prototype.hasOwnProperty.call(minerReq.query, 'secretPhrase')) { //<----- SOLO MINING
                    var urlPhrase = minerReq.query.secretPhrase.replace(/%2B|%2b/g, '+');
                    req.url += '&secretPhrase=' + urlPhrase;
                }
            }

            req.isSubmitNonce = true;
            req.headers['content-length'] = "0";
            req.minerData = minerData;
        }
        else if (minerReq.query.requestType.toLowerCase() == 'getmininginfo') {
            req.isMiningInfo = true;
        } else if (minerReq.query.requestType.toLowerCase() == 'getrewardrecipient' || minerReq.query.requestType.toLowerCase() == 'getblock' || minerReq.query.requestType.toLowerCase() == 'getblockchainstatus' || minerReq.query.requestType.toLowerCase() == 'getaccount' || minerReq.query.requestType.toLowerCase() == 'getaccountidsofrewardrecipient' || minerReq.query.requestType.toLowerCase() == 'getaccountswithrewardrecipient' || minerReq.query.requestType.toLowerCase() == 'getbalance') {
            req.ApprovedProxifyRequest = true;
        }
        // console.log(minerReq.query.requestType.toLowerCase());
    }

}

function onNonceSubmitedRes(req, res) {
    if (req.hasOwnProperty('minerData')) {
        if (res.hasOwnProperty('deadline') &&
            req.minerData.hasOwnProperty('accountId')) {

            var deadline = parseInt(res.deadline);
            if (deadline > config.maxDeadline) {
			console.log("Miner Deadline: " + deadline + " rejected");

			} else {

            var accountId = req.minerData.accountId;
            process.nextTick(function () {
                req.minerData.deadline = deadline;
                req.minerData.submission = res.result;

                poolShare.updateByNewDeadline(accountId, deadline);

                var accountShare = poolShare.getAccountShare(accountId);
                if (accountShare != null) {
                    poolProtocol.getWebsocket().emit('roundShares', JSON.stringify(accountShare));
                }

                var sessionState = poolSession.getState();

                var currentTime = new Date().getTime();
                var miningInfo = {
                    height: sessionState.current.blockHeight,
                    currentTime: currentTime,
                    totalShare: sessionState.current.totalShare,
                    submitters: sessionState.current.submitters,
                    historicShares: poolShare.getTotalCumulativeShares(),
                    roundStart: sessionState.current.startTime,
                    netDiff: poolSession.getNetDiff(),
                    bestDeadline: sessionState.current.bestDeadline
                };
		miningInfo.poolCapacity = poolShare.getPoolCapacity();
    		miningInfo.poolBalance=poolPayment.getStoredBalance().toFixed(0);
    		miningInfo.poolPendingBalance=poolPayment.getPendingBalance().toFixed(0);

                if (sessionState.current.bestDeadline > deadline) {
                    sessionState.current.bestDeadline = deadline;
                    console.log('new best deadline ' + sessionState.current.bestDeadline);
                    poolProtocol.getWebsocket().emit('miningInfo', JSON.stringify(miningInfo));
                    var minerPic = '<img src="Hopstarter-Button-Button-Help.ico" alt="' + req.minerData.xMiner + '" style="width:20px;height:20px;">';
                    if (req.minerData.xMiner.startsWith('Blago')) {
                        minerPic = '<img src="Untitled-1.png" alt="' + req.minerData.xMiner + '" style="width:20px;height:20px;">'
                    } else if (req.minerData.xMiner.startsWith('IBAndroid')) {
                        minerPic = '<img src="http://storage.googleapis.com/ix_choosemuse/uploads/2016/02/android-logo.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    else if (req.minerData.xMiner.toString().startsWith('burstcoin-jminer')) {
                        minerPic = '<img src="Jminer.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    else if (req.minerData.xMiner.startsWith('creepsky')) {
                        minerPic = '<img src="cat_tied.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    //   poolProtocol.clientLog("new best deadline : #"+poolSession.getCurrentBlockHeight());
                    poolProtocol.clientLogFormatted('<span class="logLine time">' + getDateTime() + '</span>' + minerPic + '<span class="logLine"> Best deadline = </span><span class="logLine deadline">' + moment.duration(req.minerData.deadline * 1000).humanize(false) + '</span><span class="logLine"> by Burst ID: </span><span class="logLine accountName"><a href="https://block.burstcoin.info/acc.php?acc=' + req.minerData.accountId + '" target=_blank>' + req.minerData.accountId + '</a></span>');

                }
                if (sessionState.current.bestDeadline == -1) {
                    sessionState.current.bestDeadline = deadline;
                    console.log('new best deadline ' + sessionState.current.bestDeadline);
                    poolProtocol.getWebsocket().emit('miningInfo', JSON.stringify(miningInfo));
                    var minerPic = '<img src="Hopstarter-Button-Button-Help.ico" alt="' + req.minerData.xMiner + '" style="width:20px;height:20px;">';
                    if (req.minerData.xMiner.startsWith('Blago')) {
                        minerPic = '<img src="Untitled-1.png" alt="' + req.minerData.xMiner + '" style="width:20px;height:20px;">'
                    } else if (req.minerData.xMiner.startsWith('IBAndroid')) {
                        minerPic = '<img src="http://storage.googleapis.com/ix_choosemuse/uploads/2016/02/android-logo.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    else if (req.minerData.xMiner.startsWith('burstcoin-jminer')) {
                        minerPic = '<img src="Jminer.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    else if (req.minerData.xMiner.startsWith('creepsky')) {
                        minerPic = '<img src="cat_tied.png" alt="' + req.minerData.xMiner + ' " style="width:20px;height:20px;">'
                    }
                    //poolProtocol.clientLog("new best deadline : #"+poolSession.getCurrentBlockHeight());
                    poolProtocol.clientLogFormatted('<span class="logLine time">' + getDateTime() + '</span>' + minerPic + '<span class="logLine"> Best deadline = </span><span class="logLine deadline">' + moment.duration(req.minerData.deadline * 1000).humanize(false) + '</span><span class="logLine"> by Burst ID: </span><span class="logLine accountName"><a href="https://block.burstcoin.info/acc.php?acc=' + req.minerData.accountId + '" target=_blank>' + req.minerData.accountId + '</a></span>');

                }
            });
        }
		}
    }
}


function onMiningInfoUpdate(res) {

    var miningInfo = res;

    if (poolSession.getCurrentBlockHeight() < miningInfo.height) {
        onNewBlock(miningInfo);
    }
}

function onNewClientConnected(socket) {
    var clientIp = socket.request.connection.remoteAddress;
    var clientPort = socket.request.connection.remotePort;

    socket.on('chat', function (msg) {
	clientIp=socket.conn.transport.socket._socket.remoteAddress;
	onWebsocketClientChat(clientIp, msg);
    });

    socket.on('disconnect', function () {
        //console.log('viewer disconnected from '+clientIp+":"+clientPort);
    });

 	logMiningRound(socket);
	var roundShare = poolShare.getCurrentRoundShares();
	for (var accountId in roundShare) {
		var rs=roundShare[accountId][0];
		if(typeof rs !== 'undefined'){
			if(rs.share>0){
				socket.emit('roundShares', JSON.stringify(rs));
			}
		}
	}
    var cumulativeShare = addExtraData(poolShare.getCumulativeShares());
    socket.emit('shareList', JSON.stringify(cumulativeShare));
    socket.emit('sentList', JSON.stringify(poolPayment.getPaidList()));
    socket.emit('blockHistory', JSON.stringify(poolSession.getState().prevBlocks));
    socket.emit('nextPayment', poolPayment.getNextPayout());
}

function onWebsocketClientChat(clientIp, msg) {
    var textMsg = msg;
    if (textMsg.length > 256) {
        textMsg = textMsg.substring(0, 255);
    }
    poolProtocol.clientLog(clientIp + ' : ' + '<span class="chatMsg">' + textMsg + '</span>');
}

function saveSession() {
    poolShare.saveSession();
    poolPayment.saveSession();
    poolSession.saveSession();
    logMiningRound();
}

function initPool(walletNdx) {
    poolSession.setWalletNdx(walletNdx);
    poolSession.WalletChecker();
    poolSession.init(function () {
        async.parallel(
            [
                function (callback) {
                    poolPayment.loadSession(function () {
                        poolPayment.getBalance(function (res) { });
                        callback();
                    })
                },
                function (callback) {
                    poolShare.loadSession(function () {
                        callback();
                    });
                }
            ],
            function (err, results) {
                poolProtocol.start(onNonceSubmitReq, onNonceSubmitedRes, onNewClientConnected);
                setInterval(saveSession, 60000);
                setInterval(function () {
                    poolSession.getMiningInfo(function (result) {
                        if (result.status === true) {
                            onMiningInfoUpdate(result.msg);
                        }
                    });
                }, 1000);
            }
        );
    });
}

initPool(config.walletIndex);

process.stdin.resume();

function exitHandler(options, err) {
    poolShare.saveSession();
    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
