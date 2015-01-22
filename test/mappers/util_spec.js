"use strict";
var Genesis = require("../../");
var Util    = require("../../lib/mappers/util");

var expect = require("chai").expect;

describe("The mapper helper", function () {
	describe("validating a model instance", function () {
		it("accepts an indexed model", function () {
			var Test     = Genesis.create("test", { index : "name" });
			var instance = new Test({ name : "foo" });

			Util.assertMapperModel(instance);
		});

		it("rejects a non-indexed model", function () {
			var Test     = Genesis.create("test");
			var instance = new Test();

			expect(function () {
				Util.assertMapperModel(instance);
			}).to.throw("index");
		});

		it("rejects a plain object", function () {
			expect(function () {
				Util.assertMapperModel({});
			}).to.throw("Model");
		});
	});
});
