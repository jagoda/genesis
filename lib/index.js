"use strict";
var Joi   = require("joi");
var Model = require("./model");
var Util  = require("util");

var _ = require("lodash");

var defaults = {
	index   : null,
	methods : {},
	parent  : Model,
	schema  : Joi.object().unknown()
};

function prepareOptions (options) {
	options = options ? _.clone(options) : {};
	options = _.defaults(options, defaults);
	return options;
}

exports.create = function create (name, options) {
	options = prepareOptions(options);

	var NewModel = function (attributes) {
		_.assign(this, options.methods);
		Model.call(this, options.schema, attributes);
	};

	Util.inherits(NewModel, options.parent);

	NewModel.index     = options.index;
	NewModel.modelName = name;

	NewModel.extend = function (name, newOptions) {
		newOptions = prepareOptions(newOptions);

		var newSchema  = options.schema.concat(newOptions.schema);
		var newMethods = _.merge(_.clone(options.methods), newOptions.methods);

		return create(
			name,
			{
				index   : newOptions.index || options.index,
				methods : newMethods,
				schema  : newSchema,
				parent  : NewModel
			}
		);
	};

	return NewModel;
};

exports.Model = Model;
