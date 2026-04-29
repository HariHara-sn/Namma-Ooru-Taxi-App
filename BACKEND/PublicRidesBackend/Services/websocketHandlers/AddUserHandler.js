
class AddUserHandler {
    constructor(webAppClientsNamespace, realtimeServerNamespace) {
        this.webAppClientsNamespace = webAppClientsNamespace;
        this.realtimeServerNamespace = realtimeServerNamespace;
    }

    // emitAddUserToGroupAlert(socketId, data) {
    //     this.webAppClientsNamespace.to(socketId).emit('addUserToGroupAlert', data);
    // }
    
    emitAddUserToGroupAlert(socketIds, data) {
        try {
            socketIds.forEach(socketId => {
                const socket = this.webAppClientsNamespace.sockets.get(socketId);
                if (socket && socket.connected) {
                    console.log("Emitting device request to", socketId)
                    socket.emit('addUserToGroupAlert', data);
                }
            });
        } catch (err) {
            console.log(err, "err")
        }
    }

}

module.exports = AddUserHandler