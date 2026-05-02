import { create } from 'zustand';
import { documentsList } from '../../common/constants/jsonData';

const usePublicDriverStore = create((set, get) => ({
  documents: documentsList.map(doc => ({
    ...doc,
    status: 'pending', // pending, uploaded, verified, rejected, loading
    file: null,
    uploadDate: null,
    verificationDate: null,
  })),


  isPickLocationPressed: false,
  setIsPickLocationPressed: (isPickLocationPressed) => {
    set({ isPickLocationPressed: isPickLocationPressed });
  },
  
  driverInfo: {
    name: '',
    phone: '',
    alternatePhone: '',
    licenseNo: '',
    driverPhoto: null,
    gender: '',
    homeLocation: null,
    licenseDocument: null,
    dob: '',
  },
  
  vehicleInfo: {
    type: '',
    regNo: '',
    vehicleRcDoc: null,
    insuranceDoc: null,
    permitNumber: '',
    permitDoc: null,
  },
  
  bankInfo: {
    accountHolderName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    branch: '',
    passbookImage: null,
    UPIID:'',
    email: '',
    address: {
      street1: '',
      street2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'IN'
    },
    
  },
  setDriverInfo: (driverData) => {
    set({ driverInfo: { ...get().driverInfo, ...driverData } });
  },
  
  setVehicleInfo: (vehicleData) => {
    set({ vehicleInfo: { ...get().vehicleInfo, ...vehicleData } });
  },
  
  setBankInfo: (bankData) => {
    set({ bankInfo: { ...get().bankInfo, ...bankData } });
  },
  
  getDriverInfo: () => get().driverInfo,
  
  getVehicleInfo: () => get().vehicleInfo,
  
  getBankInfo: () => get().bankInfo,
  
  setDocumentFile: (docId, file) => {
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === docId
          ? { 
              ...doc, 
              file, 
              status: 'loaded',
              uploadDate: new Date().toISOString() 
            } 
          : doc
      )
    }));
  },
  
  
  updateDocumentStatus: (docId, status) => {
    set(state => ({
      documents: state.documents.map(doc => 
        doc.id === docId 
          ? { 
              ...doc, 
              status,
              verificationDate: status === 'verified' ? new Date().toISOString() : doc.verificationDate
            } 
          : doc
      )
    }));
  },

  getCompletionStatus: () => {
    const { driverInfo, vehicleInfo, documents, bankInfo } = get();

    const { alternatePhone, licenseNo, licenseDocument, driverPhoto, ...restDriverInfo } = driverInfo;
    const isDriverInfoComplete = Object.values(restDriverInfo).every(value => 
      value !== null && value !== undefined && value !== ''
    );

    if(!isDriverInfoComplete){
      return 1;
    }

    const requiredVehicleFields = ['type', 'regNo', 'permitNumber', 'insuranceDoc'];
    const isVehicleInfoComplete = requiredVehicleFields.every(field => {
      const value = vehicleInfo[field];
      return value !== null && value !== undefined && value !== '';
    });

    if(!isVehicleInfoComplete){
      return 2;
    }

    // Check bank info completion
    const isBankInfoComplete = Object.values(bankInfo).every(value => 
      value !== null && value !== undefined && value !== ''
    );
    if(!isBankInfoComplete){
      return 3;
    }
    // Check documents completion
    const isDocumentsComplete = documents.filter(doc => doc.required).every(doc => doc.status === 'uploaded');
    if(!isDocumentsComplete){
      return 4;
    }
  },

  storeDocuments: (documents) => {
    if (!documents) return;
    
    // Handle object format like {"vehicle_photo": "https://..."}
    if (typeof documents === 'object') {
      set(state => ({
        documents: state.documents.map(existingDoc => {
          const url = documents[existingDoc.id];
          if (url) {
            return {
              ...existingDoc,
              status: 'uploaded',
              file: {
                uri: url,
                name: `document_${existingDoc.id}`,
                type: url.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 
                      url.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg',
              },
              uploadDate: existingDoc.uploadDate || new Date().toISOString()
            };
          }
          return existingDoc;
        })
      }));
    } 
    
  },

  isAllDocumentsUploaded: () => {
    const { documents } = get();
    return documents
      .filter(doc => doc.required)
      .every(doc => doc.status === 'uploaded');
  },
  
  getAllDocuments: () => get().documents,
  
  getDocumentById: (docId) => get().documents.find(doc => doc.id === docId),
  
  getDocumentsStatus: () => {
    const { documents } = get();
    const total = documents.length;
    const uploaded = documents.filter(doc => doc.status === 'uploaded').length;
    const verified = documents.filter(doc => doc.status === 'verified').length;
    const rejected = documents.filter(doc => doc.status === 'rejected').length;
    const pending = documents.filter(doc => doc.status === 'pending').length;
    const loading = documents.filter(doc => doc.status === 'loading').length;
    
    return {
      total,
      uploaded,
      verified,
      rejected,
      pending,
      loading,
      isComplete: verified === total
    };
  },
  
  // todo : remove this from here
  vendorId: null,
  setVendorId: (vendorId) => {
    set({ vendorId });
  },

  driverRole: false,
  setDriverRole: (role) => {
    set({ driverRole: role });
  },

  driverDue: 0,
  setDriverDue: (due) => {
    set({ driverDue: due });
  },

  driverEarnings: 0,
  setDriverEarnings: (earnings) => {
    set({ driverEarnings: earnings });
  },

  updateDriverDue: (due) => {
    set({ driverDue: Number(get().driverDue) + Number(due) });
  },

  driverTotalTrips: 0,
  setDriverTotalTrips: (trips) => {
    set({ driverTotalTrips: trips });
  },

  isApproved: true,
  setIsApproved: (approved) => {
    set({ isApproved: approved });
  },

  isBlocked: false,
  setIsBlocked: (blocked) => {
    set({ isBlocked: blocked });
  },

  unBlockRequestSent: false,
  setUnBlockRequestSent: (unBlockRequestSent) => {
    set({ unBlockRequestSent: unBlockRequestSent });
  },

  driverDueDate: null,
  setdriverDueDate:(driverDueDate) => set({ driverDueDate: driverDueDate }),

  driverRatings: null,
  setDriverRatings: (ratings) => set({ driverRatings: ratings }),

  razorpayLinkedAccountDetails: null,
  setRazorpayLinkedAccountDetails: (details) => set({ razorpayLinkedAccountDetails: details }),

  showRatingModal: false,
  setShowRatingModal: (show) => set({ showRatingModal: show }),

  showPaymentCompletion: false,
  setShowPaymentCompletion: (show) => set({ showPaymentCompletion: show }),

  minDueAmount: 1,
  setMinDueAmount: (amount) => set({ minDueAmount: amount }),

  dueDuration: null,
  setDueDuration: (duration) => set({dueDuration: duration}),

  showPaymentInitiatedLoader: false,
  setShowPaymentInitiatedLoader: (show) => set({ showPaymentInitiatedLoader: show}),

  locationCompleteStatus: null,
  setLocationCompleteStatus: (status) => set({ locationCompleteStatus: status}),

  driverDetailsCompleteStatus: null,
  setDriverDetailsCompleteStatus: (status) => set({ driverDetailsCompleteStatus: status}),

  vehicleDetailsCompleteStatus: null,
  setVehicleDetailsCompleteStatus: (status) => set({ vehicleDetailsCompleteStatus: status}),

  bankDetailsCompleteStatus: null,
  setBankDetailsCompleteStatus: (status) => set({ bankDetailsCompleteStatus: status}),

  razorpayUpdated:false,
  setRazorpayUpdated:(status) => set({ razorpayUpdated: status}),

  documentsCompleteStatus: null,
  setDocumentsCompleteStatus: (status) => set({ documentsCompleteStatus: status}),

  isParivahanFailed: false,
  setIsParivahanFailed: (status) => set({ isParivahanFailed: status}),

  // Reset all state to initial values
  resetPublicDriverState: () => {
    set({
      documents: documentsList.map(doc => ({
        ...doc,
        status: 'pending',
        file: null,
        uploadDate: null,
        verificationDate: null,
      })),
      driverInfo: {
        name: null,
        phone: null,
        aadharNo: null,
        panNo: null,
        licenseNo: null,
        licenseDocument: null,
        aadharDocument: null,
        panDocument: null,
        driverPhoto: null,
        gender: null,
        alternatePhone: null,
        homeLocation: null
      },
      vehicleInfo: {
        type: null,
        regNo: null,
        vehicleRcDoc: null,
        insurance: null,
        permitNumber: null,
        permitDoc: null,
      },
      bankInfo: {
        accountHolderName: null,
        accountNumber: null,
        bankName: null,
        ifscCode: null,
        branch: null,
        passbookImage: null,
        UPIID: null,
        email: null,
        address: {
          street1: null,
          street2: null,
          city: null,
          state: null,
          postal_code: null,
          country: 'IN'
        }
      },
      vendorId: null,
      driverRole: false,
      driverDue: 0,
      driverEarnings: 0,
      driverTotalTrips: 0,
      isApproved: false,
      isBlocked: false,
      unBlockRequestSent: false,
      driverDueDate: null,
      driverRatings:null,
      razorpayLinkedAccountDetails: null,
      locationCompleteStatus:null,
driverDetailsCompleteStatus:null,
vehicleDetailsCompleteStatus:null,
bankDetailsCompleteStatus:null,
documentsCompleteStatus:null,
razorpayUpdated:false
    });
  },
}));

export default usePublicDriverStore;
