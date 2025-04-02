/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/search', 'N/render', 'N/file', 'N/log', 'N/record', 'N/email'], function (search, render, file, log, record, email) {

    function execute(context) {
        try {
            var invoiceSearchObj = search.create({
                type: "invoice",
                //settings: [{ "name": "consolidationtype", "value": "ACCTTYPE" }],
                filters: [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["custbody_devma_inv_comm_status", "anyof", "2"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["customer.custentity_ms_ap_email", "isnotempty", ""],
                    "AND",
                    ["customer.custentity_devma_inv_comm_preference", "anyof", "3"],
                    "AND",
                    ["custbody_devma_invoice_send_date", "isnotempty", ""],
                    "AND",
                    ["custbody_devma_invoice_send_date", "onorbefore", "today"]
                ],
                columns: [
                    //search.createColumn({ name: "custentitymkt_cus_inv_pref", join: "customer", summary: "GROUP", label: "MS Invoice Preference" }),
                    search.createColumn({ name: "tranid", summary: "COUNT", label: "Document Number" }),
                    search.createColumn({ name: "entity", summary: "GROUP", label: "Name" }),
                    search.createColumn({ name: "custentity_devma_inv_comm_preference", join: "customer", summary: "GROUP", label: "Invoice Communication Preference" }),
                    search.createColumn({ name: "email", join: "customer", summary: "GROUP", label: "Email" }),
                    search.createColumn({ name: "datecreated", summary: "GROUP", label: "Date Created" }),
                    search.createColumn({ name: "formulatext", summary: "MAX", formula: "NS_CONCAT(DISTINCT {internalid})", label: "Invoice: Internal ID(s)" }),
                    search.createColumn({ name: "custbody_devma_inv_comm_status", summary: "GROUP", label: "Invoice Communication Status" }),
                    search.createColumn({ name: "custbody_devma_invoice_send_date", summary: "GROUP", label: "Invoice Send Date" }),
                    search.createColumn({ name: "internalid", join: "customer", summary: "GROUP", label: "Internal ID" })
                ]
            });

            var searchResultCount = invoiceSearchObj.runPaged().count;
            log.debug("invoiceSearchObj result count", searchResultCount);

            var invoiceIdsByCustomer = {};
            invoiceSearchObj.run().each(function (result) {
                var invoiceIdsText = result.getValue({ name: "formulatext", summary: "MAX" });
                log.debug('invoiceIdsText', invoiceIdsText);
                if (invoiceIdsText) {
                    var invoiceIds = invoiceIdsText.split(',').map(Number); // Convert to number array
                    var customerId = result.getValue({ name: "internalid", join: "customer", summary: "GROUP" });

                    if (!invoiceIdsByCustomer[customerId]) {
                        invoiceIdsByCustomer[customerId] = [];
                    }
                    invoiceIdsByCustomer[customerId] = invoiceIdsByCustomer[customerId].concat(invoiceIds); // Grouping invoices by customer
                }
                return true;
            });

            log.debug('Grouped Invoices by Customer', invoiceIdsByCustomer);

            // Generate PDF for each customer group
            for (var customerId in invoiceIdsByCustomer) {
                if (invoiceIdsByCustomer.hasOwnProperty(customerId)) {
                    var invoiceIds = invoiceIdsByCustomer[customerId];
                    var pdfArray = []
                    var invoiceNumberArr = ""

                    for (var i = 0; i < invoiceIds.length; i++) {
                        var invObj = record.load({ type: 'invoice', id: Number(invoiceIds[i]) })
                        var invoicePdf = invObj.getValue('custbody_devma_invoice_with_backup_doc')
                        var invoiceNumber = invObj.getValue('tranid')
                        if (invoicePdf != null && invoicePdf != '') {
                            invoiceNumberArr += invoiceNumber + ',';
                            var pdfFile = file.load({ id: invoicePdf });
                            pdfArray.push(pdfFile)
                        }
                    }
                    if (invoiceNumberArr != null && invoiceNumberArr != '')
                        invoiceNumberArr = invoiceNumberArr.slice(0, -1);



                    // Create a consolidated PDF file
                    var customerObj = record.load({ type: 'customer', id: customerId })
                    var customerName = customerObj.getValue('entityid')
                    var emailAdd = customerObj.getValue('custentity_ms_ap_email')
                    var timestamp = new Date().getTime();

                    var emailSubject = customerName + ' Invoice ' + invoiceNumberArr
                    var emailBody = "Hello,\n\n" +
                        "I hope this message finds you well.\n\n" +
                        "Please find attached the invoice for your records.\n\n" +
                        "Kind regards"
                    // var recipientEmail = ['nansari@devma.co','jcatangay@devma.co']
                    var recipientEmail = [emailAdd]
                    if (recipientEmail != null && recipientEmail != '') {

                        var mergeResult = render.mergeEmail({
                            templateId: 205,
                            entity: {
                                type: 'customer',
                                id: parseInt(customerId)
                            }
                        });
                        // Send email with attachment
                        email.send({
                            author: 20071,
                            recipients: recipientEmail,
                            subject: emailSubject,
                            body: mergeResult.body,
                            attachments: pdfArray, // Load the saved file for attachment
                            relatedRecords: {
                                entityId: Number(customerId)  // Attach to the transaction
                            }
                        });
                        for (var i = 0; i < invoiceIds.length; i++) {

                            log.debug('invoiceIds', invoiceIds[i])
                            /*  email.send({
                             author: 7, // Use -5 for the current user or specify a user ID
                             recipients: recipientEmail,
                             subject: emailSubject,
                             body: emailBody,
                             attachments: [pdfArray[i]], // Load the saved file for attachment
                             relatedRecords: {
                               transactionId: invoiceIds[i]  // Attach to the transaction
                             }
                           });*/

                            record.submitFields({
                                type: 'invoice',
                                id: invoiceIds[i],
                                values: {
                                    custbody_devma_inv_comm_status: 3
                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });
                        }
                    }
                }
            }

        } catch (error) {
            log.error({
                title: 'Error in Scheduled Script',
                details: error
            });
        }
    }

    return {
        execute: execute
    };
});