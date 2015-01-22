"use strict";
var Bluebird = require("bluebird");
var Util     = require("./util");

var _ = require("lodash");

function MemoryMapper () {
	var map = Object.create(null);

	function getCollection (model) {
		if (!(model.prototype instanceof Model)) {
			throw new Error("Model type does not inherit from Model");
		}

		var className  = model.name.toLowerCase();
		var collection = map[className];

		if (!collection) {
			collection = map[className] = Object.create(null);
		}

		return collection;
	}

	function getIdentifier (instance) {
		var index = instance.constructor.index;

		return instance[index];
	}

	this.create = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		var collection = getCollection(instance.constructor);
		var identifier = getIdentifier(instance);

		if (collection[identifier]) {
			throw new Error("Record '" + identifier + "' already exists.");
		}

		collection[identifier] = instance;
		return instance;
	});

	this.destroy = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		var collection = getCollection(instance.constructor);
		var identifier = getIdentifier(instance);

		if (!collection[identifier]) {
			throw new Error("Record '" + identifier + "' does not exist.");
		}

		delete collection[identifier];
		return instance;
	});

	this.find = Bluebird.method(function (model, query) {
		var collection = getCollection(model);

		return _.where(collection, query);
	});

	this.findOne = Bluebird.method(function (model, query) {
		var collection = getCollection(model);

		return _.find(collection, query) || null;
	});

	this.update = Bluebird.method(function (instance) {
		Util.assertMapperModel(instance);

		var collection = getCollection(instance.constructor);
		var identifier = getIdentifier(instance);

		if (!collection[identifier]) {
			throw new Error("Record '" + identifier + "' does not exist.");
		}

		collection[identifier] = instance;
		return instance;
	});
}

module.exports = MemoryMapper;
