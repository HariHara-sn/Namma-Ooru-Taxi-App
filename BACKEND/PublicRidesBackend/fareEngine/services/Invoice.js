const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Passenger = require('../models/Passenger');
const Vendor = require('../models/Vendor');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
class Invoice {
  constructor() {
    this.invoice = {};
  }

  generateInvoiceId({ ref = '', vendor = '', date = new Date() } = {}) {
    // Helper to get random uppercase alphanumeric string of given length
    function randomString(length) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    // Format date as MMDDYY, e.g., 061124
    function formatDate(d) {
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${month}${day}${year}`;
    }

    // Compose prefix: ref or vendor or empty
    let prefix = '';
    if (ref) {
      prefix = ref.toUpperCase().slice(0, 3);
    } else if (vendor) {
      prefix = vendor.toUpperCase().slice(0, 3);
    }

    // Compose date part
    const datePart = formatDate(date);

    // Remaining length for random string
    // 14 total - prefix.length - datePart.length
    let remaining = 14 - prefix.length - datePart.length;
    if (remaining < 3) remaining = 3; // Always at least 3 random chars

    const randPart = randomString(remaining);

    // Final invoice id
    let invoiceId = `${prefix}${datePart}${randPart}`;
    // If over 14, trim from the end
    if (invoiceId.length > 14) {
      invoiceId = invoiceId.slice(0, 14);
    }
    return invoiceId;
  }
  async generateInvoice(fareDetails,trip,driverId,passengerId,driverRole) {
    const invoiceId = this.generateInvoiceId();
    const invoice = {
     driverId: new ObjectId(driverId),
      passengerId: new ObjectId(passengerId),
      tripId: trip._id,
      invoiceId,
      fareDetails,
      driverEarnings: fareDetails.breakdown.driverEarnings,
      driverDue: fareDetails.breakdown.driverDue,
      passengerPaymentStatus: 'pending',
      regionCode: fareDetails.regionCode,
      regionalOffice: new ObjectId(trip.regionalOffice),
      createdAt: new Date().getTime()
      
    };
    // if(driverRole == 'doc'){
    //   invoice["driverEarnings"] = fareDetails.breakdown.driverEarnings;
    //   invoice["driverDue"] = fareDetails.breakdown.driverDue
    // }else{
    //   invoice["vendorEarnings"] = fareDetails.breakdown.driverEarnings;
    //   invoice["vendorDue"] = fareDetails.breakdown.driverDue
    // }
    delete fareDetails.success;
    if(trip.vendorId){
        invoice.vendorId = new ObjectId(trip.vendorId);
        invoice["supplier"]={
            type:"vendor",
            id:new ObjectId(trip.vendorId),
        }
    }else{
        invoice["supplier"]={
            type:"NOT",
            id:"",
        }
    }

    // Check if a payment already exists for this trip and update instead of creating
        const PublicRidesPayments = mongoose.connection.collection('publicRidesPayments');
    
        const existing = await PublicRidesPayments.findOne({ tripId: trip._id });
        if (existing) {
          const updateDoc = {
            $set: {
              driverId: new ObjectId(driverId),
              passengerId: new ObjectId(passengerId),
              tripId: trip._id,
              fareDetails,
              driverEarnings: fareDetails.breakdown.driverEarnings,
              driverDue: fareDetails.breakdown.driverDue,
              passengerPaymentStatus: 'pending',
              regionCode: fareDetails.regionCode,
              regionalOffice: new ObjectId(trip.regionalOffice),
              supplier: invoice.supplier,
              updatedAt: new Date().getTime()
            }
          };
    
          const ack = await PublicRidesPayments.updateOne(
            { _id: existing._id },
            updateDoc
          );
          if (ack && ack.matchedCount > 0) {
            return {
              ...existing,
              ...updateDoc.$set,
              invoiceId: existing.invoiceId,
              createdAt: existing.createdAt
            };
          }
          return false;
        }
        // No existing record found; insert a new one
        let ack = await PublicRidesPayments.insertOne(invoice);
         console.log("tripIdQuery -- > 5",ack);
        if (ack.insertedId) {
          return invoice;
        } else {
          return false;
        }
  }


}

module.exports = new Invoice();
