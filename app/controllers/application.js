import Ember from 'ember';

export default Ember.Controller.extend({
  currentUser: Ember.inject.service('current-user'),
  lrs: Ember.inject.service('lrs'),
  init() {
    this.get('currentUser');
  },
  actions: {
    logOut: function() {
      this.get('session').invalidate();
      this.set('session.isAuthenticated', false);
      this.set('currentUser.model.email', null);
      this.transitionToRoute('index');
    },
    sessionAuthenticationSucceded: function() {

    }
  }
});
