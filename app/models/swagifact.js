import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  description: DS.attr(),
  xAPIID: DS.attr(),
  x: DS.attr('number'),
  y: DS.attr('number'),
  provides: DS.hasMany('skill'),
  requires: DS.hasMany('skill'),
  swagmap: DS.belongsTo('swagmap')
});
