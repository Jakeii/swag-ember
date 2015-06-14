import DS from 'ember-data';

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
      map: 'https://rawgit.com/tunapanda/swagmaps/master/KTouch/ktouch.json'
    }
  ]
});

export default swagmap;
