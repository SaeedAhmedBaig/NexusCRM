require('reflect-metadata');

function defineParamTypes(target, ...types) {
  Reflect.defineMetadata('design:paramtypes', types, target);
}

module.exports = { defineParamTypes };
