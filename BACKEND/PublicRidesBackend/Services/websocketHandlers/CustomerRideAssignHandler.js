
class CustomerRideAssignHandler {
    constructor(publicRidesCustomerNamespace) {
        this.publicRidesCustomerNamespace = publicRidesCustomerNamespace;
    }

    emitDriverAllocated(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting driver allocation", socketId)
                    socket.emit('driverAllocated', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitPassangerLocationChange(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passanger location change", socketId)
                    socket.emit('passangerLocationChange', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }               

    }
     
    
    emitPassangerTripFareUpdate(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passanger trip fare update", socketId)
                    socket.emit('passangerTripFareUpdate', data);
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    }
    emitPassangerTripStatus(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passanger trip status", socketId)
                    socket.emit('passangerTripStatus', data);
                }
            })
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitDriverTest(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting driver test............", socketId)
                    socket.emit('driverTestSimulation', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitPassangerAccount(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting passanger account event", socketId)
                    socket.emit('passangerAccount', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitNewBillRequest(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.publicRidesCustomerNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting new bill request to passenger", socketId);
                    socket.emit('newBillRequest', data);
                }
            });
        } catch (err) {
            console.log(err, "err");
        }
    }

}

module.exports = CustomerRideAssignHandler