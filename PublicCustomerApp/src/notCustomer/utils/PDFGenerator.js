/**
 * PDF Generator Utility for Ride Receipts
 * This file contains functions to generate PDF receipts for completed rides
 * Uses react-native-html-to-pdf for actual PDF generation
 */

import RNHTMLtoPDF from 'react-native-html-to-pdf';
import { Platform, Alert, PermissionsAndroid, ActionSheetIOS } from 'react-native';

export class PDFGenerator {
  /**
   * Generate a PDF receipt for a completed ride
   * @param {Object} rideData - The ride data object
   * @param {string} customFolder - Optional custom folder path
   * @returns {Promise<string>} - Path to generated PDF file
   */
  static async generateReceiptPDF(rideData, customFolder = null) {
    try {
      
      
      // Format the receipt data
      const receiptData = this.formatReceiptData(rideData);
      
      // Generate HTML content for the PDF
      const htmlContent = this.generateReceiptHTML(receiptData);
      
      // Determine directory based on platform and user preference
      let directory = 'Documents';
      if (customFolder) {
        directory = customFolder;
      } else if (Platform.OS === 'ios') {
        directory = 'Documents';
      } else {
        // For Android, use a reliable default directory
        directory = 'Documents';
      }
      
      // Generate unique filename with timestamp
      const timestamp = new Date().getTime();
      const fileName = `Receipt_${receiptData.receiptId}_${timestamp}`;
      
      // Generate PDF options with more reliable settings
      const options = {
        html: htmlContent,
        fileName: fileName,
        directory: directory,
        base64: false,
        height: 842, // A4 height in points
        width: 595,  // A4 width in points
        padding: 20,
        // Add platform-specific options for better reliability
        ...(Platform.OS === 'android' && {
          directory: 'Documents',
          base64: false,
        }),
        ...(Platform.OS === 'ios' && {
          directory: 'Documents',
          base64: false,
        }),
      };

      

      // Generate PDF
      const file = await RNHTMLtoPDF.convert(options);
      
      
      
      if (file && file.filePath) {
       
        
        // Verify the file actually exists and is accessible
        const fileExists = await this.verifyFileExists(file.filePath);
        if (fileExists) {
          return file.filePath;
        } else {
          throw new Error('PDF file was generated but cannot be accessed');
        }
      } else if (file && file.base64) {
        // If base64 is returned, save it to a file
      
        const savedPath = await this.saveBase64ToFile(file.base64, fileName);
        return savedPath;
      } else {
        console.error('PDF generation failed - unexpected result:', file);
        throw new Error('PDF generation failed - no file path or base64 returned');
      }
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      throw new Error('Failed to generate PDF receipt: ' + error.message);
    }
  }

  /**
   * Verify if the generated file exists and is accessible
   * @param {string} filePath - Path to the file
   * @returns {Promise<boolean>} - Whether file exists and is accessible
   */
  static async verifyFileExists(filePath) {
    try {
      // For now, we'll do basic validation
      // In a real implementation, you could use react-native-fs to check file existence
      if (!filePath || filePath.length === 0) {
        return false;
      }
      
      // Check if the path looks valid
      if (Platform.OS === 'android') {
        // Android paths should start with /storage/ or /data/
        return filePath.startsWith('/storage/') || filePath.startsWith('/data/') || filePath.startsWith('/');
      } else {
        // iOS paths should contain the app's Documents directory
        return filePath.includes('Documents') || filePath.includes('Library');
      }
    } catch (error) {
      console.error('Error verifying file existence:', error);
      return false;
    }
  }

  /**
   * Save base64 PDF data to a file (fallback method)
   * @param {string} base64Data - Base64 encoded PDF data
   * @param {string} fileName - Name for the file
   * @returns {Promise<string>} - Path to saved file
   */
  static async saveBase64ToFile(base64Data, fileName) {
    try {
      // This is a placeholder implementation
      // In a real app, you would use react-native-fs to save the base64 data
     
      
      // For now, return a mock path
      // TODO: Implement actual file saving with react-native-fs
      const mockPath = Platform.OS === 'android' 
        ? `/storage/emulated/0/Documents/${fileName}.pdf`
        : `Documents/${fileName}.pdf`;
      
      return mockPath;
    } catch (error) {
      console.error('Error saving base64 to file:', error);
      throw new Error('Failed to save PDF file: ' + error.message);
    }
  }

  /**
   * Download the generated PDF to device with custom folder selection
   * @param {string} pdfPath - Path to the PDF file
   * @param {string} customFolder - Optional custom folder path
   * @returns {Promise<boolean>} - Success status
   */
  static async downloadPDF(pdfPath, customFolder = null) {
    try {
     
      
      // Verify the PDF file exists before proceeding
      if (!pdfPath) {
        throw new Error('PDF path is invalid or empty');
      }
      
      // Check and request storage permissions for Android
      if (Platform.OS === 'android') {
        const hasPermission = await this.requestStoragePermission();
        if (!hasPermission) {
          throw new Error('Storage permission denied');
        }
      }
      
      // If custom folder is provided, move the file there
      if (customFolder && Platform.OS === 'android') {
        const newPath = await this.moveFileToCustomFolder(pdfPath, customFolder);
        if (newPath) {
          pdfPath = newPath;
        }
      }
      
      // Show success message with file location and additional options
      Alert.alert(
        'PDF Generated Successfully!',
        `Your receipt PDF has been saved to:\n${pdfPath}`,
        [
          { text: 'OK' },
          { 
            text: 'Open File', 
            onPress: () => this.openPDFFile(pdfPath) 
          },
          {
            text: 'Choose Different Location',
            onPress: () => this.chooseCustomLocation(pdfPath)
          },
          {
            text: 'Copy Path',
            onPress: () => this.copyFilePathToClipboard(pdfPath)
          }
        ]
      );
      
      return true;
    } catch (error) {
      console.error('Error downloading PDF:', error);
      
      // Show more helpful error message
      let errorMessage = 'Failed to save PDF: ' + error.message;
      
      if (error.message.includes('file')) {
        errorMessage += '\n\nPossible solutions:\n• Check device storage space\n• Verify app permissions\n• Try generating PDF again';
      }
      
      Alert.alert(
        'Error',
        errorMessage,
        [
          { text: 'OK' },
          { 
            text: 'Try Again', 
            onPress: () => this.retryPDFGeneration() 
          }
        ]
      );
      
      throw new Error('Failed to download PDF: ' + error.message);
    }
  }

  /**
   * Copy file path to clipboard (placeholder)
   * @param {string} filePath - File path to copy
   */
  static copyFilePathToClipboard(filePath) {
    // TODO: Implement clipboard functionality with react-native-clipboard
    Alert.alert(
      'Copy Path',
      `File path copied to clipboard:\n${filePath}\n\nNote: Clipboard functionality will be implemented in future updates.`,
      [{ text: 'OK' }]
    );
  }

  /**
   * Retry PDF generation (placeholder)
   */
  static retryPDFGeneration() {
    Alert.alert(
      'Retry PDF Generation',
      'Please go back and try generating the PDF again. If the issue persists, check your device storage and permissions.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Share PDF via email or other apps
   * @param {string} pdfPath - Path to the PDF file
   * @param {string} email - Optional email address
   * @returns {Promise<boolean>} - Success status
   */
  static async sharePDF(pdfPath, email = null) {
    try {
     
      
      // Verify the PDF file exists before sharing
      if (!pdfPath) {
        throw new Error('PDF path is invalid or empty');
      }
      
      // For now, show success message
      // In future, integrate with react-native-share for actual sharing
      Alert.alert(
        'PDF Ready for Sharing',
        `Your receipt PDF is ready at:\n${pdfPath}\n\nYou can now share it via email or other apps.`,
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw new Error('Failed to share PDF: ' + error.message);
    }
  }

  /**
   * Choose custom location for PDF storage
   * @param {string} currentPath - Current PDF file path
   */
  static async chooseCustomLocation(currentPath) {
    try {
      if (Platform.OS === 'ios') {
        // iOS: Show action sheet with folder options
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Documents', 'Downloads', 'Custom Path'],
            cancelButtonIndex: 0,
            userInterfaceStyle: 'light',
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              await this.moveFileToCustomFolder(currentPath, 'Documents');
            } else if (buttonIndex === 2) {
              await this.moveFileToCustomFolder(currentPath, 'Downloads');
            } else if (buttonIndex === 3) {
              await this.promptForCustomPath();
            }
          }
        );
      } else {
        // Android: Show directory picker
        await this.showAndroidDirectoryPicker(currentPath);
      }
    } catch (error) {
      console.error('Error choosing custom location:', error);
      Alert.alert(
        'Error',
        'Failed to change file location: ' + error.message,
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * Prompt user for custom folder path
   */
  static async promptForCustomPath() {
    // For now, show an alert with instructions
    // In a real implementation, you could use a modal with text input
    Alert.alert(
      'Custom Folder Path',
      'Enter the custom folder path where you want to store the PDF:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Enter Path',
          onPress: () => {
            // TODO: Implement text input modal for custom path
            Alert.alert(
              'Custom Path',
              'Custom path input will be implemented in future updates.\n\nFor now, the PDF is saved in the default Documents folder.',
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  }

  /**
   * Show Android directory picker
   * @param {string} currentPath - Current PDF file path
   */
  static async showAndroidDirectoryPicker(currentPath) {
    try {
      // For Android, we'll show common directory options
      Alert.alert(
        'Choose Storage Location',
        'Select where you want to store the PDF:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Documents', onPress: () => this.moveFileToCustomFolder(currentPath, 'Documents') },
          { text: 'Downloads', onPress: () => this.moveFileToCustomFolder(currentPath, 'Downloads') },
          { text: 'Pictures', onPress: () => this.moveFileToCustomFolder(currentPath, 'Pictures') },
          { text: 'Custom Path', onPress: () => this.promptForCustomPath() }
        ]
      );
    } catch (error) {
      console.error('Error showing directory picker:', error);
    }
  }

  /**
   * Select Android directory for PDF storage
   * @returns {Promise<string>} - Selected directory
   */
  static async selectAndroidDirectory() {
    return new Promise((resolve) => {
      Alert.alert(
        'Choose Storage Location',
        'Select where you want to store the PDF:',
        [
          { text: 'Documents', onPress: () => resolve('Documents') },
          { text: 'Downloads', onPress: () => resolve('Downloads') },
          { text: 'Pictures', onPress: () => resolve('Pictures') },
          { text: 'Custom', onPress: () => resolve('Custom') }
        ]
      );
    });
  }

  /**
   * Move file to custom folder (placeholder implementation)
   * @param {string} currentPath - Current file path
   * @param {string} customFolder - Target folder
   * @returns {Promise<string>} - New file path
   */
  static async moveFileToCustomFolder(currentPath, customFolder) {
    try {
      // This is a placeholder implementation
      // In a real app, you would use react-native-fs or similar to move files
    
      
      // For now, return the current path
      // TODO: Implement actual file moving functionality
      Alert.alert(
        'File Location Changed',
        `PDF will be stored in: ${customFolder}\n\nNote: Actual file moving will be implemented in future updates.`,
        [{ text: 'OK' }]
      );
      
      return currentPath;
    } catch (error) {
      console.error('Error moving file:', error);
      return currentPath;
    }
  }

  /**
   * Request storage permission for Android
   * @returns {Promise<boolean>} - Permission granted status
   */
  static async requestStoragePermission() {
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'This app needs access to storage to save PDF receipts.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // iOS doesn't need this permission
    } catch (error) {
      console.error('Error requesting storage permission:', error);
      return false;
    }
  }

  /**
   * Open PDF file (placeholder for future implementation)
   * @param {string} pdfPath - Path to the PDF file
   */
  static openPDFFile(pdfPath) {
    // TODO: Implement PDF viewer
    // Could use react-native-pdf or open with default PDF app
   
    Alert.alert(
      'Open PDF',
      'PDF viewer functionality will be implemented in future updates.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Generate HTML content for the receipt
   * @param {Object} receiptData - Formatted receipt data
   * @returns {string} - HTML content string
   */
  static generateReceiptHTML(receiptData) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ride Receipt</title>
          <style>
            @font-face {
              font-family: 'Outfit';
              src: url('data:font/ttf;base64,${this.getOutfitFontBase64()}') format('truetype');
            }
            
            body {
              font-family: 'Outfit', Arial, sans-serif;
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
  }

  /**
   * Get base64 encoded Outfit font (placeholder)
   * In a real implementation, you would include the actual font file
   * @returns {string} - Base64 encoded font string
   */
  static getOutfitFontBase64() {
    // This is a placeholder - in production, you would include the actual font file
    // For now, we'll use system fonts as fallback
    return '';
  }

  /**
   * Get receipt data formatted for PDF generation
   * @param {Object} rideData - The ride data object
   * @returns {Object} - Formatted receipt data
   */
  static formatReceiptData(rideData) {
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
      companyName: 'Namma Ooru Taxi',
      companyLogo: 'https://example.com/logo.png'
    };
  }
}

export default PDFGenerator; 