"use strict";
var Bluebird = require("bluebird");
var MongoDB  = require("mongodb");
var Util     = require("./util");

var MongoClient = MongoDB.MongoClient;

var _ = require("lodash");

Bluebird.promisifyAll(MongoDB);

function MongoMapper () {
	function collectionIndex (Model) {
		return Model.index;
	}

	function collectionName (Model) {
		return Model.modelName.toLowerCase();
	}

	function getCollection (collection, index) {
		var db;

		return MongoClient.connectAsync(MongoMapper.DEFAULT_URL)
		.then(function (connection) {
			db = connection;
			return db.collectionAsync(collection)
			.then(function (collection) {
				var fields = {};

				fields[index] = 1;

				return collection.ensureIndexAsync(fields, { unique : true }).return(collection);
			});
		})
		.disposer(function () {
			return db.closeAsync();
		});
	}

	function scrub (Model, descriptor) {
		return new Model(_.omit(descriptor, "_id"));
	}

	this.create = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		return Bluebird.using(
			getCollection(
				collectionName(instance.constructor),
				collectionIndex(instance.constructor)
			),
			function (collection) {
				return collection.insertAsync(instance);
			}
		)
		.return(instance);
	});

	this.find = function (Model, query) {
		return Bluebird.using(
			getCollection(collectionName(Model), collectionIndex(Model)),
			function (collection) {
				return collection.find(query).toArrayAsync();
			}
		)
		.map(function (record) {
			return scrub(Model, record);
		});
	};

	this.findOne = function (Model, query) {
		return Bluebird.using(
			getCollection(collectionName(Model), collectionIndex(Model)),
			function (collection) {
				return collection.findOneAsync(query);
			}
		)
		.then(function (result) {
			if (result) {
				result = scrub(Model, result);
			}

			return result;
		});
	};

	this.update = function (instance) {
		var index = collectionIndex(instance.constructor);

		return Bluebird.using(
			getCollection(collectionName(instance.constructor), index),
			function (collection) {
				var query = {};

				query[index] = instance[index];

				return collection.updateAsync(query, instance);
			}
		)
		.return(instance);
	};
}

MongoMapper.DEFAULT_URL = "mongodb://localhost/test";
Object.freeze(MongoMapper);

module.exports = MongoMapper;
