import Ember from 'ember';

export default Ember.Route.extend({
  lrs: Ember.inject.service('lrs'),

  afterModel: function(model) {
    // load swagmap json
    Ember.$.getJSON(model.get('map'), (mapData) => {
      mapData.items.forEach((item) => {
        var swagifact = this.addToStore(item, model);
        this.checkIfComplete(swagifact);
      });
    });
  },

  /**
   * add swagifacts to the store
   *
   * @method addToStore
   * @param   Object    item    Raw swagifact item
   * @param   Model     swagmap Swagmap this swagifact belongs to
   * @returns Model     model   Ember swagifact Model
   */
  
  addToStore: function(item, swagmap) {
    var model = this.store.push('swagifact', this.store.normalize('swagifact', {
      id: item.object[0],
      label: item.label,
      x: item.x,
      y: item.y,
      swagmap: swagmap.get('id')
    }));

    swagmap.get('swagifacts').pushObject(model);
    return model;
  },

  /**
   * Contact the LRS and find out if the swagifacts have been competed
   *
   * @method checkIfComplete
   * @param  Model        model   swagifact model
   */
  
  checkIfComplete: function(model) {
    var activity = new TinCan.Activity({
      "id": model.get('id')
    });

    this.get('lrs.tincan').getStatements({
      params: {
        "agent": this.get('lrs.agent'),
        "activity": activity
      },
      callback: (err, res) => {
        if(err !== undefined) return;
        res.statements.forEach((statement) => {
          if(statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
            model.set('completed', true);
          }
        });
      }
    });  
  }
});
