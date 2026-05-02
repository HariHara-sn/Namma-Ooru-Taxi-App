import { PermissionsAndroid, Platform } from 'react-native';
import RNHTMLtoPDF from 'react-native-html-to-pdf';
import RNFS from "react-native-fs";
import moment from 'moment';

import { showNotification } from "../components/NotificationManger";

import useConfigStore from "../store/useConfigStore";

// FIX: useConfigStore is a hook, should not be called at module level
// Instead, we will access appConfig inside the class constructor or methods as needed

class PDFCreator {
    constructor() {
        // FIX: get appConfig from store at construction time
        try {
            const { appConfig } = useConfigStore.getState ? useConfigStore.getState() : { appConfig: {} };
            this.appConfig = appConfig || {};
        } catch (e) {
            this.appConfig = {};
        }

        this.htmlBody = `<!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document</title>
          <style>
              .container {
                  width: 80%;
                  margin: 0 auto;
                  text-align: center;
                  font-family: Arial, sans-serif;
              }
      
              h2 {
                  background-color: #f2f2f2;
                  padding: 10px;
                  border-radius: 5px;
              }
                </style>
      </head>
      <body>
          
          <div class="container">
              <h2>PDF Downloaded</h2>
             <h3>No Contents Found !</h3>
          </div>
      </body>
      </html>
      `;
        // Branding helpers
        this.companyName = (this.appConfig && (this.appConfig.COMPANYNAME || this.appConfig.APP_NAME)) ? (this.appConfig.COMPANYNAME || this.appConfig.APP_NAME) : 'Company';
        this.companyLogoDataUri = null; // Set via setCompanyLogoDataUri if available
    }

    // Standard currency formatter: always return two decimals
    formatMoney = (n) => Number(n || 0).toFixed(2);

    /**
     * Set notification for downloaded file
     * @param {string} fileName - Name of the downloaded file
     */
    setNotification = async (fileName) => {
        if (Platform.OS === 'android') {
            try {
                await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                );
            } catch (error) {
                console.log('Notification-->>Error-->>', error);
            }
        }
    }

    /**
     * Request storage permission for Android
     * @returns {Promise<boolean>} - Whether permission was granted
     */
    requestPermission = async () => {
        try {
            const isPermittedExternalStorage = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            );

            if (!isPermittedExternalStorage) {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                    {
                        title: 'Storage permission needed',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    },
                );

                if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                    return true;
                } else {
                    console.log('Permission denied Else');
                    return false;
                }
            } else {
                return true;
            }
        } catch (error) {
            console.log(error, 'error getting permission');
            return false;
        }
    }

    /**
     * Check if storage permission is already granted
     * @returns {Promise<boolean>} - Whether permission is granted
     */
    checkPermission = async () => {
        if (Platform.OS === 'ios') {
            return true; // iOS permissions are handled in the plist file
        }

        try {
            const granted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            );
            return granted;
        } catch (err) {
            console.warn(err);
            return false;
        }
    }

    /**
     * Create PDF with custom HTML content
     * @param {string} htmlElement - HTML content to convert to PDF
     * @param {string} name - Name for the PDF file
     * @param {string} customDirectory - Optional custom directory path
     * @returns {Promise<string>} - Path to the created PDF file
     */
    createPDF = async (htmlElement, name, customDirectory = null) => {
        if (name == "Engine On/Off Hours") name = "Engine Hours";

        let directory;
        if (Platform.OS === "ios") {
            directory = customDirectory || "Documents";
        } else {
            directory = customDirectory || "Download";
        }

        try {
            let options = {
                html: htmlElement ?? this.htmlBody,
                fileName: name ?? 'testing',
                directory: directory,
                width: 700,
                height: 842, // A4 height
                padding: 20,
            };

            // Create the PDF
            let file = await RNHTMLtoPDF.convert(options);

            if (!file || !file.filePath) {
                throw new Error('PDF creation failed - no file path returned');
            }

            // Android: Handle file storage and permissions
            if (Platform.OS === 'android') {
                if (Platform.Version < 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                        {
                            title: 'Storage Permission Required',
                            message: 'App needs access to your storage to download files',
                        }
                    );

                    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                        throw new Error('Storage permission denied');
                    }
                }

                // Use custom directory if provided, otherwise use Downloads
                const targetDirectory = customDirectory || RNFS.DownloadDirectoryPath;
                const fileName = `${name} ${moment(new Date()).format('DD-MM-YYYY-hh-mm-ss-A')}.pdf`;
                const downloadPath = `${targetDirectory}/${fileName}`;

                try {
                    // Read the file from the initial location
                    const fileData = await RNFS.readFile(file.filePath, 'base64');

                    // Ensure target directory exists
                    await this.ensureDirectoryExists(targetDirectory);

                    // Write the file to the target directory
                    await RNFS.writeFile(downloadPath, fileData, 'base64');

                    // showNotification('PDF Created', `PDF file created at: ${downloadPath}`, "success");
                    this.setNotification(fileName);

                    return downloadPath;
                } catch (moveError) {
                    console.error('Error moving PDF file:', moveError);
                    // Return original path if move fails
                    return file.filePath;
                }
            } else {
                // iOS: Return the file path directly
                // showNotification('PDF Created', `PDF file created successfully`, "success");
                this.setNotification(`${name}.pdf`);
                return file.filePath;
            }

        } catch (error) {
            console.error('PDF creation error:', error);
            showNotification('Error', 'Failed to create PDF: ' + error.message, "danger");
            throw error;
        }
    };

    /**
     * Create PDF receipt for ride data
     * @param {Object} rideData - Ride data object
     * @param {string} customDirectory - Optional custom directory path
     * @returns {Promise<string>} - Path to the created PDF file
     */
    createRideReceiptPDF = async (rideData, customDirectory = null) => {
        try {
            // Format the receipt data
            const receiptData = this.formatReceiptData(rideData);

            // Generate HTML content for the receipt
            const htmlContent = this.generateReceiptHTML(receiptData);

            // Create PDF with the generated HTML
            const fileName = `Receipt_${receiptData.receiptId}_${moment().format('DD-MM-YYYY')}`;
            const pdfPath = await this.createPDF(htmlContent, fileName, customDirectory);

            return pdfPath;
        } catch (error) {
            console.error('Error creating ride receipt PDF:', error);
            throw error;
        }
    };

    /**
     * Ensure directory exists, create if it doesn't
     * @param {string} dirPath - Directory path to check/create
     */
    ensureDirectoryExists = async (dirPath) => {
        try {
            const exists = await RNFS.exists(dirPath);
            if (!exists) {
                await RNFS.mkdir(dirPath);
            }
        } catch (error) {
            console.error('Error ensuring directory exists:', error);
            throw error;
        }
    };

    /**
     * Generate HTML content for the receipt
     * @param {Object} receiptData - Formatted receipt data
     * @returns {string} - HTML content string
     */
    generateReceiptHTML = (receiptData) => {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Ride Receipt</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            background-color: #ffffff;
                            color: #000000;
                            line-height: 1.6;
                        }
                        
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #0080ff;
                            padding-bottom: 20px;
                            margin-bottom: 30px;
                        }
                        
                        .company-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #0080ff;
                            margin-bottom: 10px;
                        }
                        
                        .receipt-title {
                            font-size: 20px;
                            font-weight: bold;
                            color: #000000;
                            margin-bottom: 5px;
                        }
                        
                        .receipt-id {
                            font-size: 14px;
                            color: #666666;
                        }
                        
                        .amount-section {
                            text-align: center;
                            background-color: #f8f9fa;
                            padding: 20px;
                            border-radius: 10px;
                            margin: 20px 0;
                        }
                        
                        .total-amount {
                            font-size: 32px;
                            font-weight: bold;
                            color: #1C9A18;
                        }
                        
                        .amount-label {
                            font-size: 16px;
                            color: #666666;
                            margin-top: 5px;
                        }
                        
                        .info-section {
                            margin: 20px 0;
                        }
                        
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            margin: 10px 0;
                            padding: 8px 0;
                            border-bottom: 1px solid #eeeeee;
                        }
                        
                        .info-label {
                            font-weight: bold;
                            color: #333333;
                        }
                        
                        .info-value {
                            color: #666666;
                            text-align: right;
                        }
                        
                        .driver-section {
                            background-color: #f8f9fa;
                            padding: 15px;
                            border-radius: 8px;
                            margin: 20px 0;
                        }
                        
                        .driver-title {
                            font-size: 18px;
                            font-weight: bold;
                            color: #0080ff;
                            margin-bottom: 15px;
                        }
                        
                        .footer {
                            text-align: center;
                            margin-top: 40px;
                            padding-top: 20px;
                            border-top: 1px solid #eeeeee;
                            color: #666666;
                            font-size: 12px;
                        }
                        
                        .qr-placeholder {
                            text-align: center;
                            margin: 20px 0;
                            padding: 20px;
                            background-color: #f0f0f0;
                            border-radius: 8px;
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="company-name">${receiptData.companyName}</div>
                        <div class="receipt-title">Ride Receipt</div>
                        <div class="receipt-id">Receipt ID: ${receiptData.receiptId}</div>
                    </div>
                    
                    <div class="amount-section">
                        <div class="total-amount">₹${receiptData.totalAmount}</div>
                        <div class="amount-label">Total Amount</div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <span class="info-label">Date:</span>
                            <span class="info-value">${receiptData.date}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Time:</span>
                            <span class="info-value">${receiptData.time}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Distance:</span>
                            <span class="info-value">${receiptData.distance} km</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Duration:</span>
                            <span class="info-value">${receiptData.duration} mins</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Vehicle Type:</span>
                            <span class="info-value">${receiptData.vehicleType}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Payment Method:</span>
                            <span class="info-value">${receiptData.paymentMethod}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Payment Status:</span>
                            <span class="info-value">${receiptData.paymentStatus}</span>
                        </div>
                    </div>
                    
                    <div class="driver-section">
                        <div class="driver-title">Driver Information</div>
                        <div class="info-row">
                            <span class="info-label">Driver Name:</span>
                            <span class="info-value">${receiptData.driverName}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Rating:</span>
                            <span class="info-value">${receiptData.driverRating} ⭐</span>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <div class="info-row">
                            <span class="info-label">From:</span>
                            <span class="info-value">${receiptData.startLocation}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">To:</span>
                            <span class="info-value">${receiptData.endLocation}</span>
                        </div>
                    </div>
                    
                    <div class="qr-placeholder">
                        <div style="font-size: 14px; color: #666666;">
                            QR Code for Digital Verification
                        </div>
                    </div>
                    
                    <div class="footer">
                        <div>Thank you for choosing ${receiptData.companyName}</div>
                        <div>Generated on ${new Date().toLocaleString()}</div>
                    </div>
                </body>
            </html>
        `;
    };

    generateVendorInvoiceHTML = (receiptData) => {
        const taxRows = receiptData.taxes && receiptData.taxes.breakdown
            ? Object.entries(receiptData.taxes.breakdown).map(([k, v]) => {
                const label = (v.label || k).toUpperCase();
                const rate =
                    v.type === "percentage" && typeof v.value !== "undefined"
                        ? `(${v.value}%)`
                        : v.type === "flat" && typeof v.value !== "undefined"
                            ? `(₹ ${v.value})`
                            : "";
                return `
          <tr>
            <td>${label} <span class="vendortax-muted">${rate}</span></td>
            <td class="vendortax-money">₹ ${Number(v.tax).toFixed(2)}</td>
          </tr>`;
            }).join("")
            : "";
        return `
           <div class="tripbill-sheet sheet-page" style="page-break-after: always;">
    <div class="vendortax-invoice">
      <div class="vendortax-bar">
        <div class="vendortax-brand">${receiptData.invoiceTitle || "Vendor Trip Invoice"}</div>
        <span class="vendortax-badge">${receiptData.invoiceType || "Original Tax Invoice"}</span>
      </div>

      <div class="vendortax-wrap">
        <div class="vendortax-meta">
          <!-- Trip & Customer -->
          <div class="vendortax-card">
            <h3>Trip & Customer</h3>
            <div class="vendortax-kv">
              <small>Invoice Date</small><div>${receiptData.invoiceDate}</div>
              <small>Invoice #</small><div>${receiptData.invoiceNumber}</div>
              <small>Customer Name</small><div>${receiptData.customerName}</div>
              <small>Mobile</small><div>${receiptData.customerMobile}</div>
              <small>Pickup Address</small><div>${receiptData.pickupAddress}</div>
            </div>
           
          </div>

          <!-- Vendor Info -->
          <div class="vendortax-card">
            <h3>Vendor Information</h3>
            <div class="vendortax-kv">
              <small>Name</small><div>${receiptData.vendor?.name || ""}</div>
              <small>Phone</small><div>${receiptData.vendor?.phone || ""}</div>
              <small>Email</small><div>${receiptData.vendor?.email || ""}</div>
              <small>GSTIN</small><div>${receiptData.vendor?.gst || ""}</div>
              <small>PAN</small><div>${receiptData.vendor?.pan || ""}</div>
            </div>
            <div class="vendortax-kpis">
              <div class="vendortax-kpi"><div class="v">${receiptData.totalDistance}</div><div class="l">Total Distance</div></div>
              <div class="vendortax-kpi"><div class="v">${receiptData.totalTravelTime}</div><div class="l">Travel Time</div></div>
              <div class="vendortax-kpi"><div class="v">${receiptData.totalWaitingTime}</div><div class="l">Waiting Time</div></div>
            </div>
          </div>
        </div>

        <h3 class="vendortax-section-title">Fare & Tax Break-up</h3>
        <div class="vendortax-grid2">
          <!-- Fare Table -->
          <table>
            <thead>
              <tr>
                <th style="width:60%">Fare Description</th>
                <th class="vendortax-money" style="width:40%">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td class="vendortax-money">₹ ${this.formatMoney(receiptData.baseFare)}</td></tr>
              
              <tr><td>Total Waiting Fare</td><td class="vendortax-money">₹ ${this.formatMoney(receiptData.waitingFare)}</td></tr>
              <tr><td class="vendortax-muted">Discount</td><td class="vendortax-money">− ₹ ${this.formatMoney(receiptData.discount)}</td></tr>
              <tr><td><b>Sub Total</b></td><td class="vendortax-money"><b>₹ ${this.formatMoney(receiptData.subTotal)}</b></td></tr>
            </tbody>
          </table>

          <!-- Tax Table -->
          <table>
            <thead>
              <tr>
                <th style="width:60%">Tax Break-up</th>
                <th class="vendortax-money" style="width:40%">Tax Amount</th>
              </tr>
            </thead>
            <tbody>
              ${taxRows}
              <tr><td><b>Total Tax</b></td><td class="vendortax-money"><b>₹ ${Number(receiptData?.taxes?.total || 0).toFixed(2)}</b></td></tr>
            </tbody>
          </table>
        </div>

        <div class="vendortax-totals">
          <div class="vendortax-notes">
            <p><strong>Notes</strong></p>
            <ul>${(receiptData.notes || []).map(n => `<li>${n}</li>`).join("")}</ul>
          </div>
          <div class="vendortax-sum">
            <div class="vendortax-row"><div>Sub Total</div><div class="vendortax-money">₹ ${this.formatMoney(receiptData.subTotal)}</div></div>
            <div class="vendortax-row"><div>Tax Total</div><div class="vendortax-money">₹ ${Number(receiptData?.taxes?.total || 0).toFixed(2)}</div></div>
            <div class="vendortax-row"><div>Discount</div><div class="vendortax-money">− ₹ ${this.formatMoney(receiptData.discount)}</div></div>
            <div class="vendortax-row vendortax-total"><div>Net Payable</div><div class="vendortax-money">₹ ${this.formatMoney(receiptData.netFare)}</div></div>
          </div>
        </div>
      </div>

      <div class="vendortax-footer">
        <div class="vendortax-sign">
          <div class="vendortax-stamp">
            <img src="${receiptData.authoritySignUrl || ""}" alt="signature">
          </div>
          <div>
            <div style="font-weight:700">${receiptData.authorityName || "Authorized Signatory"}</div>
            <div class="vendortax-muted" style="font-size:12px">${receiptData.authorityCompany || ""}</div>
          </div>
        </div>
        <div class="vendortax-muted" style="font-size:12px">Thank you.</div>
      </div>
    </div>
  </div>
        `;
    };

    /**
     * Format receipt data for PDF generation
     * @param {Object} rideData - The ride data object
     * @returns {Object} - Formatted receipt data
     */
    formatReceiptData = (rideData) => {
        return {
            receiptId: rideData._id || 'TXN' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            date: new Date(rideData.bookingTime).toLocaleDateString(),
            time: new Date(rideData.bookingTime).toLocaleTimeString(),
            totalAmount: (rideData.fareDetails?.fare || rideData.estimatedFare || 0).toFixed(2),
            distance: (rideData.finalDistance || rideData.estimatedDistance || 0).toFixed(1),
            duration: rideData.finalDuration || rideData.estimatedDuration || 0,
            vehicleType: rideData.vehicleType || 'Standard',
            driverName: rideData.driverInfo?.driverName || 'N/A',
            driverRating: rideData.driverInfo?.driverRating || 'N/A',
            startLocation: rideData.stops?.[0]?.name || rideData.stops?.[0]?.address || 'N/A',
            endLocation: rideData.stops?.[rideData.stops.length - 1]?.name || rideData.stops?.[rideData.stops.length - 1]?.address || 'N/A',
            paymentMethod: rideData.paymentMethod || 'Cash',
            paymentStatus: rideData.passengerPaymentStatus || 'completed',
            companyName: (this.appConfig && (this.appConfig.COMPANYNAME || this.appConfig.APP_NAME)) ? (this.appConfig.COMPANYNAME || this.appConfig.APP_NAME) : 'Namma Ooru Taxi',
            companyLogo: 'https://example.com/logo.png'
        };
    };

    /**
     * Create PDF with custom HTML and save to custom directory
     * @param {string} htmlContent - HTML content to convert
     * @param {string} fileName - Name for the PDF file
     * @param {string} customDirectory - Custom directory path
     * @returns {Promise<string>} - Path to the created PDF file
     */
    createCustomPDF = async (htmlContent, fileName, customDirectory) => {
        try {

            await this.ensureDirectoryExists(customDirectory);

            const pdfPath = await this.createPDF(htmlContent, fileName, customDirectory);

            return pdfPath;
        } catch (error) {
            console.error('Error creating custom PDF:', error);
            throw error;
        }
    };

    /**
     * Generate multi-sheet PDF with different templates for each sheet type
     * @param {Array} sheetData - Array of objects with type and data
     * @param {string} fileName - Name for the PDF file
     * @param {string} customDirectory - Optional custom directory path
     * @returns {Promise<string>} - Path to the created PDF file
     */
    createMultiSheetPDF = async (sheetData, fileName, customDirectory = null) => {
        try {
            // Generate HTML for each sheet type
            const sheetHTMLs = sheetData.map((sheet, index) => {
                const html = this.generateSheetHTML(sheet.type, sheet.data, index + 1);
                return html;
            });

            // Combine all sheets into one HTML document
            const combinedHTML = this.combineSheetsHTML(sheetHTMLs, fileName);

            // Create PDF with combined HTML
            const pdfPath = await this.createPDF(combinedHTML, fileName, customDirectory);

            return pdfPath;

        } catch (error) {
            console.error('Error creating multi-sheet PDF:', error);
            throw error;
        }
    };

    generateDriverInvoiceHTML = (receiptData) => {
        return `
             
                <div class="tripbill-sheet sheet-page" style="page-break-after: always;">
                    <div class="invoice">
                    <div class="bar">
                        <div class="brand">
                        <span>${receiptData.invoiceTitle}</span>
                        </div>
                        <span class="badge">${receiptData.invoiceType}</span>
                    </div>

                    <div class="wrap">
                        <div class="meta">
                        <div class="card">
                            <h3>Trip & Customer</h3>
                            <div class="kv">
                            <small>Invoice Date</small><div>${receiptData.invoiceDate}</div>
                            <small>Invoice #</small><div>${receiptData.invoiceNumber}</div>
                            <small>Customer Name</small><div>${receiptData.customerName}</div>
                            <small>Mobile</small><div>${receiptData.customerMobile}</div>
                            <small>Pickup Address</small><div>${receiptData.pickupAddress}</div>
                            </div>
                            <div class="chips">
                           
                            </div>
                        </div>

                        <div class="card">
                            <h3>Driver & Vehicle</h3>
                            <div class="kv">
                            <small>Driver</small><div>${receiptData.driverName}</div>
                            <small>Operator</small><div>${receiptData.operatorName}</div>
                            <small>Vehicle</small><div>${receiptData.vehicleNumber}</div>
                            <small>State / UT</small><div>${receiptData.stateUT}</div>
                            <small>Booking ID</small><div>${receiptData.bookingId}</div>
                            </div>
                            <div class="kpis">
                            <div class="kpi"><div class="v">${receiptData.totalDistance}</div><div class="l">Total Distance</div></div>
                            <div class="kpi"><div class="v">${receiptData.totalTravelTime}</div><div class="l">Travel Time</div></div>
                            <div class="kpi"><div class="v">${receiptData.totalWaitingTime}</div><div class="l">Waiting Time</div></div>
                          
                            </div>
                        </div>
                        </div>

                        <h3 class="section-title">Fare Break-up (No Tax)</h3>
                        <table>
                        <thead>
                            <tr>
                            <th style="width:50%">Description</th>
                            <th class="money" style="width:25%">Rate</th>
                            <th class="money" style="width:25%">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                           
                            <td class="money">–</td>
                            <td class="money">${this.formatMoney(receiptData.baseFare)}</td>
                            </tr>
                           
                            <tr>
                            <td>Total Waiting Fare</td>
                            <td class="money">–</td>
                            <td class="money">${this.formatMoney(receiptData.waitingFare)}</td>
                            </tr>
                            <tr>
                            <td class="muted">Discount</td>
                            <td class="money">–</td>
                            <td class="money">− ${this.formatMoney(receiptData.discount)}</td>
                            </tr>
                        </tbody>
                        </table>

                        <div class="totals">
                        <div class="notes">
                            <p><strong>Notes</strong></p>
                            <ul>
                            ${(receiptData.notes || []).map(note => `<li>${note}</li>`).join('')}
                            </ul>
                        </div>
                        <div class="sum">
                            <div class="row"><div>Sub Total</div><div class="money">${this.formatMoney(receiptData.subTotal)}</div></div>
                            <div class="row"><div>Discount</div><div class="money">− ${this.formatMoney(receiptData.discount)}</div></div>
                            <div class="row total"><div>Net Fare</div><div class="money">${this.formatMoney(receiptData.netFare)}</div></div>
                        </div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="sign">
                        <div class="stamp">
                            <img src="${receiptData.authoritySignUrl}" alt="signature"/>
                        </div>
                        <div>
                            <div style="font-weight:700">${receiptData.authorityName}</div>
                            <div class="muted" style="font-size:12px">${receiptData.authorityCompany}</div>
                        </div>
                        </div>
                        <div class="muted" style="font-size:12px">Thank you for riding with us.</div>
                    </div>
                    </div>
                </div>
               
                `;
            }

    /**
     * Generate HTML for a specific sheet type
     * @param {string} sheetType - Type of sheet (tripBill, tripInvoice, taxInvoice, etc.)
     * @param {Object} data - Data for the sheet
     * @param {number} pageNumber - Page number in the PDF
     * @returns {string} - HTML content for the sheet
     */
    generateSheetHTML = (sheetType, data, pageNumber) => {
        switch (sheetType) {
            case 'tripBill':
                return this.generateTripBillHTML(data, pageNumber);
            case 'receipt':
                return this.generateReceiptHTML(data, pageNumber);
            case 'platformInvoice':
                return this.generatePlatformInvoiceHTML(data, pageNumber);
            case 'driverInvoice':
                return this.generateDriverInvoiceHTML(data, pageNumber);
            case 'vendorInvoice':
                return this.generateVendorInvoiceHTML(data, pageNumber);
            default:
                return this.generateGenericSheetHTML(sheetType, data, pageNumber);
        }
    };

    setCompanyLogoDataUri = (dataUri) => {
        this.companyLogoDataUri = dataUri;
    };

    renderBrandingHTML = () => {
        const logoImg = this.companyLogoDataUri
            ? `<img class="brand-logo" src="${this.companyLogoDataUri}" alt="logo" />`
            : '';
        return `<div class="brand">${logoImg}<div class="company-name">${this.companyName}</div></div>`;
    };

    /**
     * Generate Trip Bill HTML
     */
    generateTripBillHTML = (receiptData, pageNumber) => {
        // Normalize and map incoming data keys

        return `
            <div class="tripbill-sheet sheet-page" style="page-break-after: always;">
                <!-- Header -->
                <div class="tripbill-header">
               <div class="tripbill-brand">
                    <div class="tripbill-brand-name">${receiptData.companyName}</div>
                </div>
                <div class="tripbill-right">
                    <div class="tripbill-muted">${receiptData.dateLong}</div>
                    <div class="amt tripbill-money">${receiptData.currency || "₹"} ${this.formatMoney(receiptData.totalAmount)}</div>
                </div>
                </div>

                <!-- Greeting / Booking -->
                <div class="tripbill-greet">
                <div>
                    Dear ${receiptData.customerName},<br>
                    <span class="tripbill-muted">Thanks for travelling with us</span>
                </div>
                <div class="tripbill-muted"><b>Booking ID:</b> ${receiptData.bookingId}</div>
                </div>

                <!-- Bill details banner -->
                <div class="tripbill-table">
                <table style="width:100%; border-collapse:collapse">
                    <thead>
                    <tr><th>Bill Details</th></tr>
                    </thead>
                </table>

                <!-- Amount rows -->
                <div class="tripbill-kv">
                    <div class="l">Your Trip</div>
                    <div class="r tripbill-money">${receiptData.currency || "₹"} ${this.formatMoney(receiptData.yourTripAmount)}</div>
                </div>
                <div class="tripbill-kv" style="background:${'var(--soft)'}">
                    <div class="l"><b>Total Payable</b><br><span class="tripbill-muted">${receiptData.taxesLine}</span></div>
                    <div class="r tripbill-money"><b>${receiptData.currency || "₹"} ${this.formatMoney(receiptData.totalPayable)}</b></div>
                </div>
                </div>

                <div class="tripbill-wrap">
                <div class="tripbill-grid">
                    <!-- Left column: Driver & stats -->
                    <div class="tripbill-card">
                    <div class="tripbill-pad">
                        <div class="tripbill-driver">
                        <img src="${receiptData.driverPhotoUrl}" alt="${receiptData.driverName}">
                        <div>
                            <div class="tripbill-h2">${receiptData.driverName}</div>
                          
                        </div>
                        </div>

                        <div class="tripbill-stat">
                        <div class="tripbill-ic">⏱</div>
                        <div>${receiptData.distance}km ${receiptData.travelTime}</div>
                        </div>
                        <div class="tripbill-stat">
                        <div class="tripbill-ic">🚗</div>
                        <div>${receiptData.vehicleLabel}</div>
                        </div>
                        <div class="tripbill-stat">
                        <div class="tripbill-ic">🎯</div>
                        <div>${receiptData.tripType}</div>
                        </div>
                    </div>
                    </div>

                    <!-- Right column: Ride details map -->
                    <div class="tripbill-card tripbill-map">
                    <!-- <img src="${receiptData.mapImageUrl}" alt="Ride Map"> -->
                    </div>
                </div>

                <!-- Timeline: pickup & drop -->
                <div class="tripbill-card" style="margin-top:16px">
                    <div class="tripbill-timeline">
                    <div class="tripbill-leg">
                        <div class="tripbill-muted">
                        ${receiptData.pickupTime}<br>
                        </div>
                        <div class="tripbill-dot pick"></div>
                        <div class="tripbill-addr">${receiptData.pickupAddress}</div>
                    </div>
                    <div class="tripbill-leg">
                        <div class="tripbill-muted">
                        ${receiptData.dropTime}<br>
                        </div>
                        <div class="tripbill-dot drop"></div>
                        <div class="tripbill-addr">${receiptData.dropAddress}</div>
                    </div>
                    </div>
                </div>
                </div>

                <!-- Footer -->
                <div class="tripbill-footer">
                <div>
                    For any queries? Visit <a href="${receiptData.supportUrl}" target="_blank">${receiptData.supportUrlText || receiptData.supportUrl}</a>
                </div>
                <div>
                    ${receiptData.footerNote || "Above fare based on travel distance and waiting. Toll, Parking, Permit charges may apply. T&C apply."}
                </div>
                </div>

                <div style="text-align:center; padding:8px; font-size:12px; color:#6b7280">${receiptData.footerNote || "Above fare based on travel distance and waiting. Toll, Parking, Permit charges may apply. T&C apply."}</div>
            </div>
        `;
    };

    /**
     * Generate Trip Invoice HTML
     */
    generateTripInvoiceHTML = (data, pageNumber) => {
        // FIX: Remove console.log
        // Map incoming fields
        const invoiceNo = data.invoiceNo || data.invoiceNumber || 'N/A';
        const invoiceDate = data.invoicedate || data.invoiceDate || new Date().toLocaleDateString();
        const rideId = data.rideId || data.tripId || 'N/A';
        const customerName = data.customerName || 'N/A';
        const customerPickupAddress = data.customerPickupAddress || data.startLocation || 'N/A';
        const customerDropAddress = data.customerDropAddress || data.endLocation || 'N/A';
        const vehicleNumber = data.vehicleNumber || 'N/A';
        const waitingCost = Number(data.waitingCost || 0);
        const discountCost = Number(data.discountCost || 0);
        const ridecost = Number(data.ridecost || 0);
        const totalCost = Number(data.totalCost || 0);
        const taxCategory = data.taxCategory || '-';
        const taxArray = Array.isArray(data.tax) ? data.tax : [];
        const taxRowsTrip = taxArray.map(t => `
            <tr>
                <td>${t.name || '-'}</td>
                <td>${(t.value ?? '-')}%</td>
                <td>${Number(t.amount || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        // Company from passed data (fallback to AppConfig)
        const appConfig = this.appConfig || {};
        const company = {
            name: data.companyName || this.companyName,
            address: data.companyAddress || appConfig.COMPANYADDRESS || '-',
            phone: data.companyPhone || appConfig.COMPANYPHONE || '-',
            state: data.companyState || appConfig.COMPANYSTATE || '-',
            gst: data.companyGstNumber || '-',
            pan: data.companyPanNumber || '-'
        };

        return `
            <div class="sheet-page" style="page-break-after: always;">
                <div class="sheet-header">
                    ${this.renderBrandingHTML()}
                    <h1 class="sheet-title">Trip Invoice</h1>
                    <div class="page-number">Page ${pageNumber}</div>
                </div>
                
                <div class="invoice-meta">
                    <table class="table">
                        <tr>
                            <th>Invoice No</th><td>${invoiceNo}</td>
                            <th>Invoice Date</th><td>${invoiceDate}</td>
                        </tr>
                        <tr>
                            <th>Ride ID</th><td>${rideId}</td>
                            <th>Vehicle No</th><td>${vehicleNumber}</td>
                        </tr>
                        <tr>
                            <th>Tax Category</th><td colspan="3">${taxCategory}</td>
                        </tr>
                    </table>
                </div>

                <div class="party-details">
                    <table class="table">
                        <tr><th>Name</th><td>${customerName}</td></tr>
                        <tr><th>Pickup</th><td>${customerPickupAddress}</td></tr>
                        <tr><th>Drop</th><td>${customerDropAddress}</td></tr>
                    </table>
                    <table class="table">
                        <tr><th>Company</th><td>${company.name}</td></tr>
                        <tr><th>Address</th><td>${company.address}</td></tr>
                        <tr><th>Phone</th><td>${company.phone}</td></tr>
                        <tr><th>State</th><td>${company.state}</td></tr>
                        <tr><th>GSTIN</th><td>${company.gst}</td></tr>
                        <tr><th>PAN</th><td>${company.pan}</td></tr>
                    </table>
                </div>
                
                <div class="charges">
                    <h2>Charges</h2>
                    <table class="table">
                        <tr><th>Description</th><th>Amount (₹)</th></tr>
                        <tr><td>Ride Cost</td><td>${ridecost.toFixed(2)}</td></tr>
                        <tr><td>Waiting Cost</td><td>${waitingCost.toFixed(2)}</td></tr>
                        <tr><td>Discount</td><td>-${discountCost.toFixed(2)}</td></tr>
                    </table>
                </div>

                <div class="tax-breakdown">
                    <h2>Tax Breakdown</h2>
                    <table class="table">
                        <tr><th>Tax</th><th>Rate</th><th>Amount (₹)</th></tr>
                        ${taxRowsTrip || '<tr><td colspan="3">No tax details</td></tr>'}
                    </table>
                </div>

                <div class="totals">
                    <table class="table">
                        <tr><th>Total</th><td>${totalCost.toFixed(2)}</td></tr>
                    </table>
                </div>
            </div>
        `;
    };

    /**
     * Generate Tax Invoice HTML
     */
    generateTaxInvoiceHTML = (data, pageNumber) => {
        // Map incoming fields
        const invoiceNo = data.invoiceNo || data.invoiceNumber || 'N/A';
        const invoiceDate = data.invoicedate || data.invoiceDate || new Date().toLocaleDateString();
        const rideId = data.rideId || data.tripId || 'N/A';
        const customerName = data.customerName || 'N/A';
        const customerPickupAddress = data.customerPickupAddress || 'N/A';
        const customerDropAddress = data.customerDropAddress || 'N/A';
        const vehicleNumber = data.vehicleNumber || 'N/A';
        const taxCategory = data.taxCategory || '-';
        const subtotal = Number(data.ridecost || data.subtotal || 0);
        const waitingCost = Number(data.waitingCost || 0);
        const discountCost = Number(data.discountCost || 0);
        const totalCost = Number(data.totalCost || data.totalWithTax || 0);
        const taxArray = Array.isArray(data.tax) ? data.tax : [];
        const fees = Array.isArray(data.feewithTaxes) ? data.feewithTaxes : [];
        const finalAmount = data.finalAmount != null ? Number(data.finalAmount) : (fees.length ? fees.reduce((s,f)=>s + Number((f.totalFee != null ? f.totalFee : (Number(f.amount ?? f.value ?? 0) + (Array.isArray(f.tax) ? f.tax.reduce((t,tt)=>t + Number(tt.amount||0),0) : 0)))),0) : totalCost);

        const appConfig = this.appConfig || {};
        const company = {
            name: data.companyName || this.companyName,
            address: data.companyAddress || appConfig.COMPANYADDRESS || '-',
            phone: data.companyPhone || appConfig.COMPANYPHONE || '-',
            state: data.companyState || appConfig.COMPANYSTATE || '-',
            gst: data.companyGstNumber || data.gstNumber || '-',
            pan: data.companyPanNumber || data.panNumber || '-'
        };

        const toFixed = (n) => Number(n||0).toFixed(2);

        const hasFees = fees.length > 0;

        // Build combined Fee + Tax rows when feewithTaxes is present
        const combinedFeeTaxRows = hasFees ? fees.map(f => {
            const baseAmount = Number(f.amount ?? f.value ?? 0);
            const taxes = Array.isArray(f.tax) ? f.tax : [];
            const taxTotal = taxes.reduce((sum, t) => sum + Number(t.amount || 0), 0);
            const totalFee = Number(f.totalFee != null ? f.totalFee : (baseAmount + taxTotal));

            if (!taxes.length) {
                return `
                    <tr>
                        <td>${f.name || '-'}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>${toFixed(0)}</td>
                        <td>${toFixed(baseAmount)}</td>
                        <td>${toFixed(totalFee)}</td>
                    </tr>
                `;
            }

            const first = taxes[0];
            const headRow = `
                <tr>
                    <td rowspan="${taxes.length}">${f.name || '-'}</td>
                    <td>${first.name || '-'}</td>
                    <td>${(first.value ?? '-')}%</td>
                    <td>${toFixed(first.amount)}</td>
                    <td rowspan="${taxes.length}">${toFixed(baseAmount)}</td>
                    <td rowspan="${taxes.length}">${toFixed(totalFee)}</td>
                </tr>
            `;
            const restRows = taxes.slice(1).map(t => `
                <tr>
                    <td>${t.name || '-'}</td>
                    <td>${(t.value ?? '-')}%</td>
                    <td>${toFixed(t.amount)}</td>
                </tr>
            `).join('');
            return headRow + restRows;
        }).join('') : '';

        // Fallback tax rows from data.tax when feewithTaxes not present
        const fallbackTaxRows = (!hasFees ? taxArray.map(t => `
            <tr>
                <td>-</td>
                <td>${t.name || '-'}</td>
                <td>${(t.value ?? '-')}%</td>
                <td>${toFixed(t.amount)}</td>
            </tr>
        `).join('') : '');

        // Charges section only when fees are not provided
        const chargesSection = !hasFees
            ? `
                <div class="charges">
                    <h2>Charges Summary</h2>
                    <table class="table">
                        <tr><th>Description</th><th>Amount (₹)</th></tr>
                        <tr><td>Ride Cost</td><td>${toFixed(subtotal)}</td></tr>
                        <tr><td>Waiting Cost</td><td>${toFixed(waitingCost)}</td></tr>
                        <tr><td>Discount</td><td>-${toFixed(discountCost)}</td></tr>
                    </table>
                </div>
            `
            : '';

        // Combined Fee + Tax section when fees present
        const combinedFeeTaxSection = hasFees ? `
            <div class="tax-breakdown">
                <h2>Fees and Taxes</h2>
                <table class="table">
                    <tr>
                        <th>Fee</th>
                        <th>Tax</th>
                        <th>Rate</th>
                        <th>Tax Amount (₹)</th>
                        <th>Base Amount (₹)</th>
                        <th>Total Fee (₹)</th>
                    </tr>
                    ${combinedFeeTaxRows || '<tr><td colspan="6">No fees</td></tr>'}
                </table>
            </div>
        ` : '';

        // Fallback tax breakdown when no fees
        const fallbackTaxSection = !hasFees ? `
            <div class="tax-breakdown">
                <h2>Tax Breakdown</h2>
                <table class="table">
                    <tr><th>Fee</th><th>Tax</th><th>Rate</th><th>Amount (₹)</th></tr>
                    ${fallbackTaxRows || '<tr><td colspan="4">No tax details</td></tr>'}
                </table>
            </div>
        ` : '';

        return `
            <div class="sheet-page" style="page-break-after: always;">
                <div class="sheet-header">
                    ${this.renderBrandingHTML()}
                    <h1 class="sheet-title">Tax Invoice</h1>
                    <div class="page-number">Page ${pageNumber}</div>
                </div>
                
                <div class="invoice-meta">
                    <table class="table">
                        <tr>
                            <th>Invoice No</th><td>${invoiceNo}</td>
                            <th>Invoice Date</th><td>${invoiceDate}</td>
                        </tr>
                        <tr>
                            <th>Ride ID</th><td>${rideId}</td>
                            <th>Vehicle No</th><td>${vehicleNumber}</td>
                        </tr>
                        <tr>
                            <th>Tax Category</th><td colspan="3">${taxCategory}</td>
                        </tr>
                    </table>
                </div>

                <div class="party-details">
                    
                    <table class="table">
                        <tr><th>Name</th><td>${customerName}</td></tr>
                        <tr><th>Pickup</th><td>${customerPickupAddress}</td></tr>
                        <tr><th>Drop</th><td>${customerDropAddress}</td></tr>
                    </table>
                    <table class="table">
                        <tr><th>Company</th><td>${company.name}</td></tr>
                        <tr><th>Address</th><td>${company.address}</td></tr>
                        <tr><th>Phone</th><td>${company.phone}</td></tr>
                        <tr><th>State</th><td>${company.state}</td></tr>
                        <tr><th>GSTIN</th><td>${company.gst}</td></tr>
                        <tr><th>PAN</th><td>${company.pan}</td></tr>
                    </table>
                </div>
                
                ${combinedFeeTaxSection || chargesSection}

                ${fallbackTaxSection}

                <div class="totals">
                    <table class="table">
                        <tr><th>Total with Tax</th><td>${toFixed(finalAmount)}</td></tr>
                    </table>
                </div>
            </div>
        `;
    };

    /**
     * Generate Generic Sheet HTML for unknown types
     */
    generateGenericSheetHTML = (sheetType, data, pageNumber) => {
        return `
            <div class="sheet-page" style="page-break-after: always;">
                <div class="sheet-header">
                    ${this.renderBrandingHTML()}
                    <h1 class="sheet-title">${sheetType.charAt(0).toUpperCase() + sheetType.slice(1)}</h1>
                    <div class="page-number">Page ${pageNumber}</div>
                </div>
                
                <div class="generic-content">
                    <h2>Sheet Data</h2>
                    <pre>${JSON.stringify(data, null, 2)}</pre>
                </div>
            </div>
        `;
    };

    generatePlatformInvoiceHTML = (receiptData) => {
        const currency = receiptData.currency || "₹";
        const feeBlocks = [];
        let grandTotal = 0;

        if (receiptData.feesWithTax && receiptData.feesWithTax.breakdown) {
            Object.entries(receiptData.feesWithTax.breakdown).forEach(([feeKey, feeObj]) => {
                const feeLabel = feeObj.label || (feeKey === "convenienceFee" ? "Convenience Fee (Ride)" : feeKey.replace(/([A-Z])/g, " $1").trim());
                grandTotal += Number(feeObj.total || 0);

                // Fee row
                feeBlocks.push(`
                    <tr>
                        <td>${feeLabel}</td>
                        <td class="type-money">${currency} ${Number(feeObj.feeAmount || 0).toFixed(2)}</td>
                    </tr>
                `);

                // Tax rows under the fee
                if (feeObj.taxAmount) {
                    Object.entries(feeObj.taxAmount).forEach(([taxKey, t]) => {
                        const taxName = (t.label || taxKey).toUpperCase();
                        const rate =
                            t.type === "percentage" && t.value != null ? `${t.value}%` :
                                t.type === "flat" && t.value != null ? `${currency} ${t.value}` : "";
                        feeBlocks.push(`
                            <tr>
                                <td>${taxName} ${rate ? `<span class="type-muted">(${rate})</span>` : ""}</td>
                                <td class="type-money">${currency} ${Number(t.tax || 0).toFixed(2)}</td>
                            </tr>
                        `);
                    });
                }
            });
        }

        const feesTotal = receiptData.feesWithTax?.total != null
            ? Number(receiptData.feesWithTax.total)
            : grandTotal;

        return `
            <div class="type-page">
    <div class="type-invoice">
      <div class="type-bar">
        <div class="type-brand">
          ${receiptData.companyLogoUrl ? `<img src="${receiptData.companyLogoUrl}" alt="${receiptData.companyName || "Logo"}">` : ""}
          <span>${receiptData.invoiceTitle || "Original Tax Invoice"}</span>
        </div>
        <span class="type-badge">${receiptData.invoiceType || "Original Tax Invoice"}</span>
      </div>

      <div class="type-wrap">
        <div class="type-meta">
          <!-- Company / Supplier -->
          <div class="type-card">
            <h3>${receiptData.companyName || "Supplier"}</h3>
            <div class="type-kv">
              <div style="grid-column:1 / span 2">${(receiptData.companyAddressLines || []).join("<br>")}</div>
              <small>GSTIN</small><div>${receiptData.companyGSTIN || "-"}</div>
              <small>State</small><div>${receiptData.companyStateName || ""}${receiptData.companyStateCode ? `, Code: ${receiptData.companyStateCode}` : ""}</div>
              <small>E-Mail</small><div>${receiptData.companyEmail || ""}</div>
            </div>
          </div>

          <!-- Invoice & Customer Meta -->
          <div class="type-card">
            <div class="type-kv">
              <small>Invoice Date</small><div>${receiptData.invoiceDate}</div>
              <small>Invoice Number</small><div>${receiptData.invoiceNumber}</div>
              <small>Service Tax Category</small><div>${receiptData.serviceTaxCategory || ""}</div>
              <small>HSN/SAC Code</small><div>${receiptData.hsnSacCode || ""}</div>
              <small>Customer Name</small><div>${receiptData.customerName || ""}</div>
              <small>Customer GST Number</small><div>${receiptData.customerGSTNumber || "-"}</div>
              <small>Mobile Number</small><div>${receiptData.mobileNumber || ""}</div>
              <small>Supply address</small><div>${receiptData.supplyAddress || ""}</div>
            </div>
          </div>
        </div>

        <h3 class="type-section">Charges</h3>
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="type-money">Amount (INR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><b>Customer Booking ID - ${receiptData.bookingId || ""}</b></td>
              <td class="type-money"></td>
            </tr>
            ${feeBlocks.join("")}
            <tr>
              <td><b>Total Convenience Fare</b></td>
              <td class="type-money"><b>${currency} ${Number(feesTotal || 0).toFixed(2)}</b></td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top:16px" class="type-slim">
          <div class="type-row type-total">
            <div>Total</div>
            <div class="type-money">${currency} ${Number(feesTotal || 0).toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div class="type-footer">
        <div class="type-sign">
          <div class="type-stamp">${receiptData.authoritySignUrl ? `<img src="${receiptData.authoritySignUrl}" alt="signature">` : ""}</div>
          <div>
            <div style="font-weight:700">${receiptData.authorityName || "Authorised Signatory"}</div>
          </div>
        </div>
        <div class="type-muted" style="font-size:12px">${receiptData.footerNote || ""}</div>
      </div>
    </div>
  </div>
    
          `
    }

    /**
     * Combine multiple sheets into one HTML document
     */
    combineSheetsHTML = (sheetHTMLs, fileName) => {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${fileName}</title>
                <style>
                    :root{
                    --bg:#0b1020;
                    --card:#ffffff;
                    --ink:#0b1220;
                    --muted:#667085;
                    --brand:#4f46e5;
                    --brand-2:#22c55e;
                    --line:#e6e8ec;
                    --chip:#eef2ff;
                    --ring:rgba(79,70,229,.18);
                    --shadow:0 10px 30px rgba(2,6,23,.15);
                     --ink:#0b1220; --muted:#6b7280; --brand:#c62828; --line:#e5e7eb; --soft:#f8fafc;
                }
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                        background-color: #ffffff;
                        color: #000000;
                        line-height: 1.6;
                    }
                    
                    .sheet-page {
                        padding: 20px;
                        margin: 0;
                        min-height: 100vh;
                        box-sizing: border-box;
                    }
                    
                    .sheet-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 2px solid #0080ff;
                        padding-bottom: 20px;
                        margin-bottom: 30px;
                    }
                    
                    .sheet-header h1, .sheet-title {
                        margin: 0;
                        color: #0080ff;
                        font-size: 28px;
                    }

                    .brand {
                        display: flex;
                        align-items: center;
                        gap: 12px;
                    }

                    .brand-logo {
                        height: 28px;
                        width: auto;
                    }

                    .company-name {
                        font-size: 18px;
                        font-weight: 600;
                        color: #333;
                    }
                    
                    .page-number {
                        background-color: #f0f0f0;
                        padding: 8px 15px;
                        border-radius: 20px;
                        font-size: 14px;
                        color: #666;
                    }
                    
                    .info-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        margin: 20px 0;
                    }
                    
                    .info-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px;
                        background-color: #f8f9fa;
                        border-radius: 8px;
                    }
                    
                    .label {
                        font-weight: bold;
                        color: #333;
                    }
                    
                    .value {
                        color: #666;
                    }
                    
                    .fare-breakdown, .payment-details, .tax-breakdown {
                        margin: 20px 0;
                    }
                    
                    .fare-item, .payment-item, .tax-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 8px 0;
                        border-bottom: 1px solid #eee;
                    }

                    .table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0 15px 0;
                    }
                    .table th, .table td {
                        border: 1px solid #e0e0e0;
                        padding: 8px 10px;
                        text-align: left;
                        font-size: 12px;
                    }
                    .table th {
                        background-color: #f8f9fa;
                        color: #333;
                    }
                    
                    .total {
                        font-weight: bold;
                        font-size: 18px;
                        color: #1C9A18;
                        border-top: 2px solid #1C9A18;
                        padding-top: 15px;
                        margin-top: 15px;
                    }
                    
                    .status-completed { color: #1C9A18; font-weight: bold; }
                    .status-pending { color: #f39c12; font-weight: bold; }
                    .status-failed { color: #e74c3c; font-weight: bold; }
                    
                    .generic-content pre {
                        background-color: #f8f9fa;
                        padding: 15px;
                        border-radius: 8px;
                        overflow-x: auto;
                        font-size: 12px;
                    }
                    
                    h2 {
                        color: #333;
                        border-bottom: 1px solid #ddd;
                        padding-bottom: 10px;
                        margin: 25px 0 15px 0;
                    }


                    .tripbill-sheet{max-width:900px; margin:0 auto; border:1px solid #d1d5db}
                    .tripbill-wrap{padding:18px 22px}
                    .tripbill-row{display:flex; gap:16px}
                    .tripbill-between{justify-content:space-between; align-items:flex-start}
                    .tripbill-muted{color:var(--muted)}
                    .tripbill-money{font-variant-numeric:tabular-nums; white-space:nowrap}
                    .tripbill-h1{font-weight:700; font-size:20px}
                    .tripbill-h2{font-weight:700; font-size:16px}
                    .tripbill-chip{display:inline-block; padding:6px 10px; border-radius:999px; background:#fff3f3; color:#7a0f0f; border:1px solid #ffd9d9; font-weight:700}
                    .tripbill-divider{height:1px; background:var(--line); margin:14px 0}
                    .tripbill-table{width:100%; border:1px solid var(--line)}
                    .tripbill-table th{background:#ef4444; color:#fff; text-align:center; padding:12px; font-size:16px; letter-spacing:.4px}
                    .tripbill-kv{display:grid; grid-template-columns:1fr auto; gap:8px; padding:12px 14px; border-bottom:1px solid var(--line)}
                    .tripbill-kv .l{color:#111827}
                    .tripbill-kv .r{font-weight:700; text-align:right}
                    .tripbill-grid{display:grid; grid-template-columns: 1.2fr .8fr; gap:16px}
                    .tripbill-card{border:1px solid var(--line)}
                    .tripbill-pad{padding:14px}
                    .tripbill-driver{display:grid; grid-template-columns:70px 1fr; gap:12px; align-items:center}
                    .tripbill-driver img{width:70px; height:70px; object-fit:cover; border-radius:6px; border:1px solid var(--line)}
                    .tripbill-stat{display:grid; grid-template-columns:28px 1fr; gap:10px; align-items:center; padding:10px 0; border-top:1px solid var(--line)}
                    .tripbill-stat:first-of-type{border-top:none}
                    .tripbill-ic{width:28px; height:28px; display:grid; place-items:center; border-radius:50%; background:#f3f4f6; font-size:16px}
                    .tripbill-map img{width:100%; height:auto; display:block}
                    /* timeline */
                    .tripbill-timeline{padding:10px 14px}
                    .tripbill-leg{display:grid; grid-template-columns: 80px 16px 1fr; gap:12px; align-items:flex-start; padding:12px 0; border-top:1px solid var(--line)}
                    .tripbill-leg:first-child{border-top:none}
                    .tripbill-dot{width:12px; height:12px; border-radius:50%; margin-top:4px}
                    .tripbill-dot.pick{background:#10b981}
                    .tripbill-dot.drop{background:#ef4444}
                    .tripbill-addr{white-space:pre-wrap}
                    /* header */
                    .tripbill-header{padding:14px 22px; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line)}
                    .tripbill-brand{display:flex; align-items:center; gap:12px}
                    .tripbill-brand img{height:36px}
                    .tripbill-right{text-align:right}
                    .tripbill-right .amt{font-weight:800; font-size:20px}
                    .tripbill-greet{padding:10px 22px; font-size:13px; display:flex; justify-content:space-between}
                    .tripbill-footer{padding:12px 22px; border-top:1px solid var(--line); font-size:12px; color:var(--muted); display:flex; justify-content:space-between}
                    @media print{ body{padding:0} .tripbill-sheet{border:none} .tripbill-table th{background:#c62828} }


                    
                     .vendortax-page{max-width:920px;margin:0 auto}
                    .vendortax-invoice{background:var(--card);border-radius:20px;box-shadow:var(--shadow);overflow:hidden;border:1px solid rgba(255,255,255,.08)}
                    .vendortax-bar{background:linear-gradient(90deg,var(--brand) 0%,#7c3aed 60%,#06b6d4 100%);padding:22px 28px;color:#fff;display:flex;align-items:center;gap:16px}
                    .vendortax-brand{font-weight:700;letter-spacing:.3px}
                    .vendortax-badge{margin-left:auto;background:rgba(255,255,255,.18);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.35)}
                    .vendortax-wrap{padding:28px}
                    .vendortax-meta{display:grid;grid-template-columns:1.2fr .9fr;gap:22px}
                    .vendortax-card{border:1px solid var(--line);border-radius:14px;padding:16px 18px}
                    .vendortax-card h3{margin:0 0 8px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    .vendortax-kv{display:grid;grid-template-columns:160px 1fr;gap:8px 14px;font-size:13px}
                    .vendortax-kv div{color:#111827}
                    .vendortax-kv small{color:var(--muted)}
                    .vendortax-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
                    .vendortax-chip{background:var(--chip);border:1px solid #dbe4ff;color:#273161;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600}
                    .vendortax-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
                    .vendortax-kpi{border:1px dashed var(--line);border-radius:12px;padding:12px 14px;text-align:center}
                    .vendortax-kpi .v{font-size:18px;font-weight:800;color:#111827}
                    .vendortax-kpi .l{font-size:12px;color:var(--muted)}
                    .vendortax-section-title{margin:18px 0 10px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    .vendortax-grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
                    table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
                    thead th{background:#f8fafc;text-align:left;padding:12px 14px;font-size:12px;color:#334155;letter-spacing:.4px}
                    tbody td{padding:12px 14px;border-top:1px solid var(--line)}
                    tbody tr:hover td{background:#fafafa}
                    .vendortax-money{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
                    .vendortax-muted{color:var(--muted)}
                    .vendortax-totals{display:grid;grid-template-columns:1fr 320px;gap:18px;margin-top:16px;align-items:start}
                    .vendortax-notes{font-size:12px;color:var(--muted)}
                    .vendortax-sum{border:1px solid var(--line);border-radius:14px;padding:12px 14px}
                    .vendortax-row{display:flex;justify-content:space-between;padding:8px 0;border-top:1px dashed var(--line)}
                    .vendortax-row:first-child{border-top:none}
                    .vendortax-total{font-weight:800;font-size:16px;color:#111827}
                    .vendortax-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 28px;border-top:1px solid var(--line);background:#fcfcfd}
                    .vendortax-sign{display:flex;align-items:center;gap:12px;color:#111827}
                    .vendortax-stamp img{height:40px}
                    @media print{body{background:#fff;padding:0}.vendortax-page{max-width:100%}.vendortax-invoice{border-radius:0;box-shadow:none}.vendortax-footer{background:#fff}}
                                
                    .type-page{max-width:920px;margin:0 auto}
                    .type-invoice{background:var(--card);border-radius:20px;box-shadow:var(--shadow);overflow:hidden;border:1px solid rgba(255,255,255,.08)}
                    .type-bar{background:linear-gradient(90deg,var(--brand) 0%,#7c3aed 60%,#06b6d4 100%);padding:22px 28px;color:#fff;display:flex;align-items:center;gap:16px}
                    .type-brand{display:flex;align-items:center;gap:14px;font-weight:700}
                    .type-brand img{height:34px}
                    .type-badge{margin-left:auto;background:rgba(255,255,255,.18);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;border:1px solid rgba(255,255,255,.35)}
                    .type-wrap{padding:28px}
                    .type-meta{display:grid;grid-template-columns:1.2fr .9fr;gap:22px}
                    .type-card{border:1px solid var(--line);border-radius:14px;padding:16px 18px}
                    .type-card h3{margin:0 0 8px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    .type-kv{display:grid;grid-template-columns:160px 1fr;gap:8px 14px;font-size:13px}
                    .type-kv div{color:#111827}
                    .type-kv small{color:var(--muted)}
                    .type-section{margin:18px 0 10px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
                        thead th{background:#f8fafc;text-align:left;padding:12px 14px;font-size:12px;color:#334155;letter-spacing:.4px}
                        tbody td{padding:12px 14px;border-top:1px solid var(--line)}
                        tbody tr:hover td{background:#fafafa}
                        .type-money{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
                        .type-muted{color:var(--muted)}
                        .type-slim{border:1px solid var(--line);border-radius:14px;padding:12px 14px}
                        .type-row{display:flex;justify-content:space-between;padding:8px 0;border-top:1px dashed var(--line)}
                        .type-row:first-child{border-top:none}
                        .type-total{font-weight:800;font-size:16px;color:#111827}
                        .type-footer{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 28px;border-top:1px solid var(--line);background:#fcfcfd}
                        .type-sign{display:flex;align-items:center;gap:12px;color:#111827}
                        .type-stamp img{height:40px}
                        @media print{body{background:#fff;padding:0}.type-page{max-width:100%}.type-invoice{border-radius:0;box-shadow:none}.type-footer{background:#fff}}

                    .page{max-width:920px;margin:0 auto}
                    .invoice{background:var(--card);border-radius:20px;box-shadow:var(--shadow);overflow:hidden;border:1px solid rgba(255,255,255,.08)}
                    .bar{background:linear-gradient(90deg, var(--brand) 0%, #7c3aed 60%, #06b6d4 100%);padding:22px 28px;color:#fff;display:flex;align-items:center;gap:16px}
                    .brand{display:flex;align-items:center;gap:12px;font-weight:700;letter-spacing:.3px}
                    .bar .badge{margin-left:auto;background:rgba(255,255,255,.18);padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600;backdrop-filter:saturate(140%) blur(6px);border:1px solid rgba(255,255,255,.35)}
                    .wrap{padding:28px}
                    .meta{display:grid;grid-template-columns:1.2fr .9fr;gap:22px}
                    .card{border:1px solid var(--line);border-radius:14px;padding:16px 18px}
                    .meta h3{margin:0 0 8px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    .kv{display:grid;grid-template-columns:160px 1fr;gap:8px 14px;font-size:13px}
                    .kv div{color:#111827}
                    .kv small{color:var(--muted)}
                    .chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
                    .chip{background:var(--chip);border:1px solid #dbe4ff;color:#273161;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:600}
                    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:18px}
                    .kpi{border:1px dashed var(--line);border-radius:12px;padding:12px 14px;text-align:center}
                    .kpi .v{font-size:18px;font-weight:800;color:#111827}
                    .kpi .l{font-size:12px;color:var(--muted)}
                    .section-title{margin:18px 0 10px;font-size:13px;color:#111827;text-transform:uppercase;letter-spacing:.6px}
                    table{width:100%;border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:14px;overflow:hidden}
                    thead th{background:#f8fafc;text-align:left;padding:12px 14px;font-size:12px;color:#334155;letter-spacing:.4px}
                    tbody td{padding:12px 14px;border-top:1px solid var(--line)}
                    tbody tr:hover td{background:#fafafa}
                    .money{font-variant-numeric:tabular-nums;text-align:right;white-space:nowrap}
                    .muted{color:var(--muted)}
                    .totals{display:grid;grid-template-columns:1fr 280px;gap:18px;margin-top:16px;align-items:start}
                    .notes{font-size:12px;color:var(--muted)}
                    .sum{border:1px solid var(--line);border-radius:14px;padding:12px 14px}
                    .sum .row{display:flex;justify-content:space-between;padding:8px 0;border-top:1px dashed var(--line)}
                    .sum .row:first-child{border-top:none}
                    .sum .row.total{font-weight:800;font-size:16px;color:#111827}
                    .paid{color:var(--brand-2);font-weight:700;font-size:12px;letter-spacing:.4px;background:rgba(34,197,94,.08);border:1px solid rgba(34,197,94,.2);padding:3px 8px;border-radius:999px}
                    .footer{display:flex;justify-content:space-between;align-items:center;gap:16px;padding:20px 28px;border-top:1px solid var(--line);background:#fcfcfd}
                    .sign{display:flex;align-items:center;gap:12px;color:#111827}
                    .stamp img{height:40px}
                    
                    @media print {
                        .sheet-page {
                            page-break-after: always;
                        }
                        .sheet-page:last-child {
                            page-break-after: avoid;
                        }
                    }
                </style>
            </head>
            <body>
                ${sheetHTMLs.join('')}
            </body>
            </html>
        `;
    };
}

export default new PDFCreator();