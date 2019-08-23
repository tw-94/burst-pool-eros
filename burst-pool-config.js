module.exports = {
    //Main Wallet
    wallets : [
        {
            walletIP : '127.0.0.1',
            walletPort : 8125,
            walletUrl : 'http://testnet.getburst.net:6876'
        }
    ],
  //Backend wallet, if other stuck
	wallets2 : [
        {
            walletIP : '127.0.0.1',
            walletPort : 8126,
            walletUrl : 'http://testnet.getburst.net:6876'
        }
    ],
    //Wallet for Payments
    wallets3 : [
        {
            walletIP : '127.0.0.1',
            walletPort : 8127,
            walletUrl : 'https://wallet.burst-alliance.org:8125'
        }
    ],
    redirection : {
        enabled : false,
        target : 'https://wallet.burst-alliance.org:8125'
    },
    //Choose wallet of wallet index Range[0-2]
    walletIndex: 0,
    //Blocks before distribute block
    blockMature : 10,
    //Tax Fee
    txFeePercent : 0.005,
    //Support the Eros work with a little share of the reward
    devFee : false,
    //Pool Fee
    poolFee : 0.030,
    //Pool Difficulty
    poolDiff : 1000000,
    //Pool Difficulty Curve, higher values reduce shares
    poolDiffCurve : 0.75,
    //Pool Port Mining
    poolPort : 8080,
    //Passphrase from Pool-Account
    poolPvtKey : '',
    //Public RS from Pool-Account
    poolPublicRS : 'BURST-',
    //Numeric Id from Pool-Account
    poolPublic : '',
    //Pool Fee Add
    poolFeePaymentAddr : '2085623156516501518',
    //Payment Deadline: maximal: 1440 | minimal: 0
    defaultPaymentDeadline : 1440,
    //Pool Fee Payment (0.1 Burst)
    poolFeePaymentTxFeeNQT : 100000000,
    //Backend Port, not used
    httpPort : 82,
    //Frontend Port
    FrontendHttpPort : 80,
    //Websocket Port for index.js
    websocketPort : 8880,
    //Blocks before pay balance [Next Payment Round]
    payoutDelay: 30,
    //Optional to disable | enable payments
    enablePayment : true,
    //Dont change this values
    minimumPayout : 14000.0,
    clearingMinPayout : 20000.0,
    //Clear Payout after certain block
    clearPending: 20,	
    //End of not change area
    lastSessionFile : 'last-session.json',
    //Distribution Current Shares: 1-cumulativeFundReduction | Historic Shares: cumulativeFundReduction
    cumulativeFundReduction : 0.85,
    //Option to disable | enable log
    logWebsocketToConsole : false,
    //Maximal Datas of blocks
    maxRoundCount : 75,
    //Share Penalty if higher than pool deadline
    sharePenalty : 0.001,
    //List of maximal entries from payment
    maxRecentPaymentHistory : 80,
    //Pool Deadline, above rejected
    maxDeadline: 31536000,
    /**
    New Configuration Options for Eros-Frontend
    */
    //variable: none | block
    displayDiscordIcon: 'block',
    //Discord Link
    discordInvite: 'https://discord.gg/',
    //Minimal Balance for distribution for Frontend Information
    minThreshold: 20,
    //Pool URL
    url: 'http://www.poolUrl.com',
    //Logo Path
    logoURL: '/logox.png',
    //Choose background color in hex format | color word
    navigationDesign: 'white',
    //max Request per second
    maxRequest: 150,
    //max caching
    maxCache: 5000,
    //max sockets
    maxSockets: 1000,
    //Whitelist Ips
    whiteList: [
        {
      ip : '',
      ip2 : '',
	    ip3 : '127.0.0.1',
        }
    ],
  //Blacklist certain Ip
	blackList: [
        {
      ip : '',
      ip2 : '',
			ip3 : '',
			ip4: '',
			ip5: '',
			ip6: '',
			ip7: '',
			ip8: '',
			ip9: '',
			ip10: '',
			ip11: '',
			ip12: '',
			ip13: '',
			ip14: '',
			ip15: '',
        }
    ],
};
