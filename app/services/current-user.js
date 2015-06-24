import Ember from 'ember';

export default Ember.Service.extend({
  /**
   * initializes current user, loaded from localstorage
   *
   * @method init
   *
   */

  init() {
    var store = this.container.lookup('service:store');
    this.set('store', store);
    this.set('session', this.container.lookup('simple-auth-session:main'));

    this.store.find('user', 'current').then((user) => {
       this.set('model', user);
    }, function(err) {
      console.log(err);
    });
  },

  /**
   * creates a localstorage session for the email from the FB lgin
   *
   * @method login
   *
   */

  login(email) {
    var model = this.store.createRecord('user', {
      id: 'current',
      email: email
    });
    model.save().then((user) => {
      this.set('model', user);
    });
  },

  /**
   * Deletes user session from localstorage
   *
   * @method logOut
   *
   * @return {[type]} [description]
   */

  logOut() {
    this.get('model').destroyRecord().then(() => {
      this.get('session').invalidate();
    });
  },

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
