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

  agent: Ember.computed('currentUser.model.content.email', function() {
    return new TinCan.Agent({
      'mbox': 'mailto:' + (ENV.APP.agentEmailOverride) ? ENV.APP.agentEmailOverride : this.get('currentUser.model.content.email')
    });
  }),

  /**
   * tell LRS that a swagifact has been completed
   *
   * @method sendCompleted
   *
   */

  sendCompleted(swagifact) {

    tincan.sendStatement({
      verb: {
        id: 'http://adlnet.gov/expapi/verbs/completed'
      },
      actor: this.get('agent'),
      target: {
        id: swagifact.get('xAPIID')
      }
    }, (res) => {
      if(res.err) return;

      this.get('currentUser.model.completed').addObject(swagifact);
      this.get('currentUser.model.skills').addObjects(swagifact.get('provides'));
      this.get('currentUser.model').save();

    });
  },

  /**
   * find out if swagifact has been completed, updates model store if it has
   *
   * @method syncComplete
   *
   */

  syncComplete(swagifact) {
    new Ember.RSVP.Promise((resolve, reject) => {
      var activity = new TinCan.Activity({
        "id": swagifact.get('xAPIID')
      });

      this.get('tincan').getStatements({
        params: {
          "agent": this.get('lrs.agent'),
          "activity": activity
        },
        callback: (err, res) => {
          if(err !== null) return reject();
          res.statements.forEach((statement) => {
            if(statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
              this.get('currentUser.model.completed').addObject(swagifact);
              this.get('currentUser.model.skills').addObjects(swagifact.get('provides'));
            }
          });
          this.get('currentUser.model').save();
          resolve();
        }
      });
    });
  }
});
