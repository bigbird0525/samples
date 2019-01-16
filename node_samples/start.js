const {sampleCMTScontroller} = require('./pollingServer')
const {setupApp, startApp} = require('../platform/src/start')

const sampleHosts = ['test1','test2','test3']

const sampleConn = sampleHosts.map(host => new sampleCMTScontroller(host))

const CMTSpolling = (connArr) => {
	console.log('Beginning polling...')
	connArr.forEach(conn => conn.poll())
}

const startCMTSpollServer = () => {
	const pathToEPS = '../platform/src'
	const endPoints = [
	'cmts'
	]
	const ioFiles = []
	const app = setupApp(pathToEPS, endPoints, ioFiles)
	const server = startApp(app, 3900)
}

CMTSpolling(sampleConn)
setInterval(() => CMTSpolling(sampleConn), 180*1000) //poll every 3 minutes

const app = startCMTSpollServer()
module.exports = app