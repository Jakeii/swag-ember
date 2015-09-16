import Ember from 'ember';

export default Ember.Service.extend({
  /**
   * initializes current user, loaded from localstorage
   *
   * @method init
   *
   */

  init() {
    this.set('email', window.localStorage.getItem('LRS:email'));
  },

  saveEmail: Ember.observer('email', function() {
    if(window.localStorage) window.localStorage.setItem('LRS:email', this.get('email'));
  }),

  /**
   * helper to determine if a user has compelted a given swagifact
   *
   * @method hasCompleted
   *
   */

  hasCompleted(swagifact) {
    if(this.get('model')) {
      return !!this.get('model.completed').findBy('id', swagifact.get('id'));
    }
    return false;
  },

  /**
   * helper to determine if a user has compelted a given skill
   *
   * @method hasCompleted
   *
   */

  hasSkill(skill) {
    if(this.get('model')) {
      return !!this.get('model.skills').findBy('id', skill.get('id'));
    }
    return false;
  },
});
