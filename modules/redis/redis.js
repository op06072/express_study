import redis from 'redis';

const redisClient = redis.createClient({ legacyMode: true });
redisClient.on('connect', () => {
    console.log('Redis client connected');
});
redisClient.on('error', (err) => {
    console.log('Something went wrong ' + err);
});
redisClient.connect().then();
export const redisCli = redisClient.v4;
