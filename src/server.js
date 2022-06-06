const http = require('http')
const axios = require('axios')
const express = require('express')
const app = express()
const server = http.createServer(app)

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

    const options = {
        headers: {
            'Authorization': req.headers.authorization,
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(payload).length
        }
    };

    axios.post(req.headers.hostname, payload, options)
        .then((x) => {
            let result = JSON.stringify(x.data.replace(/\\/g, ""));
            let result1 = JSON.parse(result);
            res.setHeader('Content-Type', 'application/json');
            res.send(result1);
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


    // esd_req_options = {
    //     hostname: req.headers.hostname,
    //     method: 'POST',
    //     port: req.headers.hostport,
    //     path: req.headers.hostpath,
    //     agent: https.Agent({keepAlive:true}),
    //     headers: {
    //         'Content-Type': 'application/json',
    //         'Authorization': req.headers.authorization,
    //         'Content-Length': 400,
    //         'WWW-Authenticate': 'Basic',
    //         'Keep-Alive': 'timeout=5, max=5'
    //     }
    // }

    // const esd_req = https.request(esd_req_options, esd_res => {

    //     // console.log(req.body)

    //     esd_res.on('data', d => {
    //         return d;
    //     });

    //     // esd_res.on('error', e => {
    //     //     esd_req.write(JSON.stringify({'error': false, 'message': e}))
    //     // });

    //     if (esd_resp.statusCode == 200) {
    //         esd_res.send(req.body)
    //     }

    // });

    // esd_req.on('error', error => {
    //     console.log('error', error)
    // });

    // esd_resp = esd_req.write(JSON.stringify(req.body))
    // esd_req.end()

    // res.send(esd_resp)

})

// server.listen(port, host, () => {
//     console.log('Server Listening')
// })

module.exports = {
    app, server
}
