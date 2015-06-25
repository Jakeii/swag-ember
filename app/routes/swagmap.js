import Ember from 'ember';

export default Ember.Route.extend({
  currentUser: Ember.inject.service('current-user'),
  lrs: Ember.inject.service('lrs'),

  afterModel(model) {
    // contact lrs
    return Ember.RSVP.all(model.get('swagifacts').map((swagifact) => {
      return this.checkIfComplete(swagifact);
    }));
  },

  /**
   * Contact the LRS and find out if the swagifacts have been competed
   *
   * @method checkIfComplete
   * @param  Model        model   swagifact model
   */

  checkIfComplete(swagifact) {
    return this.get('lrs').syncComplete(swagifact);
  }
});
