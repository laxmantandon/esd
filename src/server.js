const http = require('http')
const axios = require('axios')
const express = require('express')
const app = express()
const server = http.createServer(app)
const qr = require('qr-image')
const promisify = require('util')
const Jimp = require("jimp")
const path = require('path')
const fs = require('fs')
const readline = require('readline')

const host = "0.0.0.0"
const port = "35040"

app.set('Host', host)
app.set('Port', port)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => res.send('ESD App Running'))

app.post('/esd', (req, res) => {

    payload = req.body
    items = payload.items_list
    led = payload.led_list

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : " "
            array_item = hscode + " " + val.stockitemname + " " + String(val.qty) + " " + String(val.rate) + " " + String(val.amt)
            item_array.push(array_item)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : " "
            array_item = hscode + " " + val.stockitemname + " " + String(val.qty) + " " + String(val.rate) + " " + String(val.amt)
            item_array.push(array_item)
        }
    }

    payload.items_list = item_array
    qr_image_path = payload.qr_image_path

    const options = {
        headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(payload).length
        }
    };

    axios.post(req.headers.hostname, payload, options)
        .then((x) => {
            var result = JSON.stringify(x.data.replace(/\\/g, ""));
            var result1 = JSON.parse(result);
            var result2 = JSON.parse(result1);

            res.setHeader('Content-Type', 'application/json');
            res.send(result1);

            if (qr_image_path) {
                var qrcode = result2['verify_url']
                var file_name = path.join(qr_image_path, `${result2["cu_invoice_number"]}.png`);
    
                var qr_png = qr.image(qrcode, {type: 'png'});
    
                var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
    
                tempFile.on('open', function(fd) {
                    Jimp.read(file_name, function (err, image) {
                        if (err) {
                          console.log(err)
                        } else {
                          image.write(path.join(qr_image_path, `${result2["cu_invoice_number"]}.jpeg`));
                        }
                      });
                })    
            }


        }).catch(ex => {
            if (ex['response']['data']) {
                let err = ex['response']['data'];
                if (typeof err == 'object') {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(err);    
                } else {
                    const error_message = JSON.stringify(err.replace(/\\/g, ""));
                    const message = JSON.parse(error_message);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(message);    
                }
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send({ "error_status" : "Unknown Error, Try Again"});    
            }
        });
})


app.post('/device', (req, res) => {

    const options = {
        headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json',
        }
    };

    axios.get(req.headers.hostname, options)
        .then((x) => {
            if (x.status == '200') {
                res.setHeader('Content-Type', 'application/json');
                res.send({'status': true, 'message': 'Connected'});    
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send({'status': false, 'error_status': 'device not connected'});    
            }
        }).catch(ex => {
            if (ex['response']['data']) {
                let err = ex['response']['data'];
                if (typeof err == 'object') {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(err);    
                } else {
                    const error_message = JSON.stringify(err.replace(/\\/g, ""));
                    const message = JSON.parse(error_message);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(message);    
                }
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send({ "error_status" : "Unknown Error, Try Again"});    
            }
        })
})


app.get('/dtr', (req, res) => {

    export_location = req.headers.exportpath
    import_location = req.headers.importpath
    file_name       = req.headers.filename
    invoice_number  = req.headers.invoicenumber
    print_delay     = req.headers.printdelay ? req.headers.printdelay : 8000 
    
    file_path = path.join(import_location, `R_${file_name}`)

    setTimeout(() => {
        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send({
                    "error_status": String(err)
                });        
            }

            // x = data.split(/\r?\n/).forEach((line) => {
            //     console.log('line -> ',  line)
            // })
            x = data.split(/\r?\n/)
            var cu_date = x.find(element => element.includes("DATE"));
            var cu_serial = x.find(element => element.includes("CUSN:"));
            cu_serial = cu_serial + "_" + cu_date.replace("|", "");
            var cu_invoice = x.find(element => element.includes("CUIN:"));
            var verify_url = x.find(element => element.includes("https:"));
            res.setHeader('Content-Type', 'application/json');
                res.send({
                    "invoice_number": invoice_number,
                    "cu_serial_number": cu_serial.trim().replace("CUSN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, ""),
                    "cu_invoice_number": cu_invoice.trim().replace("CUIN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, ""),
                    "verify_url": verify_url.trim().replace("|",""),
                    "description": "Invoice Signed Success"
            });     
        })    
    }, print_delay)

})



// server.listen(port, host, () => {
//     console.log('Server Listening')
// })

module.exports = {
    app, server
}
