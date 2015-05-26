import DS from 'ember-data';
import ENV from '../config/environment';

var adapter;

if(ENV.APP.useFixtures) {
  adapter = DS.FixtureAdapter;
} else {
  adapter = DS.RESTAdapter.extend({
    namespace: 'api'
  });
}

export default adapter;