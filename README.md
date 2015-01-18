genesis
=======

> A simple library for creating data models in Node.

	npm install genesis

## Basics

### Genesis.create (options)

Creates a new `Model` class.

 + **options** -- A hash of options describing a new data model.

**Options:**
 + **index** -- The name of the attribute that should be used as the unique
   identifier of an instance. Defaults to `null`.
 + **methods** -- A hash of methods to add to instances. Defaults to `{}`.
 + **parent** -- The parent class that the new model should extend. Defaults to
   `Model`.
 + **schema** -- A [Joi][joi] schema describing acceptable model attributes.
   Defaults to `Joi.any()`.

**Returns** a constructor function.

### Constructor.extend (options)

 + **options** -- A hash of options describing additional attributes for the new
   data model.

**Options:**
 + **index** -- The name of the attribute that should be used as the unique
   identifier of an instance. Defaults to the parent model's index.
 + **methods** -- A hash of additional methods to add to instances. This hash is
   merged with the methods from the parent model.
 + **schema** -- A [Joi][joi] schema describing acceptable model attributes.
   This schema is merged with the parent model's schema.

## For Advanced Uses

### Model (schema, attributes)

Creates a new model instance. A model is an immutable object with a pre-defined
set of attributes and methods.

 + **schema** -- A [Joi][joi] schema describing the acceptable attributes.
 + **options** -- A hash of attributes to assign to the instance.

**Returns** a new model instance.

## Mappers

Mappers implement persistence strategies for models and can be used to store
and retrieve model instances. All mappers follow the some API and all models
that are used with mappers must define an `index`.

### The Mapper API

#### mapper.create (instance)

Persists a new model instance. An error is thrown if the instance already exists
in the underlying data store.

 + **instance** -- A `Model` instance to persist.

**Returns** the `instance`.

#### mapper.destroy (instance)

Removes a model instance from the data store. An error is thrown if the instance
has not been persisted in the data store.

 + **instance** -- A `Model` instance to persist.

**Returns** the `instance`.

#### mapper.find (Constructor, query)

Finds all persisted instances of `Constructor` that matches the `query` object.

 + **Constructor** -- A `Model` constructor function indicating the type of
   instance that should be retrieved.
 + **query** -- A hash of attributes used to match persisted instances.

**Returns** a list of matching instances.

#### mapper.findOne (Constructor, query)

Finds one matching instance of `Constructor` that matches the `query` object.

 + **Constructor** -- A `Model` constructor function indicating the type of
   instance that should be retrived.
 + **query** -- A hash of attributes used to match persisted instances.

**Returns** a single matching instance.

#### mapper.update (instance)

Persists a new version of a previously persisted model instance. An error is
thrown if a previous version is not in the data store.

 + **instance** -- The new `Model` instance.

**Returns** the `instance`.

### Mapper Implementations

`Genesis` comes with the following mapper implementations:

#### MemoryMapper ()

The `MemoryMapper` stores all instances in memory.

[joi]: https://github.com/hapijs/joi "Joi"
