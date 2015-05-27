/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  tagName: 'svg',

  items: Ember.A(),
  classNames: ['swag-map'],


  didInsertElement: function() {
    var svg = SVG(this.get('element')).size(800, 2000);
    this.set('svg', svg);
    this.plotPath();
    this.calculatePoints();
  },

  /**
   * computes point string for polyline
   *
   * @method points
   */
    
  plotPath: Ember.observer('verticalSeperation', 'curviness', 'mapLength', function() {
    // if(this.get('swagifacts')){
    //   return 'M ' + this.get('swagifacts').reduce(function(prev, item, index) {
    //     return prev + (index ? 'T ' : '') + (item.get('x') + 25) +  ',' + (item.get('y') + 25) + ' ';
    //   }, '');
    // }
    // return '';
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

      // var finish = [width - 50, width - 50];
      // var finishHandle = [finish[0] - 50, finish[1] - 50];

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
      console.log(pathDefinition);
      path.plot(pathDefinition).addClass('swag-line');
      this.set('path', path);
    });
  }),

  calculatePoints: Ember.observer('swagifacts.[]', 'verticalSeperation', 'curviness', 'mapLength', function() {
    Ember.run.schedule('afterRender', () => {
      var swagifacts = this.get('swagifacts');
      var count = swagifacts.length;

      if (count > 0) {
        var path = this.get('path');
        var length = this.get('path').length();


        var sectionLength = length / (count - 2);

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

  /**
   * redraws line whenever points change
   *
   * @method redrawLine
   */

  // redrawPath: Ember.observer('path', function() {
    
  //     var svg = this.get('svg');

  //     if(this.get('path')) {
  //       return this.get('path').replace(svg.path(this.get('path')).addClass('swag-line'));
  //     }
  //     this.set('path', svg.path(this.get('path')).addClass('swag-line'));
    
  // })
});
