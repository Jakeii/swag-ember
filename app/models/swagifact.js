import DS from 'ember-data';

export default DS.Model.extend({
  label: DS.attr(),
  x: DS.attr('number'),
  y: DS.attr('number'),
  completed: DS.attr('boolean', { defaultValue: false }),
  swagmap: DS.belongsTo('swagmap')
});
