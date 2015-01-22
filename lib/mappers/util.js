"use strict";
var Joi   = require("joi");
var Model = require("../model");

var modelSchema = Joi.object().type(Model);

exports.assertMapperModel = function (instance) {
	Joi.assert(instance, modelSchema);

	if (!instance.constructor.index) {
		throw new Error("Cannot map models without an index.");
	}
};
