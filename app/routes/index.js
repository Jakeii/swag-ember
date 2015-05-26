import Ember from 'ember';

export default Ember.Route.extend({
  actions: {
    sessionAuthenticationSucceeded: function() {
      this.transitionTo('swagmaps');
    }
  }
});
