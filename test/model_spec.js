"use strict";
var Joi   = require("joi");
var Model = require("../lib/model");

var expect = require("chai").expect;
var _      = require("lodash");

describe("A model", function () {
	var options = {
		key : "value"
	};

	var schema = Joi.object().keys({
		key : Joi.string().valid("value").required()
	}).required();

	it("is immutable", function () {
		var model = new Model(Joi.object(), {});

		expect(Object.isFrozen(model), "frozen").to.be.true;
	});

	it("assigns all attributes and adds revision", function () {
		var model = new Model(schema, options);

		var expectedOptions = _.merge(_.clone(options), { revision : 0 });

		expect(model, "attributes").to.deep.equal(expectedOptions);
	});

	it("rejects options not consistent with the schema", function () {
		var model;

		expect(function () {
			var invalid = _.clone(options);

			invalid.value = "foo";
			model         = new Model(schema, invalid);
		}).to.throw("value is not allowed");
	});

	describe("with methods", function () {
		var object = {
			method : function () {}
		};

		var copy;

		Model.call(object, schema, options);
		copy = _.clone(object);

		var expectedOptions = _.merge(_.clone(options), { revision : 0 });

		it("enumerates all attributes", function () {
			expect(copy, "attributes").to.deep.equal(expectedOptions);
		});

		it("does not enumerate methods", function () {
			expect(copy, "methods").not.to.have.property("method");
		});
	});

	describe("with an invalid revision attribute", function () {
		var result;

		before(function () {
			try {
				var model = new Model(schema, { key : "value", revision : "invalid" });
				result = model;
			}
			catch (error) {
				result = error;
			}
		});

		it("throws an error", function () {
			expect(result, "error").to.be.an.instanceOf(Error);
			expect(result.message, "error message").to.contain("revision");
		});
	});
});
