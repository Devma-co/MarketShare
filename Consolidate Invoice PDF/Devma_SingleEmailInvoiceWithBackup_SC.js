/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */

define(['N/record', 'N/file', 'N/search', 'N/http', 'N/log', 'N/render', 'N/email'],
    function (record, file, search, http, log, render, email) {
        function execute(context) {
            try {
                var filters = [
                    ["type", "anyof", "CustInvc"],
                    "AND",
                    ["custbody_devma_inv_comm_status", "anyof", "2"],
                    "AND",
                    ["mainline", "is", "T"],
                    "AND",
                    ["customer.custentity_ms_ap_email", "isnotempty", ""],
                    "AND",
                    ["customer.custentity_devma_inv_comm_preference", "anyof", "5"],
                    "AND",
                    ["custbody_devma_invoice_send_date", "isnotempty", ""],
                    "AND",
                    ["custbody_devma_invoice_send_date", "onorbefore", "today"]
                ]
                var columns = [
                    search.createColumn({ name: "internalid", label: "Internal ID" }),
                    search.createColumn({ name: "trandate", label: "Date" }),
                    search.createColumn({ name: "tranid", label: "SO" }),
                    search.createColumn({ name: "internalid", join: "file", label: "SO File Internal ID" }),
                    search.createColumn({ name: "billingtransaction", label: "Invoice" }),
                    search.createColumn({ name: "tranid", label: "Document Number" }),
                    search.createColumn({ name: "entity", label: "Name" }),
                    search.createColumn({
                        name: "custentity_devma_inv_comm_preference",
                        join: "customer",
                        label: "Invoice Communication Preference"
                    }),
                    search.createColumn({
                        name: "email",
                        join: "customer",
                        label: "Email"
                    }),
                    search.createColumn({
                        name: "custentity_ms_ap_email",
                        join: "customer",
                        label: "AP Email"
                    }),
                    search.createColumn({ name: "datecreated", label: "Date Created" }),
                    search.createColumn({ name: "custbody_devma_invoice_with_backup_doc", label: "Invoice With Backup Docs" }),
                    search.createColumn({ name: "custbody_devma_inv_comm_status", label: "Invoice Communication Status" }),
                    search.createColumn({ name: "custbody_devma_invoice_send_date", label: "Invoice Send Date" })
                ]

                var tranSearchResults = getSearchResults('transaction', filters, columns)
                log.debug('tranSearchResults', tranSearchResults.length)
                if (tranSearchResults != null && tranSearchResults != '') {
                    for (var s = 0; s < tranSearchResults.length; s++) {
                        var invId = tranSearchResults[s].getValue('internalid')
                        var customerId = tranSearchResults[s].getValue('entity')
                        var pdfFile = tranSearchResults[s].getValue('custbody_devma_invoice_with_backup_doc')
                        var custEmail = tranSearchResults[s].getValue({
                            name: "custentity_ms_ap_email",
                            join: "customer",
                            label: "AP Email"
                        })
                        log.debug('backupFile', pdfFile)

                        if (pdfFile != null && pdfFile != '') {

                            var pdfFile = file.load({ id: pdfFile });

                            // Create a consolidated PDF file
                            var timestamp = new Date().getTime();
                            var consolidatedPdfFile = file.create({
                                name: 'Customer_PO_' + timestamp + '.pdf',
                                fileType: file.Type.PDF,
                                contents: pdfFile.getContents(),
                                folder: 35374 // Replace with your folder ID
                            });

                            // Save the consolidated PDF file
                            var fileId = consolidatedPdfFile.save();
                            log.debug("Consolidated PDF saved with ID", fileId);
                            var emailSubject = 'Invoice with backups'
                            var emailBody = "Hello,\n\n" +
                                "I hope this message finds you well.\n\n" +
                                "Please find attached the invoice for your records.\n\n" +
                                "Kind regards"

                            //  var recipientEmail = ['nansari@devma.co','jcatangay@devma.co'] // Replace with recipient's email
                            var recipientEmail = [custEmail]
                            if (recipientEmail != null && recipientEmail != '') {
                                var mergeResult = render.mergeEmail({
                                    templateId: 205,
                                    entity: {
                                        type: 'customer',
                                        id: parseInt(customerId)
                                    },
                                    transactionId: parseInt(invId)
                                });

                                // Send email with attachment
                                email.send({
                                    author: 20071, // Use -5 for the current user or specify a user ID
                                    recipients: recipientEmail,
                                    subject: mergeResult.subject,
                                    body: mergeResult.body,
                                    attachments: [file.load({ id: fileId })], // Load the saved file for attachment
                                    relatedRecords: {
                                        transactionId: invId  // Attach to the transaction
                                    }
                                });
                                record.submitFields({
                                    type: 'invoice',
                                    id: invId,
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
                log.error('Error in Merging PDFs', error);
            }
        }

        return {
            execute: execute
        };
        function getSearchResults(rectype, fils, cols) {
            var mySearch = search.create({
                type: rectype,
                columns: cols,
                filters: fils
            });
            var resultsList = [];
            var myPagedData = mySearch.runPaged({ pageSize: 1000 });
            myPagedData.pageRanges.forEach(function (pageRange) {
                var myPage = myPagedData.fetch({ index: pageRange.index });
                myPage.data.forEach(function (result) {
                    resultsList.push(result);
                });
            });
            return resultsList;
        }
    });