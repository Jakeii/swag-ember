import DS from 'ember-data';
import ENV from '../config/environment';

var swagmap = DS.Model.extend({
  name: DS.attr(),
  map: DS.attr(),
  swagifacts: DS.hasMany('swagifact')
});

swagmap.reopenClass({
  FIXTURES: [
    {
      id: 1,
      name: 'ktouch',
      map: (ENV.environment !== 'github') ? '/swagmaps/ktouch.json' : '/swag-ember/swagmaps/ktouch.json'
    }
  ]
});

export default swagmap;