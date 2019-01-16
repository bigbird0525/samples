// DB Connection
const {MongoController} = require('../platform/src/controllers/MongoController')
const MONGO_HOST = process.env.MONGO_HOST || '127.0.0.1:27017'
const MONGO_DB = 'cpe-int-services'
const dbConn = new MongoController(MONGO_HOST, MONGO_DB, 'cmts')
// Helper functions for the Transforms and Loads

const e6kUptime = record => record !== undefined ? record = record.replace(/\sdays\s+/,'d,').replace(/\:/,'h,').replace(/\:\d+/,'m') : record = '0d,0h,0m'

const speedTierTransform = record => {
	if (record === 'Not available') {
		record = '0K/0K'
	}
	let spTier = record.replace(/K/g,'').split('/')
	return {ds: parseFloat(spTier[0]), us: parseFloat(spTier[1])}
}

const casaUptime = uptime => uptime.replace(/\sd\,\s/,'d,').replace(/\sh\,\s/,'h,').replace(/\sm\,/,'m,').replace(/\,\s\d+\ss$/,'')

const convertToEpoch = uptime => {
	let timeSplit = uptime.split(/d/)
	return parseInt(timeSplit[0])*86400 + parseInt(timeSplit[1])
}

const convertEpochToDate = uptime => {
	const diff = new Date(Date.now()).getTime() - new Date(convertToEpoch(uptime) *1000).getTime()
	const days = Math.floor(diff / 1000 / 60 / 60 / 24)
	const hours = Math.floor(diff / 1000 / 60 / 60 % 24)
	const minutes = Math.floor(diff / 1000 / 60 % 60)
	return `${days}d,${hours}h,${minutes}m`
}

const arrisPhyLevelsTransform = phyLevels => {
	res = [{channel: 'us'},{channel:'ds'}]
	Object.keys(phyLevels).map(levels => {
		levels.includes('us') === true ? res[0][levels.slice(2).toLowerCase()] = phyLevels[levels] : res[1][levels.slice(2).toLowerCase()] = phyLevels[levels]
	})
	return res
}

const ciscoPhyLevelsTransform = phyLevels => {
	return Object.keys(phyLevels.usSNR).map(channel => {
		return {channel: channel, pwr: phyLevels.usPWR[channel], snr: phyLevels.usSNR[channel]}
	})
}

// Database Interaction Functions

const findMongoDB = (dbConn,conditions) => {
    return dbConn.find(conditions)
        .then(res => res[0])
}

const writeMongoDb = (dbConn,docs) => {
    return dbConn.create(docs, function (err, res) {
        err !== null ? console.log(err) : undefined
    })
}

const updateMongoDb = (dbConn, conditions, docs) => {
	return dbConn.replaceOne(conditions, docs, function (err, res) {
		err !== null ? console.log(err) : undefined
	})
}

// Transform functions
const e6kTransform = results => {
	results.forEach(record => {
		record.docsisVersion = parseFloat(record.docsisVersion)
		record.uptime = e6kUptime(record.uptime)
		record.config === undefined ? record.config = 'Not available' : undefined
		record.capability === undefined ? record.capability = 'Not available' : undefined
		record.cpe === '0' ? record.cpe = [] : undefined
		record.speedTier = speedTierTransform(record.speedTier)
		record.phyLevels = arrisPhyLevelsTransform(record.phyLevels)
	})
	return results
}

const casaTransform = results => {
	results.forEach(record => {
		record.docsisVersion = parseFloat(record.docsisVersion.replace('DOC',''))
		if (Object.keys(record.phyLevels).length > 0) {
			record.phyLevels = ciscoPhyLevelsTransform(record.phyLevels)
		}
		record.cpe === '0' ? record.cpe = []: undefined
		record.speedTier = speedTierTransform(record.speedTier)
		record.uptime = casaUptime(record.uptime)
		record.capability = 'N/A'
		record.interface = 'N/A'
	})
	return results
}

const cbr8Transform = results => {
	results.forEach(record => {
		record.docsisVersion = parseFloat(record.docsisVersion.replace('DOC',''))
		if (Object.keys(record.phyLevels).length > 0) {
			record.phyLevels = ciscoPhyLevelsTransform(record.phyLevels)
		}
		record.cpe === '0' ? record.cpe = [] : undefined
		record.speedTier = speedTierTransform(record.speedTier)
		record.capability = 'N/A'
		record.interface = 'N/A'
		record.config = 'N/A'
		record.uptime = convertEpochToDate(record.uptime)
	})
	return results
}

const loadDb = results => {
	results.forEach(res => {
		let conditions = {hostname:res.hostname, cmMAC:res.cmMAC}
		dbConn.find(conditions)
			.then(queryRes => {
				if (queryRes.length === 0) {
					dbConn.write(res)		
				} else {
					dbConn.update(conditions, res)
				}
			})
		.catch(err => console.log(`${dbConn} Load error - `, err))
	})
}

module.exports = {
	e6kTransform,
	casaTransform,
	cbr8Transform,
	loadDb
}