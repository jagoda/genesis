"use strict";
var Bluebird = require("bluebird");
var MongoDB  = require("mongodb");
var Util     = require("./util");

var MongoClient = MongoDB.MongoClient;

var _ = require("lodash");

Bluebird.promisifyAll(MongoDB);

function MongoMapper (dbUrl) {
	if (!dbUrl) {
		dbUrl = MongoMapper.DEFAULT_URL;
	}

	var connection = MongoClient.connectAsync(dbUrl);

	function collectionIndex (Model) {
		return Model.index;
	}

	function collectionName (Model) {
		return Model.modelName.toLowerCase();
	}

	function getCollection (collection, index) {
		return connection
		.then(function (connection) {
			return connection.collectionAsync(collection);
		})
		.then(function (dbCollection) {
			var fields = {};
			fields[index] = 1;

			return dbCollection
			.ensureIndexAsync(fields, { unique : true })
			.return(dbCollection);
		});
	}

	function scrub (Model, descriptor) {
		return new Model(_.omit(descriptor, "_id"));
	}

	this.create = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		return getCollection(
			collectionName(instance.constructor),
			collectionIndex(instance.constructor)
		)
		.then(function (collection) {
			return collection.insertAsync(instance);
		})
		.return(instance);
	});

	this.find = function (Model, query) {
		return getCollection(collectionName(Model), collectionIndex(Model))
		.then(function (collection) {
			return collection.findAsync(query)
			.then(function (cursor) {
				return [ cursor, cursor.toArrayAsync() ];
			})
			.spread(function (cursor, documents) {
				return cursor.closeAsync().return(documents);
			});
		})
		.map(function (record) {
			return scrub(Model, record);
		});
	};

	this.findOne = function (Model, query) {
		return getCollection(collectionName(Model), collectionIndex(Model))
		.then(function (collection) {
			return collection.findOneAsync(query);
		})
		.then(function (result) {
			if (result) {
				result = scrub(Model, result);
			}

			return result;
		});
	};

	this.update = function (instance) {
		var Constructor = instance.constructor;
		var index = collectionIndex(Constructor);

		return getCollection(collectionName(Constructor), index)
		.then(function (collection) {
			var query = {};

			query[index] = instance[index];

			return collection.findOneAsync(query)
			.then(function (findResult) {
				if (!findResult) {
					throw new Error("The document you tried to update does not exist.");
				}

				var revisionQuery = _.pick(instance, index, "revision");

				instance = new Constructor(
					_.merge(
						_.clone(instance),
						{ revision : instance.revision + 1 }
					)
				);

				return collection.updateAsync(revisionQuery, instance, { fullResult : true });
			})
			.then(function (result) {
				// number of updated documents
				if (0 === result.n) {
					throw new Error(
						"Update failed due to concurrency errors. Please try again."
					);
				}
			});
		})
		.then(function () {
			return instance;
		});
	};

	this.destroy = function (instance) {
		var index = collectionIndex(instance.constructor);

		return getCollection(collectionName(instance.constructor), index)
		.then(function (collection) {
			var query = {};

			query[index] = instance[index];

			return collection.findOneAsync(query)
			.then(function (findResult) {
				if (!findResult) {
					throw new Error("The document you tried to delete does not exist.");
				}

				var revisionQuery = _.pick(instance, index, "revision");

				return collection.removeAsync(revisionQuery, { fullResult : true });
			})
			.then(function (result) {
				// number of deleted documents
				if (0 === result.n) {
					throw new Error(
						"Delete failed due to concurrency errors. Please try again."
					);
				}
			});
		})
		.then(function () {
			return instance;
		});
	};

	this.dispose = function () {
		return connection
		.then(function (db) {
			return db.closeAsync();
		});
	};
}

MongoMapper.DEFAULT_URL = "mongodb://localhost/test";
Object.freeze(MongoMapper);

module.exports = MongoMapper;
