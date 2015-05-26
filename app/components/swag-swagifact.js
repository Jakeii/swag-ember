import Ember from 'ember';

export default Ember.Component.extend({
  tagName: 'g',
  classNames: ['swag-map-item'],

  attributeBindings: ['transform'],

  /**
   * Computed transform attribute, SVG x/y doesn't work on `g` elements apparently
   *
   * @method transform
   */
  
  transform: Ember.computed('item.x', 'item.y', function() {
    var style = 'translate(';

    style += '' + this.get('item.x') + ',';
    style += '' + this.get('item.y') + ')';

    return Ember.String.htmlSafe(style);
  }),

  didInsertElement: function() {
    this.onCompleted();
  },

  /**
   * Need this becuase SVG doesn't support jquery addClass utilized by classNameBindings
   *
   * @method onCompleted
   */
  
  onCompleted: Ember.observer('item.completed', function() {
     if(this.get('item.completed')) {
      return this.element.classList.add('completed');
     }
     this.element.classList.remove('completed');
   })
});
