"use strict";
var Joi = require("joi");

var _ = require("lodash");

function Model (schema, options) {
	var validated = Joi.validate(options, schema);

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
