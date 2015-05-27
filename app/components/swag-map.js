/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  tagName: 'svg',

  items: Ember.A(),
  classNames: ['swag-map'],

  didInsertElement: function() {
    var svg = SVG(this.get('element')).size(800, 800);
    this.set('svg', svg);

    this.redrawLine();
  },

  /**
   * computes point string for polyline
   *
   * @method points
   */
    
  points: Ember.computed('swagifacts.[]', function() {
    return this.get('swagifacts').reduce(function(prev, item) {
      console.log(item.get('label'));
      return prev + (item.get('x') + 25) +  ',' + (item.get('y') + 25) + ' ';
    }, '');
  }),

  /**
   * redraws line whenever points change
   *
   * @method redrawLine
   */

  redrawLine: Ember.observer('points', function() {
    Ember.run.schedule('afterRender', () => {
      var svg = this.get('svg');

      if(this.get('line')) {
        return this.get('line').replace(svg.polyline(this.get('points')).addClass('swag-line'));
      }
      this.set('line', svg.polyline(this.get('points')).addClass('swag-line'));
    });
  })
});
