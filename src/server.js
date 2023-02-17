const http = require('http')
const axios = require('axios')
const express = require('express')
const app = express()
const server = http.createServer(app)
const qr = require('qr-image')
const Jimp = require("jimp")
const path = require('path')
const fs = require('fs')
const xml2js = require('xml2js').parseString
const morgan = require('morgan')

// var Tremol = require("./nodejs_tremol_loader").load([path.join(__dirname, "./directapi/fp_core.js"), path.join(__dirname, "./directapi/fp.js")]);
// var fp = Tremol.FP();

const host = "0.0.0.0"
const port = "35040"

app.set('Host', host)
app.set('Port', port)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

var accessLogStream = fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
app.use(morgan('combined', { stream: accessLogStream }))

app.get('/', (req, res) => res.send('ESD App Running !!'))

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
                        //   console.log(err)
                        } else {
                          image.write(path.join(qr_image_path, `${result2["cu_invoice_number"]}.jpeg`));
                        }
                      });
                })    
            }


        }).catch(ex => {
            try {
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
            } catch(e) {
                res.setHeader('Content-Type', 'application/json');
                res.send({ "error_status" : "Unknown Error, Try Again", "error_message": String(e)});    
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
    error_location  = req.headers.errorpath
    file_name       = req.headers.filename
    invoice_number  = req.headers.invoicenumber
    print_delay     = req.headers.printdelay ? parseInt(req.headers.printdelay) : 8000 
    qr_image_path   = req.headers.qrimagepath

    file_path = path.join(import_location, `R_${file_name}`)
    error_file_path = path.join(error_location, `R_${file_name}`)

    setTimeout(() => {
        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send({
                    "error_status": "Could not process invoice, check error log",
                    "internal_error":String(err)
                });        
            } else{

                try {
                    x = data.split(/\r?\n/)
                    var cu_date = x.find(element => element.includes("DATE"));
                    var cu_serial = x.find(element => element.includes("CUSN:"));
                    cu_serial = cu_serial + "_" + cu_date.replace("|", "");
                    cu_serial = cu_serial.trim().replace("CUSN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, "")
                    var cu_invoice = x.find(element => element.includes("CUIN:"));
                    cu_invoice = cu_invoice.trim().replace("CUIN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, "")
                    var verify_url = x.find(element => element.includes("https:"));
                    verify_url = verify_url.trim().replace("|","")
                    
                    if (qr_image_path) {
                        var qrcode = verify_url;
                        var file_name = path.join(qr_image_path, `${cu_invoice}.png`);
            
                        var qr_png = qr.image(qrcode, {type: 'png'});
            
                        var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
            
                        tempFile.on('open', function(fd) {
                            Jimp.read(file_name, function (err, image) {
                                if (err) {
                                //   console.log(err)
                                } else {
                                  image.write(path.join(qr_image_path, `${cu_invoice}.jpeg`));
                                }
                              });
                        })    
                    }
    
                    res.setHeader('Content-Type', 'application/json');
                        res.send({
                            "invoice_number": invoice_number,
                            "cu_serial_number": cu_serial,
                            "cu_invoice_number": cu_invoice,
                            "verify_url": verify_url,
                            "description": "Invoice Signed Success"
                    });     
                } catch (error) {
                    res.setHeader('Content-Type', 'application/json');
                        res.send({
                            "error_status": "Could not process invoice, check error log",
                            "internal_error":String(err)
                    });
                    
                }

            }
        })    
    }, print_delay)

})

app.get('/dtr/read_response', (req, res) => {

    export_location = req.headers.exportpath
    import_location = req.headers.importpath
    error_location  = req.headers.errorpath
    file_name       = req.headers.filename
    invoice_number  = req.headers.invoicenumber
    print_delay     = req.headers.printdelay ? parseInt(req.headers.printdelay) : 8000 
    qr_image_path   = req.headers.qrimagepath

    file_path = path.join(import_location, `R_${file_name}`)
    error_file_path = path.join(error_location, `R_${file_name}`)

        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                res.setHeader('Content-Type', 'application/json');
                res.send({
                    "error_status": "Could not process invoice, check error log",
                    "internal_error":String(err)
                });        
            } else{

                x = data.split(/\r?\n/)
                var cu_date = x.find(element => element.includes("DATE"));
                var cu_serial = x.find(element => element.includes("CUSN:"));
                cu_serial = cu_serial + "_" + cu_date.replace("|", "");
                cu_serial = cu_serial.trim().replace("CUSN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, "")
                var cu_invoice = x.find(element => element.includes("CUIN:"));
                cu_invoice = cu_invoice.trim().replace("CUIN:","").replace("|","").replace(/\s/g, '').replace(/\u0011/g, "")
                var verify_url = x.find(element => element.includes("https:"));
                verify_url = verify_url.trim().replace("|","")
                
                if (qr_image_path) {
                    var qrcode = verify_url;
                    var file_name = path.join(qr_image_path, `${cu_invoice}.png`);
        
                    var qr_png = qr.image(qrcode, {type: 'png'});
        
                    var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
        
                    tempFile.on('open', function(fd) {
                        Jimp.read(file_name, function (err, image) {
                            if (err) {
                            //   console.log(err)
                            } else {
                              image.write(path.join(qr_image_path, `${cu_invoice}.jpeg`));
                            }
                          });
                    })    
                }

                res.setHeader('Content-Type', 'application/json');
                    res.send({
                        "invoice_number": invoice_number,
                        "cu_serial_number": cu_serial,
                        "cu_invoice_number": cu_invoice,
                        "verify_url": verify_url,
                        "description": "Invoice Signed Success"
                });     
            }
        })

})

app.post('/ace', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "HSDesc": val.stockitemname,
                "TaxRate": val.taxrate,
                "ItemAmount": val.amt,
                "TaxAmount": val.taxamount,
                "TransactionType": "1",
                "UnitPrice": val.rate,
                "HSCode": hscode,
                "Quantity": val.qty
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "HSDesc": val.stockitemname,
                "TaxRate": val.taxrate,
                "ItemAmount": val.amt,
                "TaxAmount": val.taxamount,
                "TransactionType": "1",
                "UnitPrice": val.rate,
                "HSCode": hscode,
                "Quantity": val.qty
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path


    let ace_req = {
        Invoice: {
            SenderId: req.headers.senderid,
            InvoiceTimestamp: payload.timestamp,
            InvoiceCategory: payload.vouchertype,
            TraderSystemInvoiceNumber: payload.invoice_number,
            RelevantInvoiceNumber: payload.rel_doc_number? payload.rel_doc_number : "",
            PINOfBuyer: payload.customer_pin,
            Discount: payload.net_discount_total,
            InvoiceType: "Original",
            ItemDetails: item_array,
            TotalInvoiceAmount: payload.grand_total,
            TotalTaxableAmount: payload.net_subtotal,
            TotalTaxAmount: payload.tax_total,
            ExemptionNumber: payload.customer_exid ? payload.customer_exid : ""
        }
    }
    const json = JSON.stringify(ace_req);

    const options = {
        headers: {
            //'Authorization': req.headers.authorization,
            'Content-Type': 'application/json',
            // 'Content-Length': JSON.stringify(payload).length
        }
    };
    

    axios.post(req.headers.hostname, json, options)
        .then((x) => {
            // console.log(x.data)
            if (x) {
                // let result = {
                //     "error_status": "",
                //     "invoice_number": x.data.Invoice.TraderSystemInvoiceNumber,
                //     "cu_serial_number": payload.deviceno + " " + x.data.Invoice.CommitedTimestamp,
                //     "cu_invoice_number": x.data.Invoice.ControlCode,
                //     "verify_url": x.data.Invoice.QRCode,
                //     "description": "Invoice Signed Successfully"
                // }
                let result;
        if(x.data.Existing){
          result = {
            "error_status": "",
            "invoice_number": x.data.Existing.TraderSystemInvoiceNumber,
            "cu_serial_number": payload.deviceno + " " + x.data.Existing.CommitedTimestamp,
            "cu_invoice_number": x.data.Existing.ControlCode,
            "verify_url": x.data.Existing.QRCode,
            "description": "Invoice Signed Successfully"
          }
        } else {
          result = {
            "error_status": "",
            "invoice_number": x.data.Invoice.TraderSystemInvoiceNumber,
            "cu_serial_number": payload.deviceno + " " + x.data.Invoice.CommitedTimestamp,
            "cu_invoice_number": x.data.Invoice.ControlCode,
            "verify_url": x.data.Invoice.QRCode,
            "description": "Invoice Signed Successfully"
          }
        }
                // var result = JSON.stringify(x.data.replace(/\\/g, ""));
                // var result1 = JSON.parse(result);
                // var result2 = JSON.parse(result1);

                res.setHeader('Content-Type', 'application/json');
                res.send(result);
            }

            if (qr_image_path) {
                var qrcode = x.data.Existing.QRCode
                var file_name = path.join(qr_image_path, `${x.data.Existing.ControlCode}.png`);
    
                var qr_png = qr.image(qrcode, {type: 'png'});
    
                var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
    
                tempFile.on('open', function(fd) {
                    Jimp.read(file_name, function (err, image) {
                        if (err) {
                        //   console.log(err)
                        } else {
                          image.write(path.join(qr_image_path, `${x.data.Existing.ControlCode}.jpeg`));
                        }
                      });
                })    
            }

        }).catch(ex => {
            // console.log(ex.response)
            // console.log(ex.response.data['Error'].message)
            let error = {
                "error_status": ex.response.data['Error'].message,
                "verify_url": "",
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(error);

        });
})

app.post('/datecs', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list
    transaction_type = ""
    if (payload.vouchertype == "Tax Invoice") {
        transaction_type = 0
    } else if (payload.vouchertype == "Credit Note") {
        transaction_type = 1
    } else if (payload.vouchertype == "Debit Note") {
        transaction_type = 2
    }

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "name": val.stockitemname,
                "quantity": Number(val.qty),
                "unitPrice": Number(val.rate),
                "totalAmount": Number(val.amt),
                "hsCode": hscode
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "name": val.stockitemname,
                "quantity": Number(val.qty),
                "unitPrice": Number(val.rate),
                "totalAmount": Number(val.amt),
                "hsCode": hscode
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path
    let buyer = ""
    if (payload.customer_pin == "" || payload.customer_pin == undefined) {
        buyer = {
            buyerName: payload.partyname,
            buyerAddress: payload.address ? payload.address : " ",
            buyerPhone: " "
        }
    } else {
        buyer = {
            buyerName: payload.partyname,
            pinOfBuyer: payload.customer_pin ? payload.customer_pin : " ",
            buyerAddress: payload.address ? payload.address : " ",
            buyerPhone: " "
        }
    }

    let ace_req = {
        invoiceType: 0,
        transactionType: transaction_type,
        cashier: "name",
        TraderSystemInvoiceNumber: payload.invoice_number,
        buyer: buyer,
        items: item_array,
        payment: [{
            amount: Number(payload.grand_total),
            paymentType: 0
        }],
        relevantNumber: payload.rel_doc_number? payload.rel_doc_number : ""
        // ExemptionNumber: payload.customer_exid ? payload.customer_exid : ""        
    }
    const json = JSON.stringify(ace_req);

    const options = {
        headers: {
            //'Authorization': req.headers.authorization,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'RequestId': req.headers.requestid,
            'Content-Length': JSON.stringify(ace_req).length
        }
    };

    var pin_url = req.headers.hostname.replace("invoices", "pin")
    var pin_config = {
        method: 'post',
        url: pin_url,
        headers: {
            'Accept': 'text/plain',
            'Content-Type': 'text/plain'
        },
        data: "0000"
    };

    axios(pin_config)
        .then(function (pin_response) {
            if (pin_response.data != "0100") {
                let err = {
                    "error_status": "Device Not Connected / Pin Error"
                }
                res.setHeader('Content-Type', 'application/json');
                res.send(err);
            } else {

                axios.post(req.headers.hostname, json, options)
                .then((response) => {
                    if (response.data.msn) {
                        let result = {
                            "error_status": "",
                            "invoice_number": payload.invoice_number,
                            "cu_serial_number": response.data.msn + " " + response.data.DateTime,
                            "cu_invoice_number": response.data.mtn,
                            "verify_url": response.data.verificationUrl,
                            "description": "Invoice Signed Successfully",
                            "payload": ace_req
                        }
        
                        res.setHeader('Content-Type', 'application/json');
                        res.send(result);
                    } else {
                        let err = {
                            "error_status": response.data.message,
                            "payload": ace_req
                        }
                        res.setHeader('Content-Type', 'application/json');
                        res.send(err);
                        return
                    }
        
                    // D:\TYPE C\ESDUtility\esd-master
        
                    if (qr_image_path) {
                        var qrcode = response.data.verificationUrl
                        var file_name = path.join(qr_image_path, `${response.data.mtn}.png`);
            
                        var qr_png = qr.image(qrcode, {type: 'png'});
            
                        var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
            
                        tempFile.on('open', function(fd) {
                            Jimp.read(file_name, function (err, image) {
                                if (err) {
                                //   console.log(err)
                                } else {
                                image.write(path.join(qr_image_path, `${response.data.mtn}.jpeg`));
                                }
                            });
                        })    
                    }
                
                }).catch(ex => {
                    // console.log(ex.response)
                    // console.log(ex.response.data['Error'].message)
                    let error = {
                        "error_status": ex.message,
                        "verify_url": "",
                        "payload": ace_req
                    }
        
                    res.setHeader('Content-Type', 'application/json');
                    res.send(error);
        
                });
            }

        })
        .catch(function (error) {
            let err = {
                "error_status": "Pin Error",
                "verify_url": "",
                "payload": ace_req
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(err);
        });
    






})

app.get('/total_file', (req, res) => {

    export_location = req.headers.exportpath
    import_location = req.headers.importpath
    file_name       = req.headers.filename
    invoice_number  = req.headers.invoicenumber
    print_delay     = req.headers.printdelay ? parseInt(req.headers.printdelay) : 8000 
    qr_image_path   = req.headers.qrimagepath
    deviceno        = req.headers.deviceno
    printhost       = req.headers.printhost

    file_path = path.join(import_location, `ok_${file_name}`)
    error_file_path = path.join(import_location, `err_${file_name}`)

    setTimeout(() => {
        fs.readFile(file_path, 'utf-8', function(err, data) {
            if (err) {
                fs.readFile(error_file_path, 'utf-8', function(err, data) {
                    if (err) {
                        res.setHeader('Content-Type', 'application/json');
                        res.send({
                            "error_status": "Could not process invoice, check error log",
                            "internal_error":String(err)
                        }); 
                    }

                    if (data) {
                        xml2js(data, (err, result) => {
                            if (result) {
                                var cancel_url = `${printhost}/CancelReceipt()`
                                axios.get(cancel_url)
                                .then(data => {
                                    res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
                                    return    
                                })
                                .catch(err => {
                                    res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
                                    return                                    
                                })
                            } else {
                                res.send({"error_status": String(err)})
                                return
                            }
                        })
                    }

                })
                       
            } else{
                var cu_date = "";
                var cu_serial = "";
                var cu_invoice = "";
                var verify_url = "";
                xml2js(data, (err, result) => {
                    if (err) {
                        res.send({"error_status": String(err)})
                        return
                    } else {
                        current_date = new Date()
                        cu_date = current_date.toISOString()
                        cu_invoice = result.Res.Res[0].$.Value
                        cu_serial = deviceno + " " + cu_date; ;
                        verify_url = result.Res.Res[1].$.Value;
                        verify_url.replace(" ", "");

                        let r = {
                            "error_status": "",
                            "invoice_number": invoice_number,
                            "cu_serial_number": cu_serial,
                            "cu_invoice_number": cu_invoice,
                            "verify_url": verify_url,
                            "description": "Invoice Signed Successfully"
                        }
        
                        res.setHeader('Content-Type', 'application/json');
                        res.send(r);
                    }

                    
                })
                
                if (qr_image_path) {
                    var qrcode = verify_url;
                    var file_name = path.join(qr_image_path, `${cu_invoice}.png`);
        
                    var qr_png = qr.image(qrcode, {type: 'png'});
        
                    var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
        
                    tempFile.on('open', function(fd) {
                        Jimp.read(file_name, function (err, image) {
                            if (err) {
                            //   console.log(err)
                            } else {
                              image.write(path.join(qr_image_path, `${cu_invoice}.jpeg`));
                            }
                          });
                    })    
                }
    
            }
        })    
    }, print_delay)

})

app.post('/novitus', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list
    transaction_type = payload.vouchertype
    if (payload.vouchertype == "Tax Invoice") {
        transaction_type = "tax_invoice"
    } else if (payload.vouchertype == "Credit Note") {
        transaction_type = "credit_note"
    } else if (payload.vouchertype == "Debit Note") {
        transaction_type = "debit_note"
    }

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "namePLU":val.stockitemname,
                "taxRate":val.taxrate,
                "unitPrice":val.rate,
                "discount":val.discount,
                "hsCode":hscode,
                "quantity":val.qty,
                "measureUnit":val.unit,
                "vatClass":val.vatrateclass
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "namePLU":val.stockitemname,
                "taxRate":val.taxrate,
                "unitPrice":val.rate,
                "discount":val.discount,
                "hsCode":hscode,
                "quantity":val.qty,
                "measureUnit":val.unit,
                "vatClass":val.vatrateclass
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path


    let ace_req = {
            deonItemDetails:item_array,
            senderId:req.headers.senderid,
            invoiceCategory:transaction_type,
            traderSystemInvoiceNumber:payload.invoice_number,
            relevantInvoiceNumber:payload.rel_doc_number,
            pinOfBuyer:payload.customer_pin,
            discount:String(payload.net_discount_total),
            invoiceType:"Original",
            exemptionNumber:payload.customer_exid,
            totalInvoiceAmount:String(payload.grand_total),
            systemUser:"User"
        }
           
    const json = JSON.stringify(ace_req);

    const options = {
        headers: {
            //'Authorization': req.headers.authorization,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(ace_req).length
        }
    };

    axios.post(req.headers.hostname, json, options)
        .then((response) => {
            if (response.data.statusCode == "0") {
                current_date = new Date()
                cu_date = current_date.toISOString()

                let result = {
                    "error_status": "",
                    "invoice_number": response.data.traderSystemInvoiceNumber,
                    "cu_serial_number": req.headers.deviceno  + " " + cu_date,
                    "cu_invoice_number": response.data.controlCode,
                    "verify_url": response.data.qrCode,
                    "description": "Invoice Signed Successfully"
                }

                res.setHeader('Content-Type', 'application/json');
                res.send(result);

                if (qr_image_path) {
                    var qrcode = response.data.verificationUrl
                    var file_name = path.join(qr_image_path, `${response.data.controlCode}.png`);
        
                    var qr_png = qr.image(qrcode, {type: 'png'});
        
                    var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
        
                    tempFile.on('open', function(fd) {
                        Jimp.read(file_name, function (err, image) {
                            if (err) {
                            //   console.log(err)
                            } else {
                            image.write(path.join(qr_image_path, `${response.data.controlCode}.jpeg`));
                            }
                        });
                    })    
                }
            }
        
        }).catch(ex => {
            // console.log(ex.response)
            // console.log(ex.response.data['Error'].message)
            let error = {
                "error_status": ex.message,
                "verify_url": "",
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(error);

        });
})

app.post('/fiscat', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list
    transaction_type = payload.vouchertype

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "Name":val.stockitemname,
                "TaxRate":Number(val.taxrate),
                "UnitPrice":Number(val.rate),
                "DiscountType": "Discount",
                "Discount":Number(val.discount),
                "HSCode":hscode,
                "HSDesc":hscode.replace(".", ""),
                "Quantity":Number(val.qty),
                "Category":val.vatrateclass,
                "TotalAmount": Number(val.amt)
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "Name":val.stockitemname,
                "TaxRate":Number(val.taxrate),
                "UnitPrice":Number(val.rate),
                "DiscountType": "Discount",
                "Discount":Number(val.discount),
                "HSCode":hscode,
                "HSDesc":hscode.replace(".", ""),
                "Quantity":Number(val.qty),
                "Category":val.vatrateclass,
                "TotalAmount": Number(val.amt)
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path


    let ace_req = {
            ItemDetails:item_array,
            PINID:req.headers.pinid,
            InvoiceCategory:transaction_type,
            InvoiceNumber:payload.invoice_number,
            PINOfBuyer:payload.customer_pin,
            TotalAmount:Number(payload.grand_total),
            Payments : [
                { PaidMode: "Credit", PaidAmount: Number(payload.grand_total)}
            ]
            
        }
    
    if (transaction_type == "Credit Note") {
        ace_req.RelevantInvoiceNumber = payload.rel_doc_number
    }
           
    const json = JSON.stringify(ace_req);

    const options = {
        headers: {
            //'Authorization': req.headers.authorization,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(ace_req).length
        }
    };

    axios.post(req.headers.hostname, json, options)
        .then((response) => {
            if (response.data.status > 0) {

                let error = {
                    "error_status": response.data.description,
                    "verify_url": "",
                    "request": ace_req
                }
    
                res.setHeader('Content-Type', 'application/json');
                res.send(error);

            } else {
                current_date = new Date()
                cu_date = current_date.toISOString()

                let result = {
                    "error_status": "",
                    "invoice_number": payload.invoice_number,
                    "cu_serial_number": response.data["cu serial number"],
                    "cu_invoice_number": response.data["cu invoice number"],
                    "verify_url": response.data["Qrcode"],
                    "description": response.data["description"]
                }

                res.setHeader('Content-Type', 'application/json');
                res.send(result);
            }

            if (qr_image_path) {
                var qrcode = response.data.verificationUrl
                var file_name = path.join(qr_image_path, `${response.data.controlCode}.png`);
    
                var qr_png = qr.image(qrcode, {type: 'png'});
    
                var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
    
                tempFile.on('open', function(fd) {
                    Jimp.read(file_name, function (err, image) {
                        if (err) {
                        //   console.log(err)
                        } else {
                        image.write(path.join(qr_image_path, `${response.data.controlCode}.jpeg`));
                        }
                    });
                })    
            }
        
        }).catch(ex => {
            // console.log(ex.response)
            // console.log(ex.response.data['Error'].message)
            let error = {
                "error_status": ex.message,
                "verify_url": "",
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(error);

        });
})

// Totals route added
app.post('/total_api', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list
    let trials = 0;
    try{
        fp.ServerSetSettings(req.headers.printhost);
        fp.ServerSetDeviceTcpSettings(req.headers.ip, req.headers.port, req.headers.pw);
        while(true){
            if(trials == 30){
                res.send({"msg": "Device not found"})
            }else{
                var device = fp.ServerFindDevice();
                if (device) {
                    fp.ServerSetDeviceSerialSettings(device.serialPort, device.baudRate, false); //If FD is connected on serial port or USB
                    fp.PrintDiagnostics();
                    try {
                        const status = fp.ReadStatus()
                        if (status) {
                        fp.OpenInvoiceWithFreeCustomerData("",  payload.customer_pin, "", "", "", payload.customer_exid, payload.rel_doc_number, payload.invoice_number)
                        for (const val of items) {
                            let hscode = val.hscode ? val.hscode : " "
                
                            fp.SellPLUfromExtDB(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
                            console.log(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
                        }
                        
                        for (const val of led) {
                            let hscode = val.hscode ? val.hscode : " "
                
                            fp.SellPLUfromExtDB(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
                            console.log(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
                        }
                
                        const close = fp.CloseReceipt()
                        const dateTime = fp.ReadDateTime()
                        console.log(close, dateTime)
                        var response = { close, dateTime }
                        res.json(response)
                        }
                    }
                    catch (error) {
                        console.log(error);
                
                    }
                }else{
                    trials += 1
                }
            }
        };

    }catch( error) {
        res.send({"msg": "Please restart ZFserver"})
    }

    // while (true) {
    //   fp.ServerSetSettings(req.headers.printhost);
    // //   fp.ServerSetSettings("http://localhost:4444/");
    //   fp.ServerSetDeviceTcpSettings(req.headers.ip, req.headers.port, req.headers.pw);
    // //   fp.ServerSetDeviceTcpSettings("196.207.19.131", 8000, "Password");
    //   var device = fp.ServerFindDevice();
    //   if (device) {
    //     fp.ServerSetDeviceSerialSettings(device.serialPort, device.baudRate, false); //If FD is connected on serial port or USB
    //     fp.PrintDiagnostics();
    //   } else {
    //     console.log("Device not found");

    //   }
    //   try {
    //     const status = fp.ReadStatus()
    //     if (status) {
    //       fp.OpenInvoiceWithFreeCustomerData("",  payload.customer_pin, "", "", "", payload.customer_exid, payload.rel_doc_number, payload.invoice_number)
    //       for (const val of items) {
    //         let hscode = val.hscode ? val.hscode : " "
  
    //         fp.SellPLUfromExtDB(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
    //         console.log(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
    //       }
          
    //       for (const val of led) {
    //         let hscode = val.hscode ? val.hscode : " "
  
    //         fp.SellPLUfromExtDB(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
    //         console.log(val.stockitemname, val.vatclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
    //       }

    //       const close = fp.CloseReceipt()
    //       const dateTime = fp.ReadDateTime()
    //       console.log(close, dateTime)
    //       var response = { close, dateTime }
    //       res.json(response)
    //       break;
    //     }
    //   }
    //   catch (error) {
    //     console.log(error);
  
    //   }
    // }
});

app.post('/ACLAS', (req, res) => {
    payload = req.body
    items = payload.items_list
    led = payload.led_list

    let item_array = []
    if (items) {
        for (const val of items) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "productCode":hscode == undefined || hscode == ''? '00' : hscode,
                "productDesc": val.stockitemname,
                "taxtype":Number(val.taxrate),
                "unitPrice":Number(val.rate),
                "discount":Number(val.discount),
                "quantity":Number(val.qty)
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "productCode":hscode == undefined || hscode == ''? '00' : hscode,
                "productDesc": val.stockitemname,
                "taxtype":Number(val.taxrate),
                "unitPrice":Number(val.rate),
                "discount":Number(val.discount),
                "quantity":Number(val.qty)
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path

    let ace_req = {
        saleType: payload.vouchertype,
        cuin: "",
        till: 1,
        rctNo: payload.invoice_number,
        total: payload.grand_total,
        Paid: payload.grand_total,
        Payment: "Cash",
        CustomerPIN: payload.customer_pin,
        VAT_A_Net: payload.vat_a_net == undefined || payload.vat_a_net == "" ? 0 : payload.vat_a_net,
        VAT_A: payload.vat_a == undefined || payload.vat_a== "" ? 0 : payload.vat_a,
        VAT_B_Net: payload.vatb_net == undefined || payload.vatb_net== "" ? 0 : payload.vatb_net,
        VAT_B: payload.vat_b == undefined || payload.vat_b== "" ? 0 : payload.vat_b,
        VAT_E_Net: payload.vat_e_net == undefined || payload.vat_e_net== "" ? 0 : payload.vat_e_net,
        VAT_E: payload.vat_e == undefined || payload.vat_e== "" ? 0 : payload.vat_e,
        VAT_F_Net: payload.vat_f_net == undefined || payload.vat_f_net== "" ? 0 : payload.vat_f_net,
        VAT_F: payload.vat_f == undefined || payload.vat_f== "" ? 0 : payload.vat_f,
        data:item_array
        }
    
    if (payload.vouchertype == "Credit Note") {
        ace_req.cuin = payload.rel_doc_number
    }
           
    const json = JSON.stringify(ace_req);

    const options = {
        headers: {
            //'Authorization': req.headers.authorization,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Content-Length': JSON.stringify(ace_req).length
        }
    };

    axios.post(req.headers.printhost, json, options)
        .then((response) => {
            if (response.data.ResponseCode !== '000') {

                let error = {
                    "error_status": response.data.Message,
                    "verify_url": "",
                    "request": ace_req
                }
    
                res.setHeader('Content-Type', 'application/json');
                res.send(error);

            } else {

                let result = {
                    "error_status": "",
                    "invoice_number": payload.invoice_number,
                    "cu_serial_number": response.data["CUSN"],
                    "cu_invoice_number": response.data["CUIN"],
                    "verify_url": response.data["QRCode"],
                    "description": response.data["Message"]
                }

                res.setHeader('Content-Type', 'application/json');
                res.send(result);
            }

            if (qr_image_path) {
                var qrcode = response.data.verificationUrl
                var file_name = path.join(qr_image_path, `${response.data.controlCode}.png`);
    
                var qr_png = qr.image(qrcode, {type: 'png'});
    
                var tempFile = qr_png.pipe(require('fs').createWriteStream(file_name));
    
                tempFile.on('open', function(fd) {
                    Jimp.read(file_name, function (err, image) {
                        if (err) {
                        //   console.log(err)
                        } else {
                        image.write(path.join(qr_image_path, `${response.data.controlCode}.jpeg`));
                        }
                    });
                })    
            }
        
        }).catch(ex => {
            // console.log(ex.response)
            // console.log(ex.response.data['Error'].message)
            let error = {
                "error_status": ex.message,
                "verify_url": "",
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(error);

        });
});


// let server = app.listen(port, host, () => {
//     console.log('Server Listening')
// });

module.exports = {
    app, server
}
