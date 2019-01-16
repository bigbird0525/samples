const PersistentCmtsSSH = require('../platform/src/lib/persistentCmtsSsh')
const SSH = require('../platform/src/lib/ssh')
const {dataSCMparser,dataSCMDparser,dataSysDescParser,dataPhyParser} = require('../platform/src/lib/cmtsParser')
const zones = require('./cmtsModels')
const {sampleTransform,loadDb} = require('./cmtsETL')

const findIndex = (arr, macAddr) => {
	return arr.map(row => row.cmMAC === macAddr ? arr.indexOf(row) : undefined).filter(value => value !== undefined)[0]
}

class sampleCMTScontroller {
	constructor(hostname) {
		this. = new PersistentCmtsSSH(zones[hostname], zones[hostname].models['sample'])
		this.sampleData
		this.hostname = hostname
		this.stabilityZone = zones[hostname].stabilityZone
	}

	addDataToArrRecs(scmData, newData) {
		let props = Object.keys(newData[0]).filter(key => key !== 'cmMAC')
		newData.forEach(record => {
			let scmIndex = findIndex(scmData, record.cmMAC)
			if (scmIndex !== undefined) {
				props.map(prop => scmData[scmIndex][prop] = record[prop])
			}
		})
	}

	parseData(scmData, scmdData, scmSysData, scmPhyData) {
		let parsedData = dataSCMparser(this.hostname, this.stabilityZone, scmData)
		if (parsedData.length > 0) {
			let addedData = [dataSCMDparser(scmdData), dataSysDescParser(scmSysData),dataPhyParser(scmPhyData)]
			addedData.map(data => this.addDataToArrRecs(parsedData, data))
		}
		return parsedData
	}

	poll() {
		let buffer = []
		this.sample.command('terminal length 0')
		.then(() => {
			return Promise.all([this.sample.command('show cable modem'),this.sample.command('show cable modem detail'),this.sample.command('show cable modem system-description'),this.sample.command('show cable modem phy')])
			.then(results => results.map(result => buffer.push(result.data.split('\r').join(''))))
		})
		.then(() => this.sampleData = this.parseSampledata(...buffer))
		.then(results => results.length > 0 ? sampleTransform(results) : undefined)
		.then(results => results === undefined ? undefined : loadDb(results))
		.catch(err => console.log('Sample error -',err))
	}

	command(cmd) {
		return this.sample.command('terminal length 0')
			.then(() => this.sample.command(cmd))
			.then(res => res.data)
	}
}

module.exports = {
	sampleCMTScontroller
}