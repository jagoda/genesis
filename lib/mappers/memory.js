"use strict";
var Bluebird = require("bluebird");
var Model    = require("../model");
var Util     = require("./util");

var _ = require("lodash");

function MemoryMapper () {
	var map = Object.create(null);

	function getCollection (model) {
		if (!(model.prototype instanceof Model)) {
			throw new Error("Model type does not inherit from Model");
		}

		var className  = model.modelName.toLowerCase();
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

		if (collection[identifier].revision !== instance.revision) {
			throw new Error("Destroy failed due to concurrency errors. Please try again.");
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

		if (collection[identifier].revision !== instance.revision) {
			throw new Error("Update failed due to concurrency errors. Please try again.");
		}

		var Constructor = instance.constructor;
		instance = new Constructor(
			_.merge(
				_.clone(instance),
				{ revision : instance.revision + 1 }
			)
		);

		collection[identifier] = instance;
		return instance;
	});
}

module.exports = MemoryMapper;
