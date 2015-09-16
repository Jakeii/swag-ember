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
});
