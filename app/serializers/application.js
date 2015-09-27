import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  normalize(model, hash, prop) {
    hash.link = hash.id;
    hash.id = hash.id.split('/').pop();
    hash.name = hash.definition.name['en-US'];
    hash.description = hash.definition.description ? hash.definition.description['en-US'] : '';
    delete hash.definition;

    if(hash.swagifacts) {
      hash.swagifacts = hash.swagifacts.map(function(swagifact) {
        return swagifact.split('/').pop();
      });
    }

    if(hash.requires) {
      hash.requires = hash.requires.map(function(skill) {
        return skill.split('/').pop();
      });
    }

    if(hash.provides) {
      hash.provides = hash.provides.map(function(skill) {
        return skill.split('/').pop();
      });
    }
    return this._super(model, hash, prop);
  },
  normalizeFindManyResponse(store, primaryModelClass, payload, id, requestType) {

    payload.swagmaps = [payload.swagmap];
    delete payload.swagmap;

    return this.super(store, primaryModelClass, payload, id, requestType);
  }
});
