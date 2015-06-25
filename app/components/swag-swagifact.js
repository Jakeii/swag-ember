import Ember from 'ember';

export default Ember.Component.extend({
  currentUser: Ember.inject.service('current-user'),
  lrs: Ember.inject.service('lrs'),

  tagName: 'li',
  classNames: ['swagifact'],
  classNameBindings: ['completed', 'available'],

  /**
   * Whether this swagifact has been completed
   *
   * @method computed
   *
   * @return {boolean}
   */

  completed: Ember.computed('currentUser.model.completed.[]', function () {
    return this.get('currentUser').hasCompleted(this.get('item'));
  }),

  /**
   * Whether the current user has the skills available to be able to attempt this
   *
   * @method computed
   *
   * @return {boolean}
   */

  available: Ember.computed('item.requires.[]', 'currentUser.model.completed.[]', function () {
    if(this.get('item.requires').length === 0) {
      return true;
    }
    return this.get('item.requires').every( (skill) => {
      return this.get('currentUser').hasSkill(skill);
    });
  }),

  /**
   * Wraps requires with whether current user has that skill
   *
   * @method computed
   *
   * @return {boolean}
   */

  requires: Ember.computed('item.requires.[]', 'currentUser.model.skills.[]', function () {
    return this.get('item.requires').map((skill) => {
      return Ember.Object.create({completed: this.get('currentUser').hasSkill(skill), name: skill.get('name')});
    });
  }),

  /**
  * Wraps provides with whether current user has that skill
   *
   * @method computed
   *
   * @return {boolean}
   */

  provides: Ember.computed('item.provides.[]', 'currentUser.model.skills.[]', function () {
    return this.get('item.provides').map((skill) => {
      return Ember.Object.create({completed: this.get('currentUser').hasSkill(skill), name: skill.get('name')});
    });
  }),

  actions: {
    sendCompleted() {
      this.get('lrs').sendCompleted(this.get('item'));
    }
  },

  /**
   * Computed transform attribute
   *
   * @method transform
   */

  style: Ember.computed('item.x', 'item.y', function() {
    var style = 'transform:translate(';

    style += '' + (this.get('item.x') || 0) + 'px,';
    style += '' + (this.get('item.y') || 0) + 'px);';

    return Ember.String.htmlSafe(style);
  }),


});
