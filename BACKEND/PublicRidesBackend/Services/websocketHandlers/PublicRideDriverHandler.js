
class PublicRideDriverHandler {
    constructor(publicRidesDriverNamespace) {
        this.publicRidesDriverNamespace = publicRidesDriverNamespace;
    }

    emitDriverTripStatus(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting driver trip status", socketId)
                    socket.emit('driverTripStatus', data);  
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    } 
    
    emitStopChangeRequest(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
            
                if (socket && socket.connected) {
                    console.log("Emitting driver Updated Stops", socketId)
                    socket.emit('stopChangeRequest', data);  
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitDriverPaymentCompleted(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting driver payment completed", socketId)
                    socket.emit('driverPaymentCompleted', data);  
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    }   

    emitpassangerPaymentInitiated(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passanger payment initiated", socketId)
                    socket.emit('passangerPaymentInitiated', data);  
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    }   

    emitBillApprovalStatus(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting bill approval status to driver", socketId);
                    socket.emit('billApprovalStatus', data);
                }
            });
        } catch (err) {
            console.log(err, "err");
        }
    }

    emitPassengerReceiptUploaded(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesDriverNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passenger receipt uploaded to driver", socketId);
                    socket.emit('passengerReceiptUploaded', data);
                }
            });
        } catch (err) {
            console.log(err, "err");
        }
    }

}

module.exports = PublicRideDriverHandler