
class DeviceRequestHandler {
    constructor(webAppClientsNamespace, realtimeServerNamespace) {
        this.webAppClientsNamespace = webAppClientsNamespace;
        this.realtimeServerNamespace = realtimeServerNamespace;
    }

    emitDeviceRequest(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.webAppClientsNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting device request to", socketId)
                    socket.emit('deviceRequest', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }

    emitDeviceRequestUpdate(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.webAppClientsNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    socket.emit('deviceRequestUpdate', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }
}

module.exports = DeviceRequestHandler