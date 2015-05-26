import Ember from 'ember';
import User from '../models/user';

export default Ember.Service.extend({
  model: User.create(),

  init: function() {
    
  }
});
