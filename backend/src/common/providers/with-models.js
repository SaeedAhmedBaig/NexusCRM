const { getModelToken } = require('@nestjs/mongoose');

/**
 * NestJS + Babel JS cannot use @InjectModel on class properties.
 * This factory wires Mongoose models into service instances explicitly.
 */
function withModels(ServiceClass, modelMap, otherInject = []) {
  const modelProps = Object.keys(modelMap);
  const modelTokens = modelProps.map((key) => getModelToken(modelMap[key]));
  const otherTokens = otherInject.map((dep) => dep.token);

  return {
    provide: ServiceClass,
    useFactory: (...args) => {
      const instance = new ServiceClass(...args.slice(modelProps.length));
      modelProps.forEach((prop, index) => {
        instance[prop] = args[index];
      });
      return instance;
    },
    inject: [...modelTokens, ...otherTokens],
  };
}

module.exports = { withModels };
