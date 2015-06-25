/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  classNames: ['swag-map'],

  /**
   * Set up svg and trigger inital drawing
   *
   * @method didInsertElement
   *
   */

  didInsertElement: function() {
    var svg = SVG(this.$('svg')[0]).size(800, 2000);
    this.set('svg', svg);
    this.plotPath();
    this.calculatePoints();
  },

  /**
   * Computes curved path
   *
   * @method points
   */

  plotPath: Ember.observer('verticalSeperation', 'curviness', 'mapLength', function() {
    Ember.run.schedule('afterRender', () => {
      if(this.get('path')) {
        this.get('path').remove();
      }

      var path = this.get('svg').path();
      var verticalSeperation = Number(this.get('verticalSeperation'));
      var length = Number(this.get('mapLength'));
      var curviness = Number(this.get('curviness'));
      var padding = 50;
      var width = 800;

      var start = [padding, padding];
      var startHandle = [padding, padding + curviness];

      var pathDefinition = 'M ' + start.join(',');

      var secondPoint = [width - 50, start[1] + verticalSeperation];

      var secondHandle = [secondPoint[0], secondPoint[1] - curviness];

      pathDefinition += 'C ' + startHandle.join(',') + ' ' + secondHandle.join(',') + ' ' + secondPoint.join(',');

      for (var i = 2; i < length; i++) {
        var to, handle;
        if(i % 2 !== 0) {
          to = [width - padding, padding + ((verticalSeperation) * i)];
          handle = [width - padding, to[1] - curviness];
        } else {
          to = [padding, padding + (verticalSeperation * i)];
          handle = [padding, to[1] - curviness];
        }

        pathDefinition += 'S ' + handle.join(',') + ' ' + to.join(',');
      }
      //console.log(pathDefinition);
      path.plot(pathDefinition).addClass('swag-line');
      this.set('path', path);
    });
  }),

  /*
   * Calculate coordinates for each swagifacts
   *
   */

  calculatePoints: Ember.observer('swagifacts.[]', 'verticalSeperation', 'curviness', 'mapLength', function() {
    Ember.run.schedule('afterRender', () => {
      var swagifacts = this.get('swagifacts');
      var count = swagifacts.length;

      if (count > 0) {
        var path = this.get('path');
        var length = this.get('path').length();


        var sectionLength = length / (count - 1);

        for(var i = 1; i < count; i ++) {
          var point = path.pointAt(i * sectionLength);
          swagifacts.objectAt(i).setProperties({
            x: point.x - 25,
            y: point.y - 25
          });
        }

        var firstPoint = path.pointAt(0);
        swagifacts.get('firstObject').setProperties({
          x: firstPoint.x - 25,
          y: firstPoint.y - 25
        });

        var lastPoint = path.pointAt(length);
        swagifacts.get('lastObject').setProperties({
          x: lastPoint.x - 25,
          y: lastPoint.y - 25
        });
      }
    });
  })
});
