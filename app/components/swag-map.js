/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  tagName: 'svg',

  items: Ember.A(),
  classNames: ['swag-map'],

  didInsertElement: function() {
    var svg = SVG(this.get('element')).size(800, 800);
    this.set('svg', svg);

    // draw lines whenever component is rendered and there are swagifacts available
    if(this.get('swagifacts.length') > 0) {
      this.drawLines();
    }
  },

  /**
   * draws lines whenever swagifacts are added
   *
   * @method drawLines
   */
  
  drawLines: Ember.observer('swagifacts.[]', function() {
    this.get('swagifacts').forEach((item, i, items) => {
      if(i < items.length - 1) {
        this.get('svg').line(item.get('x') + 25, item.get('y') + 25, items.objectAt(i + 1).get('x') + 25, items.objectAt(i + 1).get('y') + 25);
      }
    });
  })
});
