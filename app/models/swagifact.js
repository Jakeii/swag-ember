import DS from 'ember-data';

export default DS.Model.extend({
  name: DS.attr(),
  description: DS.attr(),
  provides: DS.hasMany('skill'),
  requires: DS.hasMany('skill'),
  inMap: DS.attr({defaultValue: false}),
  dependenciesMet: DS.attr({defaultValue: true}),
  link: DS.attr(),

  containsWantedSkills: function() {
    return this.get('provides').any(skill => skill.get('wanted'));
  }.property('provides'),

  addedToMap: function() {
    if(this.get('inMap') === true) {
      return this.get('provides').setEach('inMap', true);
    }
    return this.get('provides').setEach('inMap', false);
  }.observes('inMap')
});
