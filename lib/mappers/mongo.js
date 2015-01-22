"use strict";
var Bluebird = require("bluebird");
var MongoDB  = require("mongodb");
var Util     = require("./util");

var MongoClient = MongoDB.MongoClient;

Bluebird.promisifyAll(MongoDB);

function MongoMapper () {
	function collectionName (instance) {
		return instance.constructor.modelName.toLowerCase();
	}

	function getCollection (collection) {
		var db;

		return MongoClient.connectAsync(MongoMapper.DEFAULT_URL)
		.then(function (connection) {
			db = connection;
			return db.collectionAsync(collection);
		})
		.disposer(function () {
			return db.closeAsync();
		});
	}

	this.create = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		return Bluebird.using(
			getCollection(collectionName(instance)),
			function (collection) {
				return collection.insertAsync(instance);
			}
		)
		.return(instance);
	});
}

MongoMapper.DEFAULT_URL = "mongodb://localhost/test";
Object.freeze(MongoMapper);

module.exports = MongoMapper;
