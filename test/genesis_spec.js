"use strict";
var Genesis      = require("..");
var Joi          = require("joi");
var MemoryMapper = require("../lib/mappers/memory");
var Model        = require("../lib/model");
var _            = require("lodash");

var expect = require("chai").expect;

describe("The genesis library", function () {
	it("exports the model class", function () {
		expect(Genesis, "model").to.have.property("Model", Model);
	});

	it("exports the memory mapper", function () {
		expect(Genesis, "memory mapper").to.have.property("MemoryMapper", MemoryMapper);
	});

	describe("creating a basic model", function () {
		var NAME = "test";

		var Test = Genesis.create(NAME);

		it("returns a constructor", function () {
			expect(Test, "type").to.be.a("function");
		});

		it("includes a name", function () {
			expect(Test, "name").to.have.property("modelName", NAME);
		});
	});

	describe("creating an extended model", function () {
		var index = "key";

		var methods = {
			method : function () {}
		};

		var schema = Joi.object().keys({
			key : Joi.string().valid("value").required()
		}).required();

		var Test = Genesis.create(
			"test",
			{
				index   : index,
				methods : methods,
				schema  : schema
			}
		);

		it("returns a constructor", function () {
			expect(Test, "type").to.be.a("function");
		});

		it("describes the index", function () {
			expect(Test, "index").to.have.property("index", index);
		});

		describe("and then instantiating it", function () {
			var options = { key : "value" };
			var expectedOptions = _.assign(_.clone(options), { revision : 0 });

			var instance = new Test(options);

			it("returns a model instance", function () {
				expect(instance, "type").to.be.an.instanceOf(Model);
				expect(instance, "subtype").to.be.an.instanceOf(Test);
			});

			it("assigns all attributes", function () {
				expect(instance, "attributes").to.deep.equal(expectedOptions);
			});

			it("assigns all methods", function () {
				expect(instance, "method").to.have.property("method", methods.method);
			});
		});

		describe("then extending it (default index)", function () {
			var extendedMethods = {
				extended : function () {}
			};

			var extendedSchema = Joi.object().keys({
				foo : Joi.string().valid("bar").required()
			}).required();

			var Subtest = Test.extend(
				"subtest",
				{
					methods : extendedMethods,
					schema  : extendedSchema
				}
			);

			it("returns a constructor", function () {
				expect(Subtest, "type").to.be.a("function");
			});

			it("describes the index", function () {
				expect(Subtest, "index").to.have.property("index", index);
			});

			describe("then instantiating it", function () {
				var options = {
					foo : "bar",
					key : "value"
				};
				var expectedOptions = _.assign(_.clone(options), { revision : 0 });

				var instance = new Subtest(options);

				it("returns a model instance", function () {
					expect(instance, "type").to.be.an.instanceOf(Model);
					expect(instance, "subtype").to.be.an.instanceOf(Test);
					expect(instance, "subsubtype").to.be.an.instanceOf(Subtest);
				});

				it("assigns all attributes", function () {
					expect(instance, "attributes").to.deep.equal(expectedOptions);
				});

				it("assigns all methods", function () {
					expect(instance, "method").to.have.property("method", methods.method);

					expect(instance, "extended")
					.to.have.property("extended", extendedMethods.extended);
				});
			});
		});

		describe("then extending it (custom index)", function () {
			var extendedSchema = Joi.object().keys({
				foo : Joi.string().valid("bar").required()
			}).required();

			var index = "foo";

			var Subtest = Test.extend(
				"subtest",
				{
					index  : index,
					schema : extendedSchema
				}
			);

			it("returns a constructor", function () {
				expect(Subtest, "type").to.be.a("function");
			});

			it("describes the index", function () {
				expect(Subtest, "index").to.have.property("index", index);
			});

			describe("then instantiating it", function () {
				var options = {
					foo : "bar",
					key : "value"
				};
				var expectedOptions = _.assign(_.clone(options), { revision : 0 });

				var instance = new Subtest(options);

				it("returns a model instance", function () {
					expect(instance, "type").to.be.an.instanceOf(Model);
					expect(instance, "subtype").to.be.an.instanceOf(Test);
					expect(instance, "subsubtype").to.be.an.instanceOf(Subtest);
				});

				it("assigns all attributes", function () {
					expect(instance, "attributes").to.deep.equal(expectedOptions);
				});

				it("assigns all methods", function () {
					expect(instance, "method").to.have.property("method", methods.method);
				});
			});
		});

		describe("then extending it (default attributes)", function () {
			var Subtest = Test.extend("subtest");

			it("returns a constructor", function () {
				expect(Subtest, "type").to.be.a("function");
			});

			it("describes the index", function () {
				expect(Subtest, "index").to.have.property("index", index);
			});

			describe("then instantiating it", function () {
				var options = {
					key : "value"
				};
				var expectedOptions = _.assign(_.clone(options), { revision : 0 });

				var instance = new Subtest(options);

				it("returns a model instance", function () {
					expect(instance, "type").to.be.an.instanceOf(Model);
					expect(instance, "subtype").to.be.an.instanceOf(Test);
					expect(instance, "subsubtype").to.be.an.instanceOf(Subtest);
				});

				it("assigns all attributes", function () {
					expect(instance, "attributes").to.deep.equal(expectedOptions);
				});

				it("assigns all methods", function () {
					expect(instance, "method").to.have.property("method", methods.method);
				});
			});
		});
	});
});
