import { moduleForModel, test } from 'ember-qunit';

moduleForModel('swagifact', 'Unit | Model | swagifact', {
  // Specify the other units that are required for this test.
  needs: ['model:skill', 'model:swagmap', 'service:current-user']
});

test('it exists', function(assert) {
  var model = this.subject();
  // var store = this.store();
  assert.ok(!!model);
});
