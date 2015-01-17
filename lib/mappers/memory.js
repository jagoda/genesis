"use strict";
var Bluebird = require("bluebird");
var Joi      = require("joi");
var Model    = require("../model");

var _ = require("lodash");

var schema = Joi.object().type(Model);

function MemoryMapper () {
	var map = Object.create(null);

	function assertMapperModel (instance) {
		Joi.assert(instance, schema);

		if (!instance.constructor.index) {
			throw new Error("Cannot map models without an index.");
		}
	}

	function getCollection (model) {
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
		assertMapperModel(instance);

		var collection = getCollection(instance.constructor);
		var identifier = getIdentifier(instance);

		if (collection[identifier]) {
			throw new Error("Record '" + identifier + "' already exists.");
		}

		collection[identifier] = instance;
		return instance;
	});

	this.destroy = Bluebird.method(function (instance) {
		assertMapperModel(instance);

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
		assertMapperModel(instance);

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
