const io = require("socket.io-client");
const socket = io.connect("http://localhost:3000/realtime-server", {

});

socket.on("connect", () => {
    console.log("User Connected to the server with", socket.id);



});

setTimeout(() => {
    console.log("Emitting")
    socket.emit("deviceLocationUpdate", {
        deviceId: "65ead6ba544b97d3539fdd1c",
        location: {
            coordinates: [
                80.1854,
                13.1196
            ],
            type: 'Point'
        },
        liveStats: {
            speed: 22,
            battery: 22,
        }
    });
}, 2000)

// setTimeout(() => {
//     console.log("Emitting")
//     socket.emit("alert", {
//         deviceId: "65ead6ba544b97d3539fdd1c",
//         alerts: [
//             {

//             },
//             {
                
//             }
//         ]
//     });
// }, 2000)

socket.on("addUserToGroupAlert", (data) => {
    console.log("You are added to the New Group ", data.name, ": Check Group Notification" );
});

socket.on("disconnect", () => {
    console.log("User Disconnected to the server with", socket.id);
});