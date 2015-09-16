/* global d3 */
import Ember from 'ember';

Array.prototype.containsEvery = function(values) {
  return values.every(value => this.contains(value));
}

Array.prototype.containsAny = function(values) {
  return values.any(value => this.contains(value));
}

export default Ember.Component.extend(Ember.Evented, {
  classNames: ['swag-map'],

  swagifacts: [],
  nodes: [],
  links: [],

  skillsInMap: [],

  skills: function() {
    var skills = [];
    this.get('swagifacts').forEach((swagifact) => {
      skills.addObjects(swagifact.get('provides'));
    });
    return skills;
  }.property('swagifacts.@each.provides'),

  wantedSkills: Ember.computed.filterBy('skills', 'wanted', true),

  skillsNotInMap: Ember.computed.setDiff('wantedSkills', 'skillsInMap'),

  d3data: function() {
    let swagifacts = this.get('swagifacts');

    this.set('skillsInMap', []);
    this.set('nodes', []);
    this.set('links', []);

    console.log('want %d skills', this.get('wantedSkills.length'));

    let start = {name: 'start', level: 0, fixed: true, x: 20, y: 250};
    this.get('nodes').push(start);


    let lastNodeAdded = start;
    let i = 0; // prevent infinate loop while working on this
    while(this.get('skillsNotInMap.length') > 0 && i < 20) {
      swagifacts.forEach(swagifact => {
        if(Array.prototype.containsAny.call(swagifact.get('provides'), this.get('skillsNotInMap'))) {
          let node = { name: swagifact.get('name'), level: 1, model: swagifact };
          this.get('nodes').addObject(node);
          this.get('skillsInMap').addObjects(swagifact.get('provides'));
          this.get('links').addObject({ source: lastNodeAdded, target: node, length: 1 });
          console.log('node added %s', swagifact.get('name'));
          console.log(this.get('skillsNotInMap.length'));
          lastNodeAdded = node;
        }
      });
      i++;
    }

  }.observes('wantedSkills.[]'),

  /**
   * Set up svg and trigger inital drawing
   *
   * @method didInsertElement
   *
   */

  didInsertElement: function() {
    console.log('swagifacts loaded: %d', this.get('swagifacts.length'));
    let component = this;
      var elem = this.$('svg')[0];
      var svg = d3.select(elem).attr('width', 900).attr('height', 500);

      this.d3data();

      var force = d3.layout.force()
        .nodes(this.get('nodes'))
        .links(this.get('links'))
        .size([900, 500])
        .linkDistance(200)
        .charge(-30)
        .on("tick", tick)
        .start();

        // Per-type markers, as they don't inherit styles.
    svg.append("defs").selectAll("marker")
        .data(['test'])
      .enter().append("marker")
        .attr("id", function(d) { return d; })
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");

        var path = svg.append("g").selectAll("path")
            .data(force.links())
          .enter().append("path")
            .attr("class", function(d) { return "link" + (d.invisible ? " invisible" : ""); })
            .attr("marker-end", function(d) { return "url(" + window.location.pathname + "#test)"; });

      var circle = svg.append("g").selectAll("circle")
          .data(force.nodes())
        .enter().append("circle")
          .attr("class", function(d) { return "node-level" + d.level; })
          .attr("r", 20)
          .call(force.drag);

          var text = svg.append("g").selectAll("text")
              .data(force.nodes())
            .enter().append("text")
              .attr("x", 8)
              .attr("y", ".81em")
              .text(function(d) { return d.name; });


      function tick(e) {
        path.attr("d", linkArc);
        circle.attr("transform", transform);
        text.attr("transform", transform);

        // var k = 6 * e.alpha;
        // component.nodes.forEach(function(node, i) {
        //   if(node.level === 3) {
        //     node.x += 10 * k;
        //   }
        // })
      }

      function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = (dx * dx + dy * dy) * d.length;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
  },


});
