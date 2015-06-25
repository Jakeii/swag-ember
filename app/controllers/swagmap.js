import Ember from 'ember';

export default Ember.Controller.extend({
  currentUser: Ember.inject.service('current-user'),
  verticalSeperation: 150,
  curviness: 250,
  mapLength: 4
});
