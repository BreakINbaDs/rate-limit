/**
 * FYI: Personally I would not reccomend to implement IP limitations on the Node js layer 
 * since Node is single threaded and each request (even from black listed IPs) will be processed
 * by its thread and will block it for some time. Instead I would recommend to use Nginx/Apache (which can process simultenious connections) 
 * for this purpose and do not pass requests which are comming from blacklisted IPs to the Node layer at all. 
 */
const blockedIps = require('../consts/blocked-ips');

const ipGate = (req, res, next) => {
    const userIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;
    if (blockedIps.includes(userIp)) {
        res.status(403).send();
    } else {
        next();
    }
}

module.exports = ipGate;