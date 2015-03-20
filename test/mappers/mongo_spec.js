"use strict";
var Bluebird    = require("bluebird");
var Genesis     = require("../../");
var MongoDB     = require("mongodb");
var MongoMapper = require("../../lib/mappers/mongo");
var Sinon       = require("sinon");

var MongoClient = MongoDB.MongoClient;

var expect = require("chai").expect;
var _      = require("lodash");

Bluebird.promisifyAll(MongoDB);

describe("A mongo mapper", function () {
	var mapper = new MongoMapper();
	var name   = "foo";

	var Test = Genesis.create("test", { index : "name" });

	var instance = new Test({ name : name });

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
					return find("test", { name : name })
					.then(function (results) {
						expect(results, "results").to.deep.equal([ instance ]);
					});
				});
			});

			describe("without an index", function () {
				var Test     = Genesis.create("test");
				var instance = new Test({ name : "test" });

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
					expect(error, "type").to.be.an.instanceOf(Error);
					expect(error.message, "message").to.contain("index");
				});
			});
		});

		describe("with a database error", function () {
			var failure  = new Error("Simulated failure.");
			var instance = new Test({ name : "foo" });

			var error;

			before(function () {
				Sinon.stub(MongoDB.Collection.prototype, "insertAsync", function () {
					return Bluebird.reject(failure);
				});

				return mapper.create(instance)
				.catch(function (data) {
					error = data;
				});
			});

			after(function () {
				MongoDB.Collection.prototype.insertAsync.restore();
				return cleanup();
			});

			it("fails", function () {
				expect(error, "type").to.be.an.instanceOf(Error);
				expect(error.message, "message").to.contain(failure.message);
			});
		});
	});

	describe("creating an existing record", function () {
		var instance = new Test({ name : "testy" });

		var error;

		before(function () {
			return mapper.create(instance)
			.then(function () {
				return mapper.create(instance);
			})
			.catch(function (data) {
				error = data;
			});
		});

		after(function () {
			return cleanup();
		});

		it("fails", function () {
			expect(error, "type").to.be.an.instanceOf(Error);
			expect(error.message, "message").to.contain("duplicate key");
		});
	});

	describe("looking up multiple records", function () {
		describe("with a query that doesn't match", function () {
			var result;

			before(function () {
				return mapper.find(Test, { id : name })
				.then(function (data) {
					result = data;
				});
			});

			it("returns an empty list", function () {
				expect(result, "list").to.deep.equal([]);
			});
		});

		describe("with a query that matches", function () {
			var bar = new Test({ name : "bar" });
			var foo = new Test({ name : "foo" });

			var result;

			before(function () {
				return Bluebird.join(
					mapper.create(bar),
					mapper.create(foo),
					function () {
						return mapper.find(Test, { name : "foo" });
					}
				)
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				return cleanup();
			});

			it("returns all matching records", function () {
				expect(result, "list").to.have.length(1);
				expect(result[0], "record").to.deep.equal(foo);
			});

			it("returns model instances", function () {
				result.forEach(function (record, index) {
					expect(record, "record " + index).to.be.an.instanceOf(Test);
				});
			});
		});

		describe("with a database error", function () {
			var failure = new Error("Simulated failure.");

			var error;

			before(function () {
				Sinon.stub(MongoDB.Cursor.prototype, "toArrayAsync", function () {
					return Bluebird.reject(failure);
				});

				return mapper.find(Test, {})
				.catch(function (data) {
					error = data;
				});
			});

			after(function () {
				MongoDB.Cursor.prototype.toArrayAsync.restore();
			});

			it("fails", function () {
				expect(error, "type").to.be.an.instanceOf(Error);
				expect(error.message, "message").to.contain(failure.message);
			});
		});
	});

	describe("looking up an individual record", function () {
		describe("with a query that doesn't match", function () {
			var result;

			before(function () {
				return mapper.findOne(Test, { id : name })
				.then(function (data) {
					result = data;
				});
			});

			it("returns null", function () {
				expect(result, "result").to.be.null;
			});
		});

		describe("with a query that matches", function () {
			var decoy = new Test({ name : "bar" });

			var result;

			before(function () {
				return Bluebird.join(
					mapper.create(instance),
					mapper.create(decoy),
					function () {
						return mapper.findOne(Test, { name : name });
					}
				)
				.then(function (data) {
					result = data;
				});
			});

			after(function () {
				return cleanup();
			});

			it("returns the matching record", function () {
				expect(result, "result").to.deep.equal(instance);
			});

			it("returns a model instance", function () {
				expect(result, "type").to.be.an.instanceOf(Test);
			});
		});

		describe("with a database error", function () {
			var failure = new Error("Simulated failure.");

			var error;

			before(function () {
				Sinon.stub(MongoDB.Collection.prototype, "findOneAsync", function () {
					return Bluebird.reject(failure);
				});

				return mapper.findOne(Test, {})
				.catch(function (data) {
					error = data;
				});
			});

			after(function () {
				MongoDB.Collection.prototype.findOneAsync.restore();
			});

			it("fails", function () {
				expect(error, "type").to.be.an.instanceOf(Error);
				expect(error.message, "message").to.contain(failure.message);
			});
		});
	});

	describe("updating a non-existant record", function () {
		var error;

		before(function () {
			return mapper.update(instance)
			.catch(function (data) {
				error = data;
			});
		});

		after(function () {
			return cleanup();
		});

		it("fails", function () {
			expect(error, "type").to.be.an.instanceOf(Error);
			expect(error.message, "message").to.contain("does not exist");
		});
	});

	describe("updating an existing record", function () {
		var result;
		var updated;

		before(function () {
			return mapper.create(instance)
			.then(function (data) {
				updated = new Test({ name : data.name, foo : "bar" });
				return mapper.update(updated);
			})
			.then(function (data) {
				result = data;
				updated = new Test({
					name     : updated.name,
					foo      : updated.foo,
					revision : updated.revision + 1
				});
			});
		});

		after(function () {
			return cleanup();
		});

		it("returns the model", function () {
			expect(result, "model").to.deep.equal(updated);
		});

		it("inserts the record in the database with an incremented revision", function () {
			return find("test", { name : name })
			.then(function (results) {
				expect(results, "results").to.deep.equal([ updated ]);
			});
		});
	});

	describe("updating a record with an invalid revision", function () {
		var result;

		before(function () {
			return mapper.create(instance)
			.then(function (data) {
				var updated = new Test(
					_.merge(
						_.clone(data),
						{ revision : data.revision + 1 }
					)
				);
				return mapper.update(updated);
			})
			.catch(function (data) {
				result = data;
			});
		});

		after(function () {
			return cleanup();
		});

		it("throws an error", function () {
			expect(result, "error").to.be.an.instanceOf(Error);
			expect(result.message, "message").to.contain("concurrency");
		});
	});
});
