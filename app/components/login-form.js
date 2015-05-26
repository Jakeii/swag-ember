/* global FB */
import Ember from 'ember';

export default Ember.Component.extend({
  currentUser: Ember.inject.service('current-user'),
  actions: {
    submit: function() {
      // regular email/password
    },
    
    /**
     * Facebook Connect login
     *
     * @method fbLogin
     */
    
    fbLogin: function() {
      this.get('session').authenticate('simple-auth-authenticator:torii', 'facebook-connect').then(() => {
        FB.api('/me', (user) => {
          Ember.run(() => {
            this.set('currentUser.model.email', user.email);
            this.get('currentUser.model').save();
          });
        });
      });
    }
  }
});
