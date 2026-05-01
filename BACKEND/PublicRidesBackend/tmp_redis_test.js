// Temp testing for redis
//Ubuntu redis
// sudo apt update
// sudo apt install redis-server -y
// sudo service redis-server start
// redis-cli ping   op : PONG

const { createClient } = require("redis");
(async () => {
  const client = createClient();
  client.on("error", (err) => console.error("redis client error", err.message));
  try {
    await client.connect();
    const pong = await client.ping();
    console.log("PING", pong);
    await client.disconnect();
  } catch (e) {
    console.error("CONNECT ERROR", e.message);
    process.exit(1);
  }
})();
