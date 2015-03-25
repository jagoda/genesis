"use strict";
var Bluebird     = require("bluebird");
var Genesis      = require("../../");
var MemoryMapper = require("../../lib/mappers/memory");

var expect = require("chai").expect;

describe("A memory mapper", function () {
	var Test = Genesis.create({ index : "foo" });

	var instance = new Test({ foo : "bar" });

	describe("creating a new record", function () {
		var mapper = new MemoryMapper();

		describe("from an object", function () {
			var instance = Object.create(null);

			var failure;

			before(function () {
				return mapper.create(instance)
				.then(
					function () {
						throw new Error("Should not succeed.");
					},
					function (error) {
						failure = error;
					}
				);
			});

			it("fails", function () {
				expect(failure, "type").to.be.an.instanceOf(Error);
				expect(failure.message, "message").to.contain("Model");
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

				it("returns the model", function () {
					expect(result, "result").to.equal(instance);
				});
			});

			describe("without an index", function () {
				var Test = Genesis.create();

				var instance = new Test();

				var failure;

				before(function () {
					return mapper.create(instance)
					.then(
						function () {
							throw new Error("Should not succeed.");
						},
						function (error) {
							failure = error;
						}
					);
				});

				it("fails", function () {
					expect(failure, "type").to.be.an.instanceOf(Error);
					expect(failure.message, "message").to.contain("index");
				});
			});
		});
	});

	describe("creating an existing record", function () {
		var mapper = new MemoryMapper();

		var failure;

		before(function () {
			return mapper.create(instance)
			.then(function (instance) {
				return mapper.create(instance);
			})
			.then(
				function () {
					throw new Error("Should not succeed.");
				},
				function (error) {
					failure = error;
				}
			);
		});

		it("fails", function () {
			expect(failure, "type").to.be.an.instanceOf(Error);
			expect(failure.message, "message").to.contain("exists");
		});
	});

	describe("looking multiple records", function () {
		describe("with a query that doesn't match", function () {
			var mapper = new MemoryMapper();

			var Test = Genesis.create();

			var result;

			before(function () {
				return mapper.find(Test, { id : "foo" })
				.then(function (data) {
					result = data;
				});
			});

			it("returns an empty list", function () {
				expect(result, "list").to.have.length(0);
			});
		});

		describe("with a query that matches", function () {
			var mapper = new MemoryMapper();

			var Test = Genesis.create({ index : "name" });

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

			it("returns all matching records", function () {
				expect(result, "list").to.have.length(1);
				expect(result[0].name, "name").to.equal("foo");
			});

			it("returns model instances", function () {
				result.forEach(function (instance) {
					expect(instance, "type").to.be.an.instanceOf(Test);
				});
			});
		});

		describe("without passing a model type", function () {
			var mapper = new MemoryMapper();

			var result;

			before(function () {
				return mapper.find({ name : "foo" })
				.catch(function (err) {
					result = err;
				});
			});

			it("throws a useful error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "message").to.match(/model type/i);
			});
		});
	});

	describe("looking up an individual record", function () {
		var mapper = new MemoryMapper();

		var Test = Genesis.create({ index : "name" });

		var instance = new Test({ name : "foo" });

		before(function () {
			return mapper.create(instance);
		});

		describe("with a query that doesn't match", function () {
			var result;

			before(function () {
				return mapper.findOne(Test, { name : "bar" })
				.then(function (data) {
					result = data;
				});
			});

			it("returns null", function () {
				expect(result, "result").to.be.null;
			});
		});

		describe("with a query that matches", function () {
			var result;

			before(function () {
				return mapper.findOne(Test, { name : "foo" })
				.then(function (data) {
					result = data;
				});
			});

			it("returns the matching record", function () {
				expect(result, "result").to.exist;
				expect(result.name, "name").to.equal("foo");
			});

			it("returns a model instance", function () {
				expect(result, "type").to.be.an.instanceOf(Test);
			});
		});

		describe("without passing a model type", function () {
			var result;

			before(function () {
				return mapper.findOne({ name : "foo" })
				.catch(function (err) {
					result = err;
				});
			});

			it("throws a useful error", function () {
				expect(result, "error").to.be.an.instanceOf(Error);
				expect(result.message, "message").to.match(/model type/i);
			});
		});
	});

	describe("updating a non-existant record", function () {
		var mapper = new MemoryMapper();

		var Test = Genesis.create({ index : "name" });

		var instance = new Test({ name : "foo" });

		var failure;

		before(function () {
			return mapper.update(instance)
			.then(
				function () {
					throw new Error("Should not succeed.");
				},
				function (error) {
					failure = error;
				}
			);
		});

		it("fails", function () {
			expect(failure, "type").to.be.an.instanceOf(Error);
			expect(failure.message, "message").to.contain("does not exist");
		});
	});

	describe("updating an existing record", function () {
		var mapper = new MemoryMapper();

		var Test = Genesis.create({ index : "name" });

		var instance = new Test({ age : 10, name : "foo" });

		before(function () {
			return mapper.create(instance);
		});

		describe("with an object", function () {
			var newInstance = { age : 13, name : "foo" };

			var failure;

			before(function () {
				return mapper.update(newInstance)
				.then(
					function () {
						throw new Error("Should not succeed.");
					},
					function (error) {
						failure = error;
					}
				);
			});

			it("fails", function () {
				expect(failure, "type").to.be.an.instanceOf(Error);
				expect(failure.message, "message").to.contain("Model");
			});
		});

		describe("with a model", function () {
			var newInstance = new Test({ age : 13, name : "foo" });

			var result;
			var stored;

			before(function () {
				return mapper.update(newInstance)
				.then(function (data) {
					result = data;
					return mapper.findOne(Test, { name : "foo" });
				})
				.then(function (data) {
					stored = data;
				});
			});

			it("returns the model", function () {
				expect(result, "result").to.equal(newInstance);
			});

			it("modifies the stored state", function () {
				expect(stored, "stored").to.deep.equal(newInstance);
			});
		});
	});

	describe("destroying a non-existant record", function () {
		var mapper = new MemoryMapper();

		var Test = Genesis.create({ index : "name" });

		var instance = new Test({ name : "foo" });

		var failure;

		before(function () {
			return mapper.destroy(instance)
			.then(
				function () {
					throw new Error("Should not succeed.");
				},
				function (error) {
					failure = error;
				}
			);
		});

		it("fails", function () {
			expect(failure, "type").to.be.an.instanceOf(Error);
			expect(failure.message, "message").to.contain("does not exist");
		});
	});

	describe("destroying an existing record", function () {
		var mapper = new MemoryMapper();

		var Test = Genesis.create({ index : "name" });

		var instance = new Test({ name : "foo" });

		before(function () {
			return mapper.create(instance);
		});

		describe("with an object", function () {
			var instance = { name : "foo" };

			var failure;

			before(function () {
				return mapper.destroy(instance)
				.then(
					function () {
						throw new Error("Should not succeed.");
					},
					function (error) {
						failure = error;
					}
				);
			});

			it("fails", function () {
				expect(failure, "type").to.be.an.instanceOf(Error);
				expect(failure.message, "message").to.contain("Model");
			});
		});

		describe("with a model", function () {
			var result;
			var stored;

			before(function () {
				return mapper.destroy(instance)
				.then(function (data) {
					result = data;
					return mapper.findOne(Test, { name : "foo" });
				})
				.then(function (data) {
					stored = data;
				});
			});

			it("returns the model", function () {
				expect(result, "result").to.equal(instance);
			});

			it("removes the record from the data store", function () {
				expect(stored, "stored").to.be.null;
			});
		});
	});
});
