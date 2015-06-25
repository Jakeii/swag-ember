import DS from 'ember-data';

export default DS.Model.extend({
  email: DS.attr(),
  completed: DS.hasMany('swagifact'),
  skills: DS.hasMany('skill')
});
