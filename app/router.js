import Ember from 'ember';
import config from './config/environment';

var Router = Ember.Router.extend({
  location: config.locationType
});

Router.map(function() {
  this.route('swagmaps');
  this.route('swagmap', {path: '/swagmap/:swagmap_id'});
});

export default Router;
