const {runMongo}  = require('../start')
const models    = require('../models/modelDefinitions')
const mongoose = require('mongoose')

class MongoController {
	constructor(hostname, db, model) {
		this.mongo = runMongo(hostname, db)
		this.dbConn = models[model]
	}

	write(docs) {
		return this.dbConn.create(docs, function(err, res) {
			err !== null ? console.log(err) : undefined
		})
	}

	find(conditions) {
		return this.dbConn.find(conditions, function(err, docs) {
			err ? console.log(err) : docs
		})
	}

	update(conditions, docs) {
		return this.dbConn.replaceOne(conditions, docs, function (err, res) {
			err !== null ? console.log(err) : undefined
		})
	}

	updateMany(conditions, docs) {
		return this.dbConn.updateMany(conditions, docs, function(err, res) {
			err !== null ? console.log(err) : undefined
		})
	}

	deleteOne(conditions) {
		return this.dbConn.deleteOne(conditions, function(err) {
			err !== null ? console.log(err) : undefined
		})
	}

	deleteMany(conditions) {
		return this.dbConn.deleteMany(conditions, function(err) {
			err !== null ? console.log(err) : undefined
		})
	}
	close() {
		this.mongo.close()
	}
}

module.exports = {
	MongoController
}