// Imports
const redis                 = require('redis');
const sample          = require('../platform/src/lib/sampleParser.js');
const {MongoController} = require('../platform/src/controllers/MongoController.js');

// Constants
const REDIS_HOST            = process.env.REDIS_HOST;
const REDIS_PORT            = process.env.REDIS_PORT;
const REDIS_QUEUE_RAW       = 'sample-logs-raw';
const REDIS_QUEUE_PARSED    = 'sample-logs-parsed';
const MONGO_HOST_DEV        = process.env.MONGO_HOST_DEV || require('../platform/src/lib/credentials').mongoHostDev;
const MONGO_HOST_PROD       = process.env.MONGO_HOST_PROD || require('../platform/src/lib/credentials').mongoHostProd;
const MONGO_DB              = 'sample-int-services';

// Initialize connection to Mongo
const dbConnDev = new MongoController(MONGO_HOST_DEV, MONGO_DB, 'sampleLogs');

// Initialize Redis
const redisClient = redis.createClient(REDIS_PORT, REDIS_HOST);

redisClient.on('connect', () => {
    console.log('Successfully connected to Redis!');
    processNextLog();
}).on('error', (err) => {
    console.log('Redis error:', err.toString());
    process.exit();
});

// Process the raw queue
function processNextLog () {
    
    // BRPOP acs-logs-raw 0(no timeout)
    redisClient.blpop([REDIS_QUEUE_RAW, 0], (listName, item) => {
        
        item = item[1];
        
        let splitIndex  = item.indexOf('|');
        let zone        = item.slice(0, splitIndex);
        let logBody     = item.slice(splitIndex + 1);
        
        try {
            let logJson = acsLogParser.toJson(logBody);
            if (logJson !== undefined) {
                logJson['zone'] = zone.toLowerCase();
                
                redisClient.publish(REDIS_QUEUE_PARSED, JSON.stringify(logJson));
                
                console.log(logJson);
                // dbConnProd.write(logJson);
                dbConnDev.write(logJson);
            }
        } catch(e) {
            console.log('Threw error on', zone, logBody);
        }
        
        // We use this to avoid recursion and prevent stack overflow
        process.nextTick(processNextLog);
        
    });
    
};
