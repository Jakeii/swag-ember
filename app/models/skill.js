import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  wanted: DS.attr({defaultValue: true}),
  need: DS.attr({defaultValue: true}),
  inMap: DS.attr({defaultValue: false}),
  forcedInMap: function() {
    return !this.get('wanted') && this.get('inMap');
  }.property('wanted', 'inMap')
});
