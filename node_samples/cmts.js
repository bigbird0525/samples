const {sampleCMTScontroller} = require('../../../../cmts-poll-server/pollingServer')

const sendCmd = (req, res) => {
	console.log('sending command...')
	const instance = ((cmts, hostname) => {
		switch(cmts) {
			case 'sample':
				return new sampleCMTScontroller(hostname)
			case 'sample2':
				return new sample2(hostname)
			case 'sample3':
				return new sample3(hostname)
			default:
				throw `${cmts} is not available`
		}
	})(req.body.cmts.toLowerCase(), req.body.hostname)
	.command(req.body.cmd)
		.then(results => {
			if (results.indexOf('error') === -1) {
				res.json({response: results})
			} else {
				res.statusCode = 400
				res.json({error: results})
			}
		})
		.catch(err => console.log('Send command error - ', err)) 
}

module.exports = app => {
	app.route('/v1/cmts/send-cmd').post(sendCmd)
}
