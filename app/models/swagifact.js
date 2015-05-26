import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr(),
  x: DS.attr(),
  y: DS.attr(),
  completed: DS.attr('boolean', { defaultValue: false }),
  swagmap: DS.belongsTo('swagmap')
});
