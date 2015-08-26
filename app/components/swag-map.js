/* global SVG */
import Ember from 'ember';

export default Ember.Component.extend(Ember.Evented, {
  classNames: ['swag-map'],

  swagifacts: Ember.A(),

  d3data: function() {
    let swagifacts = this.get('swagifacts');
    let links = [];
    let nodes = {};

    swagifacts.forEach(function (swagifact) {
      nodes[swagifact.get('name')] = {name: swagifact.get('name')};

      let requirements = swagifact.get('requires');

      swagifacts.find(function (item) {
        if(swagifact.get('id') !== item.get('id') && requirements.every((requirement) => item.get('provides').findBy('id', requirement.get('id')))) {
          links.push({source: swagifact.get('name'), target: item.get('name'), type: 'test'});
        }
      });

    });

    return links;
  },

  /**
   * Set up svg and trigger inital drawing
   *
   * @method didInsertElement
   *
   */

  didInsertElement: function() {
    var elem = this.$('svg')[0];
    var svg = d3.select(elem).attr('width', 800).attr('height', 800);

    let links = this.d3data();
    let nodes = {};

    links.forEach(function(link) {
      link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
      link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
    });

    var force = d3.layout.force()
      .nodes(d3.values(nodes))
      .links(links)
      .size([800, 800])
      .linkDistance(120)
      .charge(-600)
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
          .attr("class", function(d) { return "link " + d.type; })
          .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

    var circle = svg.append("g").selectAll("circle")
        .data(force.nodes())
      .enter().append("circle")
        .attr("r", 6)
        .call(force.drag);

        var text = svg.append("g").selectAll("text")
            .data(force.nodes())
          .enter().append("text")
            .attr("x", 8)
            .attr("y", ".31em")
            .text(function(d) { return d.name; });

    function tick() {
      path.attr("d", linkArc);
      circle.attr("transform", transform);
      text.attr("transform", transform);
    }

    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = Math.sqrt(dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }
  },


});
