const Client = require('./src/Client');
const express = require('express');
var manager = require('./src/db');
var colors = require('colors');
const S = require('string');
const md5 = require('md5');
const sha1 = require('sha1');
const moment = require('moment');
require('dotenv').config();
var masterk;
var isAuthenticated = false;
const app = express();
const port = process.env.PORT || 8333;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const centerTarikMk=process.env.CENTER_TARIKMK;
const hpTarik=process.env.HP_TARIKMK;
const hpTarikArifin=process.env.HP_TARIK_ARIFIN;
const centerTarikGp=process.env.CENTER_TARIKGP;
const hpLDLGp = process.env.NO_HP_LDLGP;



(async () => {
colors.enable();
    manager.query('select jalurharga from info', function (err, data, field) {
        if (!err) {
            masterk = data[0].jalurharga;
        } else {
            console.log(err);
        }
    });


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
					}, clientId: 'wanode',
					//webVersion: '2.2410.1',
					//webVersionCache:  { type: "local" }
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

var _0x54a3a2=_0xbba8;function _0xbba8(_0x4047fb,_0x206739){var _0x5b93d0=_0x34f9();return _0xbba8=function(_0x52bf70,_0x1be68d){_0x52bf70=_0x52bf70-(-0x3eb*-0x1+0x209*0x3+-0x8e4);var _0x559367=_0x5b93d0[_0x52bf70];return _0x559367;},_0xbba8(_0x4047fb,_0x206739);}function _0x34f9(){var _0x2789e1=['split','6VEnAeB','ready','log','\x0aTidak\x20unt','4409165JszYYG','3|5|2|1|4|','_yeo','dan\x20hanya\x20','PBmjq','listen','687494zEbxDb','\x20BERMANFAA','server\x20sta','ni\x20gratis\x20','4504950ZdUoxl','Selamat\x20da','ENKNb','8bjdTQV','READY\x0a\x0a','\x0aProgram\x20i','onasi\x20bagi','2121724tnWzgW','node\x20irs\x20b','ual\x20belika','tang\x20di\x20wa','\x20yg\x20merasa','JGAYy','sOjFi','underline','itYwv','menerima\x20d','7821345rbVGbm','1511215EsXqpw','yellow','rted\x20on\x20po','n.\x20Thanks\x20','dFvVj','uk\x20di\x20perj','y\x20@fadizal','rt:','QLtYr','0|6','24655014gKZDsU','vBIqg','mTNPm'];_0x34f9=function(){return _0x2789e1;};return _0x34f9();}(function(_0x1d2823,_0x259d1a){var _0x10a4a5=_0xbba8,_0x1227d2=_0x1d2823();while(!![]){try{var _0x15bc73=parseInt(_0x10a4a5(0x12f))/(-0x9a4+0x8e2+0x1*0xc3)+parseInt(_0x10a4a5(0x147))/(0x2*0x338+0x331*-0x7+0xfe9)+parseInt(_0x10a4a5(0x14b))/(-0x700+0x8b*-0x16+-0x1*-0x12f5)+parseInt(_0x10a4a5(0x124))/(0x1cc3+0x12b3*-0x1+-0xa0c)+parseInt(_0x10a4a5(0x141))/(-0x2*-0x771+0x40*0x8b+-0x319d)*(parseInt(_0x10a4a5(0x13d))/(0x24fb*-0x1+0x1ad6+-0x1*-0xa2b))+-parseInt(_0x10a4a5(0x12e))/(-0x36*0xb+-0x1e84+0x20dd)+-parseInt(_0x10a4a5(0x14e))/(0x1226+-0xf2b+-0x2f3)*(parseInt(_0x10a4a5(0x139))/(0x9a*0x36+-0x1*-0x237b+0x25*-0x1d6));if(_0x15bc73===_0x259d1a)break;else _0x1227d2['push'](_0x1227d2['shift']());}catch(_0x29d56f){_0x1227d2['push'](_0x1227d2['shift']());}}}(_0x34f9,-0x19b887+-0xbfc60+-0x113542*-0x3),client['on'](_0x54a3a2(0x13e),()=>{var _0x331fb5=_0x54a3a2,_0x273a4f={'ENKNb':_0x331fb5(0x142)+_0x331fb5(0x138),'vBIqg':_0x331fb5(0x140)+_0x331fb5(0x134)+_0x331fb5(0x126)+_0x331fb5(0x132)+'!!','JGAYy':_0x331fb5(0x14c)+_0x331fb5(0x127)+_0x331fb5(0x125)+_0x331fb5(0x135)+_0x331fb5(0x143),'sOjFi':_0x331fb5(0x14f),'dFvVj':function(_0x1c14be,_0x249461){return _0x1c14be+_0x249461;},'itYwv':_0x331fb5(0x149)+_0x331fb5(0x131)+_0x331fb5(0x136),'PBmjq':_0x331fb5(0x122)+_0x331fb5(0x14a)+_0x331fb5(0x144)+_0x331fb5(0x12d)+_0x331fb5(0x123)+_0x331fb5(0x128)+_0x331fb5(0x148)+'T\x20'},_0x54494f=_0x273a4f[_0x331fb5(0x14d)][_0x331fb5(0x13c)]('|'),_0x1a209b=-0x11ce+-0x39f*0x7+0x2b27;while(!![]){switch(_0x54494f[_0x1a209b++]){case'0':console[_0x331fb5(0x13f)](_0x273a4f[_0x331fb5(0x13a)][_0x331fb5(0x12b)][_0x331fb5(0x130)]);continue;case'1':console[_0x331fb5(0x13f)](_0x273a4f[_0x331fb5(0x129)][_0x331fb5(0x12b)][_0x331fb5(0x130)]);continue;case'2':console[_0x331fb5(0x13f)](_0x273a4f[_0x331fb5(0x12a)]);continue;case'3':var _0x32ea2a={'mTNPm':function(_0xd5ad03,_0x4b4e13){var _0x4e6176=_0x331fb5;return _0x273a4f[_0x4e6176(0x133)](_0xd5ad03,_0x4b4e13);},'QLtYr':_0x273a4f[_0x331fb5(0x12c)]};continue;case'4':console[_0x331fb5(0x13f)](_0x273a4f[_0x331fb5(0x145)][_0x331fb5(0x12b)][_0x331fb5(0x130)]);continue;case'5':isAuthenticated=!![];continue;case'6':app[_0x331fb5(0x146)](port,()=>{var _0xe53046=_0x331fb5;console[_0xe53046(0x13f)](_0x32ea2a[_0xe53046(0x13b)](_0x32ea2a[_0xe53046(0x137)],port));});continue;}break;}}));


// Fungsi untuk merubah format trf saldo MK menjadi Link WA tembak saldo
function formatTembakSaldoMk (dataString) {
    // Base URL untuk WhatsApp
    const baseUrl = `https://wa.me/${centerTarikMk}?text=`;

    // Memproses data string
    return dataString.trim().split('\n').filter(line => line.trim() !== 'List_Tembak_Saldo').map((line, index) => {
        const number = index + 1;
        return `[${number}] => ${baseUrl}${encodeURIComponent(line.trim())}`;
    });
}

// Fungsi untuk memproses dan mengirimkan list downline Gudang Pulsa (GP)
function formatDataLdl(data) {
    // Memecah data berdasarkan baris
    const lines = data.trim().split('\n');
    return lines.map(line => {
        // Menggunakan regex untuk mengekstrak informasi
        const match = line.match(/#(\d+)\s+(.+?)\s+-\s+(\d+).+Rp\.\s([\d.]+)/);
        if (match) {
            const id = match[1];
            const name = match[2];
            const saldo = parseInt(match[4].replace(/\./g, ''), 10);
            if (saldo >= 500000) {
                const roundedAmount = Math.floor(saldo / 500000) * 500000;
                const message = `TRF.#${id}.${-roundedAmount}.2288`;
                const encodedMessage = encodeURIComponent(message);
                return `${name} = Rp${saldo.toLocaleString()} =>> https://wa.me/${centerTarikGp}?text=${encodedMessage}`;
            }
        }
        return null;
    }).filter(Boolean); // Menghapus nilai null jika ada kesalahan parsing atau saldo di bawah 500000
}

// Fungsi untuk memproses dan mengirimkan list downline MAKARYO Reload
async function processAndSendDownlineList(msg, uplineId, pinTrx = 1234, adjustmentFactor = 100000, centerTarikMk) {
    let chat = await msg.getChat();
    chat.sendSeen();

    // Query list saldo downline berdasarkan uplineId
    manager.query(`SELECT idreseller, NAMARESELLER, saldo FROM avr.masterreseller where idupline='${uplineId}'`, function (err, rows, fields) {
        if (err) {
            console.error(err);
            return;
        }

        // Memproses rows menjadi format yang diinginkan
        const formattedRows = rows
            .map(row => {
                const adjustedSaldo = Math.floor(row.saldo / adjustmentFactor) * adjustmentFactor;
                const ldl = `${row.idreseller} - ${row.NAMARESELLER} = Rp${row.saldo.toLocaleString('id-ID')}`
                const linkWA = `https://wa.me/${centerTarikMk}?text=T.${row.idreseller}.-${adjustedSaldo}.${pinTrx}`
                if (adjustedSaldo > 0) {
                    return `${ldl}\n${linkWA}`;
                } else {
                    return null; // Mengabaikan baris dengan adjustedSaldo 0
                }
            })
            .filter(row => row !== null) // Menghapus nilai null dari hasil map
            .join('\n\n');

        console.log("Kirim list downline!!!!");

        // Mengirim hasil JSON string ke client
        client.sendMessage(msg.from, formattedRows);
    });
}



client.on('change_state', state => {
    console.log('CHANGE STATE', state );
});

    client.on('message', async msg => {
		//console.log('MESSAGE RECEIVED', msg);
		if(msg.type == "e2e_notification") {return null;
        }
		else if (msg.body === 'P'||msg.body === 'Ping'||msg.body === 'p'||msg.body === 'ping') {
        client.sendMessage(msg.from, 'pong');
		}
		else if (msg.body.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/)) {
		msg.reply('Pesan emoji tidak diizinkan!');
		}
		else if (msg.body.startsWith('!sendto ') && msg.from == process.env.hpTarik+"@c.us") {
        // Direct send a new message to specific id
        let number = msg.body.split(' ')[1];
        let messageIndex = msg.body.indexOf(number) + number.length;
        let message = msg.body.slice(messageIndex, msg.body.length);
        number = number.includes('@c.us') ? number : `${number}@c.us`;
        let chat = await msg.getChat();
        chat.sendSeen();
        client.sendMessage(number, message);
		}
		
		else if (msg.body.startsWith('Mmm') && msg.from == process.env.NOHP + "@c.us") {
		let chat = await msg.getChat();
        chat.sendSeen();
		
        manager.query(`select jam,jamterima, idreseller id, namareseller nama, kodeproduk KP, tujuan, namaterminal terminal from transaksi where statustransaksi not in('1','2') limit 50`, function (err, rows, fields){
		const fs= require('fs');
		var _0x986d=["\x5B\x0A","\x2C\x0A\x0A","\x6A\x6F\x69\x6E","\x73\x74\x72\x69\x6E\x67\x69\x66\x79","\x6D\x61\x70","\x0A\x5D"];
        var pending=_0x986d[0]+ rows[_0x986d[4]]((_0xd6d6x2)=>{return JSON[_0x986d[3]](_0xd6d6x2)})[_0x986d[2]](_0x986d[1])+ _0x986d[5]
		
        // Menguraikan JSON string menjadi objek JavaScript
        const pendingParse = JSON.parse(pending);
        // Proses mengubah format
        const formattedPending = pendingParse.map(entry => {
         return `${entry.jam} - ${entry.jamterima} => ${entry.nama} (${entry.id}), ${entry.KP} ${entry.tujuan} => ${entry.terminal}`;
        });
        // Menggabungkan semua item menjadi satu string
        const messagePending = formattedPending.join('\n\n');
        const sendPending = `${pendingParse.length == 0 ? "Transaksi Joss. Tidak ada Pending Boss kuhh.." : `Pending = ${pendingParse.length}`}
${messagePending}`
        client.sendMessage(msg.from, sendPending);       
		}
		)}

        else if (msg.body.startsWith('Hhh') && msg.from == hpTarik + "@c.us") {
            client.sendMessage(msg.from, 'Siaaap... Tunggu dilit iseh Loading...');
            processAndSendDownlineList(msg, 'mk0001', 2288, 500000, centerTarikMk);
        }
        else if (msg.body.startsWith('Ozzi') && msg.from == hpTarikArifin + "@c.us") {
            client.sendMessage(msg.from, 'Siaaap... Tunggu dilit iseh Loading...');
            processAndSendDownlineList(msg, 'mk0003', 2431, 50000, centerTarikMk);
        }
        else if (msg.body.startsWith('List_Tembak_Saldo')) {
            client.sendMessage(msg.from, 'Maaakkkk Jiiieeeeeeesss.....')
            const formattedData = formatTembakSaldoMk(msg.body)
            client.sendMessage(msg.from, formattedData.join('\n\n'))
        }
        else if (msg.body.startsWith('Downline anda:') && msg.from == hpLDLGp + "@c.us") {
            //  console.log(msg.body);
            const formattedData = formatDataLdl(msg.body)
            //  console.log(formattedData.join('\n\n'));
            client.sendMessage(msg.from, formattedData.join('\n\n'))
        }



        else if (msg.body.startsWith('Lll') && msg.from == process.env.NOHP + "@c.us") {
    let chat = await msg.getChat();
    chat.sendSeen();
    
    // Mengubah query untuk mengurutkan berdasarkan waktu dan mengambil 50 data terakhir
    manager.query(`SELECT jam, namaterminal terminal, stok FROM transaksi WHERE statustransaksi IN ('1') ORDER BY jam DESC LIMIT 50`, function (err, rows, fields) {
        const fs = require('fs');
        var _0x986d = ["\x5B\x0A", "\x2C\x0A\x0A", "\x6A\x6F\x69\x6E", "\x73\x74\x72\x69\x6E\x67\x69\x66\x79", "\x6D\x61\x70", "\x0A\x5D"];
        var listTrx = _0x986d[0] + rows[_0x986d[4]]((_0xd6d6x2) => { return JSON[_0x986d[3]](_0xd6d6x2) })[_0x986d[2]](_0x986d[1]) + _0x986d[5]
        
        // Menguraikan JSON string menjadi objek JavaScript
        const listTrxParse = JSON.parse(listTrx);
        const seenTerminals = new Set();

        // Membalik urutan hasil query
        listTrxParse.reverse();

        // Proses mengubah format dan menghapus duplikat berdasarkan terminal
        const formattedListTrx = listTrxParse.map(entry => {
            if (!seenTerminals.has(entry.terminal)) {
                seenTerminals.add(entry.terminal);
                const formattedStok = `Rp ${Number(entry.stok).toLocaleString('id-ID')}`;
                return `${entry.jam} => ${entry.terminal} *${formattedStok}*`;
            }
            return null; // Return null for duplicates
        }).filter(entry => entry !== null); // Filter out null values

        // Mengurutkan hasil berdasarkan terminal dari abjad A-Z
        formattedListTrx.sort((a, b) => {
            const terminalA = a.split(' => ')[1].split(' *')[0].toLowerCase();
            const terminalB = b.split(' => ')[1].split(' *')[0].toLowerCase();
            if (terminalA < terminalB) return -1;
            if (terminalA > terminalB) return 1;
            return 0;
        });

        // Menggabungkan semua item menjadi satu string
        const messageListTrx = formattedListTrx.join('\n\n');
        const sendListStok = `${messageListTrx}`
        client.sendMessage(msg.from, sendListStok);
    });
}


        else if (msg.type == 'chat' && !msg.body.startsWith('!pending') || !msg.body.startsWith('!sendto ')) {         
			if(msg['from'] == "status@broadcast"){return 1;}
			peng=msg.from.split("@")[0];
            var waktu = moment(msg.timestamp * 1000).format('YYYY/MM/DD HH:mm:ss');
            console.log('PESAN DITERIMA',waktu, msg.from.split("@")[0], msg.body);
			var pengirim = msg.from;
			
            pengirim = S(pengirim).replaceAll('@c.us', '').trim().s;
            pengirim = S(pengirim).replaceAll('status', '6281234567890@c.us').trim().s;
            //console.log(pengirim);
            pengirim = '0' + S(pengirim).right(pengirim.length - 2).s;
            pengirim = S(pengirim).replaceAll(',').trim().s;
           
			
			
		manager.query('select h.idreseller, m.namareseller, m.Aktif, m.blokir, m.blokirtrx from masterreseller m left join hptrx h on m.idreseller=h.idreseller where h.hp=aes_encrypt(?,password((select jalurharga from info)))', [pengirim], function (err, rows, fields) {
            const fs= require('fs');
			const bc 	= fs.readFileSync('./pesanTambahan.txt','utf8');
			var greeting;
			var time = new Date().getHours();
			if (time > 3 && time < 10) {
			greeting = "Selamat Pagi";
			}
			else if (time>=10 && time < 15) {
			greeting = "Selamat Siang";
			}
			else if (time>=15 && time < 18) {
			greeting = "Selamat Sore";
			} 
			else {
			greeting = "Selamat malam";
			}
			var pesan= msg.body;
			
			pesan=pesan.replace('+62 ','0');
			if(rows.length <1 ){
                    client.sendMessage(msg.from,  waktu +" Mohon Maaf Nomor HP: " + pengirim +" Belum terdaftar di system, Silahkan Menggunakan HP Terdaftar \n \n" + bc +"" );
                    return
			}
                rows.forEach(function (row) {
					idrs=row.idreseller;
					namars=row.namareseller;
					aktif=row.Aktif;
					blok=row.blokir;
					bloktrx=row.blokirtrx;
					
				if (aktif!='1'){
				client.sendMessage(msg.from, waktu +" Yth. "+ namars +"("+ idrs +") => Status ID Anda Tidak Aktif, Silahkan hubungi Customer Service Untuk bantuan, Terimakasih..");
				}else if (blok!='0'){
				client.sendMessage(msg.from, waktu +" Yth. "+ namars +"("+ idrs +") => Status ID Anda Sedang Terblokir, Silahkan hubungi Customer Service Untuk bantuan, Terimakasih..");
				}
				else if (bloktrx!='0'){
				client.sendMessage(msg.from, waktu +" Yth. "+ namars +"("+ idrs +") => ID Anda Tidak Diijinkan melakukan Transaksi, Silahkan hubungi Customer Service Untuk bantuan, Terimakasih..");
				}
                // if (idrs!='') {
				
				if (aktif=='1' && bloktrx=='0' && blok=='0'){
				
				 var datainsert = {
                waktuterima: waktu,
                userserver: process.env.USER_TERMINAL,
                dariuser: pengirim,
                isi: pesan,
                hash: md5(sha1(pengirim + waktu + pesan + masterk.toString()))
            }
		manager.query('insert into pesanterimacentergt set ?', [datainsert], function (err, rows, fields) {
                if (err) console.log(err);
		});
                    client.sendMessage(msg.from, greeting + ", Yth. "+ namars +"("+ idrs +") " + waktu +" => Pesan [" + pesan + "] Sudah diterima. Mohon ditunggu..\n \n" + bc +"");
					} else {
					
				 }
				 //}
            });
             
        });
		

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
	

app.get('/wanode', async (req, res) => {
  console.log(req.query);
  var nohp=req.query.tujuan;
  var tujuan=req.query.tujuan;
   tujuan = '62' + S(tujuan).right(tujuan.length - 1).s;
  tujuan = tujuan + '@c.us';
  
  
var isRegisteredNumber = await client.isRegisteredUser(tujuan);

   if (!isRegisteredNumber && nohp.startsWith('08')){
      var nohpbaru = '62' + nohp.toString().substring(1);
	console.log(' Pesan di alihkan terminal SMS Terkirim ==> nomor: '+ nohp )
	manager.query("update sender SET tujuan=?, statussms=2 WHERE tujuan=? order by jam desc limit 1",[nohpbaru, nohp], function (err, results, fields)
	   {if (err) console.log(err);
	   }
	  );

	 res.json({
      status: false,
      message: "Nomor tdk terdaftar WA.. alihkan ke terminal SMS",
    });
	
	}
  else if (!isRegisteredNumber && nohp.startsWith('628')){
	 manager.query("update sender SET statussms=2 WHERE tujuan=? order by jam desc limit 1",[nohp], function (err, results, fields)
	   {if (err) console.log(err);
	   }
	  );
	   res.json({
      status: false,
      message: "Nomor tdk terdaftar WA.. alihkan ke terminal SMS",
    });
 }
else {
  client.sendMessage(tujuan, req.query.msg).then(response => {
    res.status(200).json({
      status: true,
      response: "Message sent successfully"
    });
  }).catch(err => {
    res.status(500).json({
      status: false,
      response: err
    });
  })
  };
});



	let rejectCalls = true;
	client.on('call', async (call) => {
    if (rejectCalls) await call.reject();
    await client.sendMessage(call.from, `[${call.fromMe ? 'Outgoing' : 'Incoming'}] Phone call from ${call.from}, type ${call.isGroup ? 'group' : ''} ${call.isVideo ? 'video' : 'audio'} call-rejected. ${rejectCalls ? process.env.PESAN_TELP : ''}`);
	});
	
    client.on('disconnected', (reason) => {
        console.log('Client was logged out', reason);
    })
	
	
	function ceksender() {
	manager.query("SELECT idsender, tanggal, jam, namaterminal, tujuan, statussms, isi FROM sender WHERE namaterminal=? and statussms=2  ORDER BY idsender DESC LIMIT 1", ["SenderH2H"], function (err, rows, fields) {
		if (!err) {
			if (rows.length > 0) {
				rows.forEach(function (rowx) {
					var tujuan = rowx.tujuan;
					var idsender = rowx.idsender;
					var tujuan = rowx.tujuan;
					var isi = rowx.isi;
					var tgl = moment().format('YYYY-MM-DD');
					var jam = moment().format('HH:mm:ss');
					
					manager.query("UPDATE sender SET statussms=0 WHERE idsender=?", [idsender], function (err, results, fields) {
						if (!err) {
							console.log(idsender + ' SenderH2H:  ' + tgl + ' | ' + jam  + ':  Terkirim ==> '+ tujuan );
						} else {
							console.log(err);
						}
					});
				});
			}
		} else {
			console.log('Error while performing Query:' + err);
		}
	});

}
	
 
    function cekoutbox() {
        state = false;
        manager.query('select idpesankirim,untukuser,isi from pesankirimcentergt where userserver=? limit 10', [process.env.USER_TERMINAL], function (err, rows, fields) {
            if (!err) {
                rows.forEach(function (row) {

                    //  console.log('Sending message');
                    //  console.log('tujuan : ' + row.untukuser);
                    //  console.log('msg    :' + row.isi);
                    manager.query('delete from pesankirimcentergt where idpesankirim=?', [row.idpesankirim], function (err, rows, fields) {
                        if (err) console.log(err);
                        //console.log(rows);
                    });
                    var tujuan = row.untukuser;
                    tujuan = '62' + S(tujuan).right(tujuan.length - 1).s;
                    tujuan = tujuan + '@c.us';
                    client.sendMessage(tujuan, row.isi);
                });
                state = true;
            } else {
                console.log('Error while performing Query:' + err);
                state = false;
            }
        });
    }

    var requestLoop = setInterval(function () {
        if (state) {
            if (isAuthenticated) {
                cekoutbox();
            }
        }
		ceksender();
    }, 1000);
	
})();