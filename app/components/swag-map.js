/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  classNames: ['swag-map'],

  swagifacts: Ember.A(),

  init() {
    this._super(...arguments);
  },
  d3data: function() {
    let swagifacts = this.get('swagifacts');
    let links = [];
    let nodes = [];

    swagifacts.forEach(function(swagifact) {
      nodes.push({ name: swagifact.get('name'), level: 0, model: swagifact });

    });

    nodes.forEach(function(node) {
      nodes.forEach(function(node2) {
        if(node2.model.get('requires').some((skill) => node.model.get('provides').contains(skill))) {
          links.push({ source: node, target: node2 });
        }
      })
    });

    return { nodes: nodes, links: links };
  },

  /**
   * Set up svg and trigger inital drawing
   *
   * @method didInsertElement
   *
   */

  didInsertElement: function() {
    console.log('swagifacts loaded: %d', this.get('swagifacts.length'));

      var elem = this.$('svg')[0];
      var svg = d3.select(elem).attr('width', 800).attr('height', 800);

      let data = this.d3data();

      var force = d3.layout.force()
        .nodes(data.nodes)
        .links(data.links)
        .size([800, 800])
        .linkDistance(200)
        .charge(-1200)
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
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
      .append("path")
        .attr("d", "M0,-5L10,0L0,5");

        var path = svg.append("g").selectAll("path")
            .data(force.links())
          .enter().append("path")
            .attr("class", function(d) { return "link"; })
            .attr("marker-end", function(d) { return "url(" + window.location.pathname + "#test)"; });

      var circle = svg.append("g").selectAll("circle")
          .data(force.nodes())
        .enter().append("circle")
          .attr("class", function(d) { return "node-level" + d.level; })
          .attr("r", 6)
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

        var k = 6 * e.alpha;
        data.nodes.forEach(function(node, i) {
          node.x +=  (node.level + 1) * k;
        })
      }

      function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = dx * dx + dy * dy;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
  },


});
