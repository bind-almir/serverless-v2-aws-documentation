'use strict';

function replaceModelRefs(restApiId, cfModel, models) {
    if (!cfModel.Properties || !cfModel.Properties.Schema || Object.keys(cfModel.Properties.Schema).length == 0) {
      return cfModel;
    }

    function replaceRefs(obj) {
        for (let key of Object.keys(obj)) {
            if (key === '$ref') {
                let match;
                if (match = /{{model:\s*([\-\w]+)}}/.exec(obj[key])) {
                    obj[key] = {
                        'Fn::Join': [
                            '/',
                            [
                                'https://apigateway.amazonaws.com/restapis',
                                restApiId,
                                'models',
                                match[1]
                            ]
                        ]
                    };

                    const name = match[1];
                    const model = models[name];
                    if (!model) throw new Error(`unrecognized model: ${name}`);
                    if (model.managed !== false) {
                        if (!cfModel.DependsOn) {
                            cfModel.DependsOn = new Set();
                        }
                        cfModel.DependsOn.add(name + 'Model');
                    }
                }
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                replaceRefs(obj[key]);
            }
        }
    }

    replaceRefs(cfModel.Properties.Schema);
    if (cfModel.DependsOn) {
        cfModel.DependsOn = Array.from(cfModel.DependsOn);
    }
    return cfModel;
}

module.exports = {
  createCfModel: function createCfModel(restApiId, models) {
    return function(model) {

      if (model.managed === false) return null

      let cfModel = {
        Type: 'AWS::ApiGateway::Model',
        Properties: {
          RestApiId: restApiId,
          ContentType: model.contentType,
          Name: model.name,
          Schema: model.schema || {},
        },
      }

      if (model.description) {
        cfModel.Properties.Description = model.description
      }

      return replaceModelRefs(restApiId, cfModel, models)
    }
  },

  addModelDependencies: function addModelDependencies(models, resource, _models) {
    Object.keys(models).forEach(contentType => {
      const name = models[contentType];
      const model = _models[name];
      if (!model) throw new Error(`unrecognized model: ${name}`);
      if (model.managed !== false) resource.DependsOn.add(`${name}Model`);
    });
  },

  addMethodResponses: function addMethodResponses(resource, documentation, models) {
    if (documentation.methodResponses) {
      if (!resource.Properties.MethodResponses) {
        resource.Properties.MethodResponses = [];
      }

      documentation.methodResponses.forEach(response => {
        const statusCode = response.statusCode.toString();
        let _response = resource.Properties.MethodResponses
          .find(originalResponse => originalResponse.StatusCode.toString() === statusCode);

        if (!_response) {
          _response = {
            StatusCode: statusCode,
          };

          if (response.responseHeaders) {
            const methodResponseHeaders = {};
            response.responseHeaders.forEach(header => {
              methodResponseHeaders[`method.response.header.${header.name}`] = true
            });
            _response.ResponseParameters = methodResponseHeaders;
          }

          resource.Properties.MethodResponses.push(_response);
        }

        if (response.responseModels) {
          _response.ResponseModels = response.responseModels;
          this.addModelDependencies(_response.ResponseModels, resource, models);
        }
      });
    }
  },

  addRequestModels: function addRequestModels(resource, documentation, models) {
    if (documentation.requestModels && Object.keys(documentation.requestModels).length > 0) {
      this.addModelDependencies(documentation.requestModels, resource, models);
      resource.Properties.RequestModels = documentation.requestModels;
    }
  }

};
