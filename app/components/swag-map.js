/* global d3 */
import Ember from 'ember';

Array.prototype.containsEvery = function(values) {
  return values.every(value => this.contains(value));
};

Array.prototype.containsAny = function(values) {
  return values.any(value => this.contains(value));
};

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
    let lastNodeAdded;
    this.get('swagifacts').setEach('inMap', false);
    this.get('swagifacts').setEach('dependenciesMet', true);

    function handleSwagifact(swagifact) {
      let containsWantedSkills = Array.prototype.containsAny.call(swagifact.get('provides'), this.get('skillsNotInMap'));
      let dependenciesMet = Array.prototype.containsEvery.call(this.get('skillsInMap'), swagifact.get('requires'));

      if(containsWantedSkills && dependenciesMet) {
        let node = { name: swagifact.get('name'), model: swagifact };
        this.get('nodes').addObject(node);
        swagifact.set('inMap', true);
        swagifact.set('dependenciesMet', true);
        this.get('skillsInMap').addObjects(swagifact.get('provides'));
        this.get('links').addObject({ source: lastNodeAdded, target: node });
        console.log('node added %s', swagifact.get('name'));
        console.log(this.get('skillsNotInMap.length'));
        lastNodeAdded = node;
      }
      if(swagifact.get('provides.length') > 0 && !dependenciesMet) {
        swagifact.set('dependenciesMet', false);
      }
    }

    Ember.run.schedule('actions', () => {
      let swagifacts = this.get('swagifacts');

      this.set('skillsInMap', []);
      this.set('nodes', []);
      this.set('links', []);

      console.log('want %d skills', this.get('wantedSkills.length'));

      let start = {name: 'start', fixed: true, x: 20, y: 20};
      this.get('nodes').push(start);


      lastNodeAdded = start;
      let i = 0; // prevent infinate loop while working on this
      while(this.get('skillsNotInMap.length') > 0 && i < 20) {
        swagifacts.forEach(handleSwagifact.bind(this));
        i++;
      }

      this.get('nodes.lastObject').fixed = true;
      this.get('nodes.lastObject').x = 900 - 100;
      this.get('nodes.lastObject').y = 500 - 20;

    });

  }.observes('wantedSkills.[]').on('init'),

  /**
   * Set up svg and trigger inital drawing
   *
   * @method didInsertElement
   *
   */
  didInsertElement: function() {
    console.log('swagifacts loaded: %d', this.get('swagifacts.length'));

    Ember.run(() => this.draw());
  },

  draw() {
    this.$('svg').replaceWith('<svg />');
    let elem = this.$('svg')[0];
    let svg = d3.select(elem).attr('width', 900).attr('height', 500);
    this.set('svg', svg);

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

    let force = d3.layout.force()
      .nodes(this.get('nodes'))
      .links(this.get('links'))
      .size([900, 500])
      .linkDistance(100)
      .charge(-100)
      .on("tick", this.tick.bind(this))
      .start();

      this.set('force', force);
  },

  redraw: function() {
    Ember.run.schedule('actions', () => {
    // this.get('force').nodes(this.get('nodes'))
    // .links(this.get('links')).start();
    // this.propertyDidChange('force');
    this.draw();
  });
  }.observes('nodes', 'links'),

  path: function() {
    return this.get('svg').append("g").selectAll("path")
        .data(this.get('force').links())
      .enter().append("path")
        .attr("class", function() { return "link"; })
        .attr("marker-end", function() { return "url(" + window.location.pathname + "#test)"; });
  }.property('force'),

  circle: function() {
    return this.get('svg').append("g").selectAll("circle")
        .data(this.get('force').nodes())
      .enter().append("circle")
        .attr("class", function(d) { return "node-level" + d.level; })
        .attr("r", 10)
        .on('mouseover', function(d) {
          this.set('currentSwagifact', d.model);
        }.bind(this))
        .call(this.get('force').drag);
  }.property('force'),

  text: function() {
    return this.get('svg').append("g").selectAll("text")
        .data(this.get('force').nodes())
      .enter().append("text")
        .attr("x", 8)
        .attr("y", ".81em")
        .text(function(d) { return d.name; });
  }.property('force'),

  tick() {
    this.get('path').attr("d", linkArc);
    this.get('circle').attr("transform", transform);
    this.get('text').attr("transform", transform);

    // var k = 6 * e.alpha;
    // this.get('nodes.lastObject').x += 10 * k;


    function linkArc(d) {
      var dx = d.target.x - d.source.x,
          dy = d.target.y - d.source.y,
          dr = (dx * dx + dy * dy);
      return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
    }

    function transform(d) {
      return "translate(" + d.x + "," + d.y + ")";
    }
  }

});
