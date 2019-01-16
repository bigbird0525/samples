const models = require('../../models/modelDefinitions')
const log = require('../../lib/log.js')
const SampleController = require('../../controllers/SampleController')

/**
* @fileOverview This endpoint allows the user to find the device ID for a selected mac address. 
* All requests should be sent to the below endpoint as a POST with the mac address parameter. 
* @function Find Device ID 
* @param endpoint {endpoint} - /removedForSample
* @param mac address {string} - mac address
*/
const findDeviceId = (req,res) => {
	console.log('Searching for device id....')
	new SampleController(req.body.zone).findDeviceId(req.body)
		.then(results => {
			if (results.statusCode === 200) {
				res.json({response: results.body})
			} else {
				res.statusCode = 400
				res.json({error: results.message})
			}
		})
		.catch(err => console.log('find device id EP error -', err))
}
/**
* @fileOverview This endpoint allows the user to add parameters to a device managed through Sample Device Management.
* All requests should be sent to the below endpoint as a POST with the two parameters in the body.
* @function Create Device Parameter  
* @param endpoint {endpoint} - /removedForSample
* @param mac address {string} - mac address - ex: mac: E1D1F4ED11
* @param parameter {string} - path to parameter - ex: parameter: Device.DeviceInfo.
*/
const createDeviceParam = (req,res) => {
	console.log('Creating Device Parameter...')
	new SampleController(req.body.zone).createDeviceParam(req.body)
		.then(results => {
			if (results.statusCode === 200) {
				res.json({response: results.body})
			} else {
				res.statusCode = 400
				res.json({error: results.message})
			}
		})
		.catch(err => console.log('Create Device Param EP err - ', err))
}

module.exports = app => {
	app.route('/removedForSample').post(findDeviceId)
	app.route('/removedForSample').post(createDeviceParam)
}