"use strict";
var Genesis = require("..");
var Joi     = require("joi");
var Model   = require("../lib/model");

var expect = require("chai").expect;

describe("The genesis library", function () {
	it("exports the model class", function () {
		expect(Genesis, "model").to.have.property("Model", Model);
	});

	describe("creating a model", function () {
		var methods = {
			method : function () {}
		};

		var schema = Joi.object().keys({
			key : Joi.string().valid("value").required()
		}).required();

		var Test = Genesis.create(schema, methods);

		it("returns a constructor", function () {
			expect(Test, "type").to.be.a("function");
		});

		describe("and then instantiating it", function () {
			var options = { key : "value" };

			var instance = new Test(options);

			it("returns a model instance", function () {
				expect(instance, "type").to.be.an.instanceOf(Model);
				expect(instance, "subtype").to.be.an.instanceOf(Test);
			});

			it("assigns all attributes", function () {
				expect(instance, "attributes").to.deep.equal(options);
			});

			it("assigns all methods", function () {
				expect(instance, "method").to.have.property("method", methods.method);
			});
		});

		describe("then extending it", function () {
			var extendedMethods = {
				extended : function () {}
			};

			var extendedSchema = Joi.object().keys({
				foo : Joi.string().valid("bar").required()
			}).required();

			var Subtest = Test.extend(extendedSchema, extendedMethods);

			it("returns a constructor", function () {
				expect(Subtest, "type").to.be.a("function");
			});

			describe("then instantiating it", function () {
				var options = {
					foo : "bar",
					key : "value"
				};

				var instance = new Subtest(options);

				it("returns a model instance", function () {
					expect(instance, "type").to.be.an.instanceOf(Model);
					expect(instance, "subtype").to.be.an.instanceOf(Test);
					expect(instance, "subsubtype").to.be.an.instanceOf(Subtest);
				});

				it("assigns all attributes", function () {
					expect(instance, "attributes").to.deep.equal(options);
				});

				it("assigns all methods", function () {
					expect(instance, "method").to.have.property("method", methods.method);

					expect(instance, "extended")
					.to.have.property("extended", extendedMethods.extended);
				});
			});
		});
	});
});
