import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  primaryKey: '_id',
  extractSingle: function(store, type, payload, id) {
    var hash = payload;
    var modelName = type.typeKey;

    payload = {};
    payload[modelName] = hash;
    var skills = [];

    if(hash.swagifacts) {
      payload.swagifacts = hash.swagifacts;
      hash.swagifacts = payload[modelName].swagifacts.map(function(swagifact) {

        if(swagifact.provides) {
          skills = skills.concat(swagifact.provides);
          swagifact.provides = swagifact.provides.map(function(provide) {
            return provide._id;
          });
        }

        if(swagifact.requires) {
          skills = skills.concat(swagifact.requires);
          swagifact.requires = swagifact.requires.map(function(require) {
            return require._id;
          });
        }
        return swagifact._id;
      });
    }

    if(hash.provides) {
      skills.push(hash.provides);
      hash.provides = payload[modelName].provides.map(function(provide) {
        return provide._id;
      });
    }

    if(hash.requires) {
      skills.push(hash.requires);
      hash.requires = payload[modelName].requires.map(function(require) {
        return require._id;
      });
    }

    payload.skills = skills;

    return this._super(store, type, payload, id);
  },
  extractArray: function(store, type, payload) {
    var modelName = type.typeKey;
    var skills = [];
    var swagifacts = [];

    payload = [payload];

    var hash = payload.map(function (item) {
      item.id = item._id;
      item.xAPIID = item.xAPI.id;
      item.name = item.xAPI.definition.name['en-US'];
      item.description = (item.xAPI.definition.description) ? item.xAPI.definition.description['en-US'] : '';
      if(item.swagifacts) {
        swagifacts = swagifacts.concat(item.swagifacts);
        item.swagifacts = item.swagifacts.map(function(swagifact) {
          if(swagifact.provides) {
            skills = skills.concat(swagifact.provides);
            swagifact.provides = swagifact.provides.map(function(provide) {
              return provide._id;
            });
          }

          if(swagifact.requires) {
            skills = skills.concat(swagifact.requires);
            swagifact.requires = swagifact.requires.map(function(require) {
              return require._id;
            });
          }
          return swagifact._id;
        });
      }

      if(item.provides) {
        skills.push(item.provides);
        item.provides = item.provides.map(function(provide) {
          return provide._id;
        });
      }

      if(item.requires) {
        skills.push(item.requires);
        item.requires = item.requires.map(function(require) {
          return require._id;
        });
      }

      return item;
    });

    payload = {};
    payload[modelName + 's'] = hash;
    payload.skills = skills;
    payload.swagifacts = swagifacts;

    return this._super(store, type, payload);
  },
  normalize: function(type, hash) {
    hash.id = hash._id;
    hash.xAPIID = hash.xAPI.id;
    hash.name = hash.xAPI.definition.name['en-US'];
    hash.description = (hash.xAPI.definition.description) ? hash.xAPI.definition.description['en-US'] : '';
    return hash;
  }
});
