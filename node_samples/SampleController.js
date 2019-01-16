const log = require('../lib/log')
const SampleDeviceLogger = require('./SampleDeviceLogger')
const request = require('request-promise')
const SAMPLE_USER = process.env.ACS_USER || require('../lib/credentials').acsUser
const SAMPLE_PWD = process.env.ACS_PWD || require('../lib/credentials').acsPwd
const MONGO_HOST = process.env.MONGO_HOST || '127.0.0.1:27017'
const MONGO_DB = 'sample-int-services'
const {MongoController} = require('./MongoController')
const dbConn = new MongoController(MONGO_HOST, MONGO_DB, 'sample');

const renameKeys = (keysMap, obj) => Object
    .keys(obj)
    .reduce((acc, key) => ({
        ...acc,
        ...{ [keysMap[key] || key]: obj[key] }
    }), {})

const reduceObj = (keyMap, obj) => Object
    .entries(obj)
    .filter(keyVal => keyMap.includes(keyVal[0]))
    .reduce((acc, [k,v]) => {
            acc[k] = v
            return acc
        }, {})

class SampleController {
    constructor(zone) {
        this.zone = zone
        this.log = new SampleDeviceLogger()
        this.user = SAMPLE_USER
        this.pwd = SAMPLE_PWD
        const zone_table = {
            '{removed for sample}': '{removed for sample}',
            '{removed for sample}': '{removed for sample}'
            }
        this._sample_logs = undefined
        this.cookieJar = request.jar()
        if (zone_table.hasOwnProperty(zone.toLowerCase()) !== true) {
            throw `Zone ${zone} is not available`   
        }
        this.ep = zone_table[zone.toLowerCase()]
        this.counter = 1
    }

    establishSession() {
        const getCookieOptions = {
            uri: this.ep + '/edge/login.ui',
            strictSSL: false,
            headers: {
                'Content-Type': 'application/json'
            },
            json: true,
            resolveWithFullResponse: true,
        }
        return request(getCookieOptions)
            .then(res => {
                this.cookieJar.setCookie(res.headers['set-cookie'][0].split(';')[0], this.ep)
                const postSessionOptions = {
                    method: 'POST',
                    uri: this.ep + '/edge/admin/login',
                    strictSSL: false,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    form: {
                        j_username: this.user,
                        j_password: this.pwd
                    },
                    resolveWithFullResponse: true,
                    followAllRedirects: true,
                    jar: this.cookieJar
                }
                return request(postSessionOptions)
                    .then(res => {
                        if (res.body.includes('j_username')) {
                            throw 'Login failed'
                        } else {
                            return res.body
                        } 
                    })
                
            })
            .catch(err => {
                console.log('Error logging in \n', err)
            })
    }

    _request(reqBody) {
        return request(reqBody)
            .then(res => {
                if (this.counter < 0) {
                    throw 'Authentication error has occurred. Unable to establish a session'
                }
                else if(res.statusCode != 302 && res.statusCode != 200) {
                    console.log('trying again')
                    this.counter -= 1
                    this.establishSession()
                    return sendRequest(reqBody)
                } 
                else {
                    this.counter = 1 // resets counter back to 1 after successfully logging in
                    return res
                }
            })
            .catch(err => {
                return err
            })
    }

    sendRequest(reqBody) {
        let self = this
        if(this.cookieJar.getCookies(this.ep).length == 0 || this.cookieJar.getCookies(this.ep) === undefined) {
            return this.establishSession()
                    .then(() => {
                        return self._request(reqBody)
                    })
                    .catch(err => {
                        console.log('Send request error: \n', err)
                        return err
                    })
        } else {
            return this._request(reqBody)
        }
    }


    buildRequest(urlAppend, formData) {
        const options = {
            method: 'POST',
            uri: this.ep + urlAppend,
            strictSSL: false,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            form: formData,
            jar: this.cookieJar,
            resolveWithFullResponse: true
        }
        return this.sendRequest(options)
    }

    findDeviceId(reqBody) {
        if (reqBody.hasOwnProperty('macAddr') !== true) {
            throw `${reqBody} missing macAddr key`
        }
        const macAddr = reqBody.macAddr.replace(/[^0-9A-Fa-f]/g,'').toUpperCase()
        if (macAddr.length !== 12) {
            throw 'Invalid Mac Address, expecting 6 octet / 48 bit macaddress'
        }
        const searchConditions = {macAddr : `${macAddr}`}
        const urlAppend = '{removed for sample}'
        const formData = {
                offset: 0,
                limit: 30,
                sort: `"serialNum"`,
                acs: "true",
                criteria: `{"serialNum": "${macAddr}", "provisioningId": "*"}`
            }        

        const cachedDeviceId = res => {
            let keyMap = ['zone','macAddr','deviceId','vendor','model','ip']
            const results = {
                body: reduceObj(keyMap, res.toJSON()),
                statusCode: 200
            }

            return results
        }

        const getDeviceId = res => {
            return this.buildRequest(urlAppend, formData)
                .then(res => {
                    if (res.statusCode === 200) {
                        let renameKeyMap = {id: 'deviceId', serialNum: 'macAddr'}
                        let reduceKeyMap = ['zone','macAddr','deviceId','vendor','model','ip']
                        res.body = renameKeys(renameKeyMap, JSON.parse(res.body).results[0])
                        res.body.zone = this.zone
                        dbConn.write(res.body)
                        res.body = reduceObj(reduceKeyMap, res.body)
                        return res
                    } else {
                        return res
                    }
                })
                .catch(err => {error: err})
        }

        return dbConn.find(searchConditions)
            .then(res => res[0] ? cachedDeviceId(res[0]) : getDeviceId(res[0]))
            .catch(err => console.log('Find Device by ID error: \n', err))
    }   

    createDeviceParam(reqBody) {
        return this.findDeviceId(reqBody)  // Make sure reqBody.macAddr exists
            .then(res => {
                const urlAppend = '{removed for sample}'
                const formData = {
                    deviceId: res.body.deviceId,
                    path: JSON.stringify(`${reqBody.parameter}`)
                }
                return this.buildRequest(urlAppend, formData)
                    .then(res => {
                        res.body.includes('0') ? res.body = 'success' : undefined
                        return res
                    })
            })
            .catch(err => console.log('Create Device Param error: \n', err))
    }
}

module.exports = SampleController

