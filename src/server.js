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


const host = "0.0.0.0"
const port = "35040"

app.set('Host', host)
app.set('Port', port)

app.use(express.json())
app.use(express.urlencoded({ extended: false }))

var Tremol = require("./nodejs_tremol_loader").load([__dirname +"\\fp_core.js", __dirname +"\\fp.js"]);
var fp = new Tremol.FP();


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
                        //   console.log(err)
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
    }, print_delay)

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
                let result = {
                    "error_status": "",
                    "invoice_number": x.data.Existing.TraderSystemInvoiceNumber,
                    "cu_serial_number": payload.deviceno + " " + x.data.Existing.CommitedTimestamp,
                    "cu_invoice_number": x.data.Existing.ControlCode,
                    "verify_url": x.data.Existing.QRCode,
                    "description": "Invoice Signed Successfully"
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
                "unitPrice": val.rate,
                "hsCode": hscode,
                "quantity": val.qty
            }
            item_array.push(item_detail)
        }    
    }
    if (led) {
        for (const val of led) {
            let hscode = val.hscode ? val.hscode : ""
            let item_detail = {
                "name": val.stockitemname,
                "unitPrice": val.rate,
                "hsCode": hscode,
                "quantity": val.qty
            }
            item_array.push(item_detail)
        }
    }

    //payload.items_list = item_array
    qr_image_path = payload.qr_image_path


    let ace_req = {
        invoiceType: 0,
        transactionType: transaction_type,
        cashier: "name",
        buyer: {
            pinOfBuyer: payload.customer_pin
        },
        items: item_array,
        payment: {
            amount: payload.grand_total,

        },
        relevantNumber: payload.rel_doc_number? payload.rel_doc_number : "",
        TraderSystemInvoiceNumber: payload.invoice_number,
        ExemptionNumber: payload.customer_exid ? payload.customer_exid : ""        
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

    axios.post(req.headers.hostname, json, options)
        .then((response) => {
            if (response) {
                let result = {
                    "error_status": "",
                    "invoice_number": payload.TraderSystemInvoiceNumber,
                    "cu_serial_number": response.data.msn + " " + response.data.DateTime,
                    "cu_invoice_number": response.data.mtn,
                    "verify_url": response.data.verificationUrl,
                    "description": "Invoice Signed Successfully"
                }

                res.setHeader('Content-Type', 'application/json');
                res.send(result);
            }

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
            }

            res.setHeader('Content-Type', 'application/json');
            res.send(error);

        });
})

app.get('/total_file', (req, res) => {

    export_location = req.headers.exportpath
    import_location = req.headers.importpath
    error_location  = req.headers.errorpath
    file_name       = req.headers.filename
    invoice_number  = req.headers.invoicenumber
    print_delay     = req.headers.printdelay ? parseInt(req.headers.printdelay) : 8000 
    qr_image_path   = req.headers.qrimagepath

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
                                res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
                                return
                            } else {
                                res.send({"error_status": String(err)})
                                return
                            }
                        })
                    }

                })
                       
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
    }, print_delay)

})


// app.post('/total', (req, res) => {
//     payload = req.body
//     print_host = req.headers.hostname;
//     // printer_ip = req.headers.printerip + ':' + req.headers.printerport;
//     try {
//         fp.ServerSetSettings(print_host);
//         fp.ServerSetDeviceTcpSettings(req.headers.printerip, req.headers.printerport, req.headers.senderid);
//         var device = fp.ServerFindDevice();

//         if (device) {
//             fp.ServerSetDeviceSerialSettings(device.serialPort, device.baudRate, false); //If FD is connected on serial port or USB
//             fp.PrintDiagnostics();
//         }
//         else {
//             let error = {
//                 "error_status": "Device Not Found"
//             }

//             res.setHeader('Content-Type', 'application/json');
//             res.send(error);
//         }

//         const status = fp.ReadStatus()
//         if (status) {
//             try {
//                 fp.OpenInvoiceWithFreeCustomerData("", payload.customer_pin, "", "", "", "", "", "")
//                 for (const val of payload.item_list) {
//                     let hscode = val.hscode ? val.hscode : ""
//                     fp.SellPLUfromExtDB(val.stockitemname, val.taxrateclass, val.rate, " ", hscode, " ", val.taxrate, val.qty, 0);
//                 }

//             } catch (e) {
//                 let error = {
//                     "error_status": String(e)
//                 }
//                 res.setHeader('Content-Type', 'application/json');
//                 res.send(error);
//             }
//             const close = fp.CloseReceipt()
//             res.json(close)
//         }
//     } catch (e) {
//         let error = {
//             "error_status": String(e)
//         }

//         res.setHeader('Content-Type', 'application/json');
//         res.send(error);
//     }
// })


// app.post('/total_notworking', (req, res) => {
//     payload = req.body;
//     print_host = req.headers.hostname;
//     printer_ip = req.headers.printerip + ':' + req.headers.printerport;

//     customer_exid = payload.customer_exid ? payload.customer_exid : ""
//     ref_invoice_no = payload.rel_doc_number? payload.rel_doc_number : "",

//     all_requests = [];

//     url_Settings = axios.get(`${print_host}/Settings(tcp=1,ip=${req.headers.printerip},port=${req.headers.printerport},password=${req.headers.senderid})`)
//     url_Settings.then(response => {
//         xml2js(response.data, (err, result) => {
//             if (err == null) {
//                 if (result.Res.$.Code == '0'){
//                     // success
                    
//                 } else {
//                     // xml fail
//                     res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                     return
//                 }
//             } else {
//                 res.send({"error_status": String(err)})
//                 return
//             }
//         })
//     }).catch(error => {
//         res.send({"error_status": String(error)})
//     })
    
//     url_ReadStatus = axios.get(`${print_host}/ReadStatus()`)
//     url_ReadStatus.then(response => {
//         xml2js(response.data, (err, result) => {
//             if (err == null) {
//                 if (result.Res.$.Code !== '0'){
//                     res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                     return
//                 } 
//             } else {
//                 res.send({"error_status": String(err)})
//                 return
//             }
//         })
//     }).catch(error => {
//         res.send({"error_status": String(error)})
//     })

//     if (payload.vouchertype == 'Tax Invoice') {
//         url_Invoice = axios.get(`${print_host}/OpenInvoiceWithFreeCustomerData(CompanyName=,ClientPINnum=${payload.customer_pin},HeadQuarters=,Address=,PostalCodeAndCity=,ExemptionNum=${customer_exid},TraderSystemInvNum=${payload.invoice_number})`)
//         url_Invoice.then(response => {
//             xml2js(response.data, (err, result) => {
//                 if (err == null) {
//                     if (result.Res.$.Code !== '0'){
//                         res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                         return
//                     } 
//                 } else {
//                     res.send({"error_status": String(err)})
//                     return
//                 }
//             })
//         }).catch(error => {
//             res.send({"error_status": String(error)})
//         })
//     }
    
//     if(payload.vouchertype == 'Debit Note') {
//         url_Invoice = axios.get(`${print_host}/OpenDebitNoteWithFreeCustomerData(CompanyName=,ClientPINnum=${payload.customer_pin},HeadQuarters=,Address=,PostalCodeAndCity=,ExemptionNum=${customer_exid},RelatedInvoiceNum=${ref_invoice_no},TraderSystemInvNum=${payload.invoice_number})`)
//         url_Invoice.then(response => {
//             xml2js(response.data, (err, result) => {
//                 if (err == null) {
//                     if (result.Res.$.Code !== '0'){
//                         res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                         return
//                     } 
//                 } else {
//                     res.send({"error_status": String(err)})
//                     return
//                 }
//             })
//         }).catch(error => {
//             res.send({"error_status": String(error)})
//         })
//     }
    
//     if(payload.vouchertype == 'Credit Note') {
//         url_Invoice = axios.get(`${print_host}/OpenCreditNoteWithFreeCustomerData(CompanyName=,ClientPINnum=${payload.customer_pin},HeadQuarters=,Address=,PostalCodeAndCity=,ExemptionNum=${customer_exid},RelatedInvoiceNum=${ref_invoice_no},TraderSystemInvNum=${payload.invoice_number})`)
//         all_requests.then(response => {
//             xml2js(response.data, (err, result) => {
//                 if (err == null) {
//                     if (result.Res.$.Code !== '0'){
//                         res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                         return
//                     } 
//                 } else {
//                     res.send({"error_status": String(err)})
//                     return
//                 }
//             })
//         }).catch(error => {
//             res.send({"error_status": String(error)})
//         })
//     }
    
//     for (item of payload.items_list) {
//         hscode = item.hscode ? item.hscode : ""
//         response = axios.get(`${print_host}/SellPLUfromExtDB(NamePLU=${item.stockitemname},OptionVATClass=${item.taxrateclass},Price=${item.rate},MeasureUnit=${item.base_unit},HSCode=${hscode},HSName=,VATGrRate=${item.taxrate},Quantity=${item.qty},DiscAddP=)`)
//         response.then(response => {
//             xml2js(response.data, (err, result) => {
//                 if (err == null) {
//                     if (result.Res.$.Code !== '0'){
//                         res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                         return
//                     } 
//                 } else {
//                     res.send({"error_status": String(err)})
//                     return
//                 }
//             })
//         }).catch(error => {
//             res.send({"error_status": String(error)})
//         })
//     }
    
//     if (payload.led_list) {
//         for (item of payload.led_list) {
//             hscode = item.hscode ? item.hscode : ""
//             response = axios.get(`${print_host}/SellPLUfromExtDB(NamePLU=${item.stockitemname},OptionVATClass=${item.taxrateclass},Price=${item.rate},MeasureUnit=${item.base_unit},HSCode=${hscode},HSName=,VATGrRate=${item.taxrate},Quantity=${item.qty},DiscAddP=)`)
//             response.then(response => {
//                 xml2js(response.data, (err, result) => {
//                     if (err == null) {
//                         if (result.Res.$.Code !== '0'){
//                             res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                             return
//                         } 
//                     } else {
//                         res.send({"error_status": String(err)})
//                         return
//                     }
//                 })
//             }).catch(error => {
//                 res.send({"error_status": String(error)})
//             })
//         }            
//     }

//     url_CloseReceipt = axios.get(`${print_host}/CloseReceipt()`)
//     url_CloseReceipt.then(response => {
//         xml2js(response.data, (err, result) => {
//             if (err == null) {
//                 if (result.Res.$.Code !== '0'){
//                     res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                     return
//                 } 
//             } else {
//                 res.send({"error_status": String(err)})
//                 return
//             }
//         })
//     }).catch(error => {
//         res.send({"error_status": String(error)})
//     })
//     // all_requests.push(url_CloseReceipt)

//     url_ReadDateTime = axios.get(`${print_host}/ReadDateTime()`)
//     url_ReadDateTime.then(response => {
//         xml2js(response.data, (err, result) => {
//             if (err == null) {
//                 if (result.Res.$.Code !== '0'){
//                     res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//                     return
//                 } 
//             } else {
//                 res.send({"error_status": String(err)})
//                 return
//             }
//         })
//     }).catch(error => {
//         res.send({"error_status": String(error)})
//     })


//     get_json

//     // all_requests.push(url_ReadDateTime)

//     // axios.all(all_requests)
//     //     .then(
//     //         axios.spread((...responses) => {
//     //             for (response of responses) {
//     //                 xml2js(response.data, (err, result) => {
//     //                     if (err == null) {
//     //                         if (result.Res.$.Code !== '0'){
//     //                             res.send({"error_status": `Error Code ${result.Res.$.Code} \n ${result.Res.Err[0].Message[0]}`})
//     //                             return
//     //                         } 
//     //                     } else {
//     //                         res.send({"error_status": String(err)})
//     //                         return
//     //                     }
//     //                 })
//     //             }
//     //             res.send(responses[-1].data);
//     //         })
//     //     )
//     //     .catch(error => {
//     //         console.log(error)
//     //         res.send(error)
//     //         return
//     //     })

// })


// server.listen(port, host, () => {
//     console.log('Server Listening')
// })

module.exports = {
    app, server
}
