import Ember from 'ember';
import User from '../models/user';

export default Ember.Service.extend({
  model: User.create(),

  init() {
    if(this.get('model.email')) {
      this.container.lookup('simple-auth-session:main').set('isAuthenticated', true);
    }
  }
});
