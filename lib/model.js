"use strict";
var Joi = require("joi");

var _ = require("lodash");

var MODEL_SCHEMA = Joi.object().keys({
	revision : Joi.number().integer().min(0)
});

function Model (schema, options) {
	// Default revision value
	if (!("revision" in options)) {
		options.revision = 0;
	}

	var modelSchema = schema.concat(MODEL_SCHEMA);
	var validated = Joi.validate(options, modelSchema, { presence : "required" });

	if (validated.error) {
		throw validated.error;
	}

	_.each(
		_.functions(this),
		function (method) {
			var descriptor = Object.getOwnPropertyDescriptor(this, method);

			descriptor.enumerable = false;
			Object.defineProperty(this, method, descriptor);
		},
		this
	);

	_.assign(this, validated.value);
	Object.freeze(this);
}

module.exports = Model;
