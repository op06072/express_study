import redis from 'redis';

const URI = process.env.REDIS_URI || "localhost";
const PORT = process.env.REDIS_PORT || "6379";

const redisClient = redis.createClient({
    url: `${URI}:${PORT}/0`,
    legacyMode: true
});
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('error', (err) => {
    console.log('Something went wrong ' + err);
});
redisClient.connect().then();
export const redisCli = redisClient.v4;
