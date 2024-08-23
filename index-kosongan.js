const Client = require('./src/Client');
//var manager = require('./src/db');
//const qrcode = require('qrcode-terminal');
//var client;
var colors = require('colors');
const S = require('string');
const md5 = require('md5');
const sha1 = require('sha1');
const moment = require('moment');
require('dotenv').config();
var masterk;
var isAuthenticated = false;
const Reaction = require('./src/structures/Reaction');



   const client = new Client({ puppeteer: { headless: false ,
								args:[ "--disable-gpu",
					"--renderer",
					"--no-sandbox",
					"--no-service-autorun",
					"--no-experiments",
					"--no-default-browser-check",
					"--disable-webgl",
					"--disable-threaded-animation",
					"--disable-threaded-scrolling",
					"--disable-in-process-stack-traces",
					"--disable-histogram-customizer",
					"--disable-gl-extensions",
					"--disable-extensions",
					"--disable-composited-antialiasing",
					"--disable-canvas-aa",
					"--disable-3d-apis",
					"--disable-accelerated-2d-canvas",
					"--disable-accelerated-jpeg-decoding",
					"--disable-accelerated-mjpeg-decode",
					"--disable-app-list-dismiss-on-blur",
					"--disable-accelerated-video-decode",
					"--num-raster-threads=1",
					]
					}, clientId: 'wanode'
					});

    console.log('initialize....');

client.initialize();
client.on('loading_screen', (percent, message) => {
    console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
    // NOTE: This event will not be fired if a session is specified.
    console.log('QR RECEIVED', qr);
	//qrcode.generate(qr, {big: true}, (qrcode) => console.log(qrcode));
});

client.on('authenticated', () => {
    console.log('AUTHENTICATED');
});


client.on('auth_failure', msg => {
    // Fired if session restore was unsuccessfull
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
    console.log('READY');
});


client.on('message', async msg => {
    console.log('MESSAGE RECEIVED', msg);

    if (msg.body === 'p') {
        // Send a new message as a reply to the current one
        msg.reply('pong');
	}
});

client.on('message_ack', (msg, ack) => {
    /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

    if(ack == 3) {
        // The message was read
    }
});

let rejectCalls = true;

client.on('call', async (call) => {
    console.log('Call received, rejecting. GOTO Line 261 to disable', call);
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call. ${rejectCalls ? process.env.PESAN_TELP : ''}`);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});
