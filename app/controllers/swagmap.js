import Ember from 'ember';

export default Ember.Controller.extend({
  currentUser: Ember.inject.service('current-user'),
  skills: Ember.computed('model.swagifacts', function() {
    let skills = Ember.A();
    this.get('model.swagifacts').forEach((swagifact) => {
      skills.addObjects(swagifact.get('provides'));
    });
    return skills;
  }),

  allSkillsWanted: Ember.computed('skills.@each.wanted', {
    set(key, value) {
      if ( value === true ) {
        return this.get('skills').setEach('wanted', true);
      }

      this.get('skills').setEach('wanted', false);
    },
    get() {
      if (this.get('skills').every(skill => skill.get('wanted') === true)) return true;
      return false;
    }
  })
});
