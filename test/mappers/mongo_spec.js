"use strict";
var Bluebird    = require("bluebird");
var Genesis     = require("../../");
var MongoDB     = require("mongodb");
var MongoMapper = require("../../lib/mappers/mongo");

var MongoClient = MongoDB.MongoClient;

var expect = require("chai").expect;
var _      = require("lodash");

Bluebird.promisifyAll(MongoDB);

describe("A mongo mapper", function () {
	var mapper = new MongoMapper();

	function cleanup () {
		return Bluebird.using(
			connection(),
			function (db) {
				return db.dropDatabaseAsync();
			}
		);
	}

	function connection () {
		return MongoClient.connectAsync(MongoMapper.DEFAULT_URL)
		.disposer(function (db) {
			return db.closeAsync();
		});
	}

	function find (collection, query) {
		return Bluebird.using(
			connection(),
			function (db) {
				return db.collectionAsync(collection)
				.then(function (collection) {
					return collection.find(query).toArrayAsync();
				})
				.map(function (record) {
					return _.omit(record, "_id");
				});
			}
		);
	}

	it("has constant static properties", function () {
		expect(Object.isFrozen(MongoMapper), "frozen").to.be.true;
	});

	it("has a default URL", function () {
		expect(MongoMapper, "default URL").to.have.property(
			"DEFAULT_URL",
			"mongodb://localhost/test"
		);
	});

	describe("creating a new record", function () {
		describe("from an object", function () {
			var instance = Object.create(null);

			var error;

			before(function () {
				return mapper.create(instance)
				.catch(function (data) {
					error = data;
				});
			});

			after(function () {
				return cleanup();
			});

			it("fails", function () {
				expect(error, "error").to.be.an.instanceOf(Error);
				expect(error.message, "message").to.contain("Model");
			});
		});

		describe("from a model", function () {
			describe("with an index", function () {
				var NAME = "name";

				var Test     = Genesis.create("test", { index : "name" });
				var instance = new Test({ name : NAME });

				var result;

				before(function () {
					return mapper.create(instance)
					.then(function (data) {
						result = data;
					});
				});

				after(function () {
					return cleanup();
				});

				it("returns the model", function () {
					expect(result, "model").to.equal(instance);
				});

				it("inserts the record in the database", function () {
					return find("test", { name : NAME })
					.then(function (results) {
						expect(results, "results").to.deep.equal([ instance ]);
					});
				});
			});

			describe("without an index", function () {
				it("fails");
			});
		});
	});
});
