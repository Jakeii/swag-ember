import Ember from 'ember';
import ENV from '../config/environment';

var tincan = new TinCan({
  recordStores: [{
    endpoint: ENV.APP.xAPIEndpoint,
    username: ENV.APP.xAPIUsername,
    password: ENV.APP.xAPIPassword,
    allowFail: false
  }]
});

/**
 * Serivce that can be injected into any object that needs acces to the LRS
 *
 * @extends Ember.Service
 */

export default Ember.Service.extend({
  currentUser: Ember.inject.service('current-user'),
  tincan: tincan,

  /**
   * agent is bound to the current logged in user
   *
   * @method agent
   */

  agent: Ember.computed('currentUser.model.email', function() {
    return new TinCan.Agent({
      'mbox': 'mailto:' + (ENV.APP.agentEmailOverride ? ENV.APP.agentEmailOverride : this.get('currentUser.model.email'))
    });
  })
});
