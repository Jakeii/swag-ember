import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  wanted: DS.attr({defaultValue: true})
});
