import Ember from 'ember';

export default Ember.Controller.extend({
  currentUser: Ember.inject.service('current-user'),
  index: Ember.inject.controller('index'),
  swagmap: Ember.inject.controller('swagmap'),
  lrs: Ember.inject.service('lrs'),
  actions: {
    logOut: function() {
      this.get('currentUser').logOut();
    },
    sessionAuthenticationSucceded: function() {

    }
  },

  swagmaps: function() {
    return this.store.peekAll('swagmap');
  }.property('index.model', 'swagmap.model')
});
