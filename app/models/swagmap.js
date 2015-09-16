import DS from 'ember-data';

var swagmap = DS.Model.extend({
  name: DS.attr(),
  description: DS.attr(),
  swagifacts: DS.hasMany('swagifact')
});

export default swagmap;
