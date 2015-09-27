import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  description: DS.attr(),
  provides: DS.hasMany('skill'),
  requires: DS.hasMany('skill'),
  inMap: DS.attr(),
  dependenciesMet: DS.attr(),
  link: DS.attr()
});
