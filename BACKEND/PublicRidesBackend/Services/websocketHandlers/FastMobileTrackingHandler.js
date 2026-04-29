const Redis = require('../../Controllers/DB/Redis');

class FastMobileTrackingHandler {
    constructor(fastMobileTrackingNamespace) {
        this.fastMobileTrackingNamespace = fastMobileTrackingNamespace;
    }


    initialize(socket) {
        socket.on('location', async (data) => {
            try {
                const { deviceId, location, liveStats } = data;

                /* get all fast match sockets */

                const fastSocketIds = await Redis.getData('FMT:' + deviceId)
                
                if(fastSocketIds){
                    const socketIds = fastSocketIds.split(',')?.map(v => v.split('|')[0]).filter(Boolean);
                    if(socketIds.length > 0){
                        socketIds.forEach(socketId => this.fastMobileTrackingNamespace.to(socketId).emit('location', {deviceId, data: { location: location, liveStats: liveStats}}));
                    }
                }
            } catch (err) {
                console.log(err)
            }
        })
    }
}

module.exports = FastMobileTrackingHandler;