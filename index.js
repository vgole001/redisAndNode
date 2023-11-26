const express = require('express');
const cors = require('cors');
const { createClient } = require('@redis/client');

const port = process.env.PORT || 8080;
// const redisUrl = process.env.REDIS_URL;

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const client = createClient({ socket:{
  host: 'redis',
  port: 6379,
  password: "redisPass"
} });

client.on('connect', () => {
  console.log('Connected to Redis');

  // Set key "foo" with value "bar"
  client.set('foo', 'bar', (error, reply) => {
    if (error) {
      console.error('Redis SET Error:', error);
    } else {
      console.log('Redis SET Reply:', reply);
    }

    // Close the Redis connection
    client.quit();
  });
});

if(!client.isOpen){
  client.connect();
}

// No need to connect to Redis here, it's better to do it globally on server start

app.get('/', (req, res) => {
  console.log('Request at URL');
  res.send('Hello Nabeeel from port ' + port);
});

app.get('/:key', async (req, res) => {
  console.log("Ever comes here...");

  const key = req.params.key;

  try {
    const redisRep = await client.get(key);
    res.send(redisRep || 'Key not found in Redis');
  } catch (error) {
    console.error('Redis GET Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/:key', express.json(), async (req, res) => {
  const key = req.params.key;
  const data = req.body;

  if (!data) {
    return res.status(400).send('Bad Request: Request body is missing or empty');
  }

  // Stringify the object before setting it in Redis
  const jsonString = JSON.stringify(data);

  try {
    const reply = await client.set(key, jsonString);
    res.send(reply);
  } catch (error) {
    console.error('Redis SET Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.delete('/:key', async (req, res) => {
  const key = req.params.key;

  try {
    const reply = await client.del(key);

    if (reply === 1) {
      res.send(`Key "${key}" deleted successfully`);
    } else {
      res.send(`Key "${key}" not found in Redis`);
    }
  } catch (error) {
    console.error('Redis DEL Error:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log('App is listening on port ' + port);
});
