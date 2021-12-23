const {createClient} = require('redis');
const md5 = require('md5');
const weights = require('../consts/endpoint-weights');
const limits = require('../consts/user-rate-limits');

const rateLimit = async (req, res, next) => {
    const user = req.auth.user;
    const date = new Date();
    const expireBefore = date.setHours(date.getHours()-1);

    const { url, method } = req;
    const endpointWeight = weights[`[${method}]${url}`] || weights['default'];
    const userLimit = parseInt(process.env[limits[user]]);

    const redisClient = createClient();
    const redisKey = md5(user);

    try {
        await redisClient.connect();
    } catch (Error) {
        console.log('Redis Client Error', Error);
        // based on business model needs we can terminate request or just skip rate limit checking 
        // and proceed processing request by calling next()
        res.status(500).send('Service temporary unavailable.');
    }

    await redisClient.zRemRangeByScore(redisKey, 0, expireBefore); //  O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements removed by the operation.
    const currentRate = await redisClient.zCard(redisKey); // O(1)

    if (currentRate >= userLimit) {
        const member = await redisClient.zRangeWithScores(redisKey, 0, 0); // O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements returned.
        res.status(429).send({ message: `Rate limit of ${userLimit} requests has been reached! Next request can be performed in ${60 - new Date(new Date().getTime() - member[0].score).getMinutes()} minute(s)`});
    } else {
        redisClient
            .multi()
            .zAdd(redisKey, calculateMembersSet(endpointWeight)) // O(log(N)) for each item added, where N is the number of elements in the sorted set.
            .expire(redisKey, 60 * 60) // O(1)
            .exec();

        next();
    }
}

const calculateMembersSet = (endpointWeight) => {
    let members = [];
    const date = new Date().getTime();

    for (i=0; i<endpointWeight; i++) {
        members.push({
            score: date,
            value: `${date}:${i}`
        })
    }

    return members;
}

module.exports = rateLimit;