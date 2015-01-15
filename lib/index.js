"use strict";
var Model = require("./model");
var Util  = require("util");

var _ = require("lodash");

exports.create = function create (schema, methods, Super) {
	var NewModel = function (options) {
		_.assign(this, methods);
		Model.call(this, schema, options);
	};

	Util.inherits(NewModel, Super || Model);

	NewModel.extend = function (extendedSchema, extendedMethods) {
		var newSchema  = schema.concat(extendedSchema);
		var newMethods = _.merge(_.clone(methods), extendedMethods);

		return create(newSchema, newMethods, NewModel);
	};

	return NewModel;
};

exports.Model = Model;
