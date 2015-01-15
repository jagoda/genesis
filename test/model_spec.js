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

	it("assigns all attributes", function () {
		var model = new Model(schema, options);

		expect(model, "attributes").to.deep.equal(options);
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

		it("enumerates all attributes", function () {
			expect(copy, "attributes").to.deep.equal(options);
		});

		it("does not enumerate methods", function () {
			expect(copy, "methods").not.to.have.property("method");
		});
	});
});
