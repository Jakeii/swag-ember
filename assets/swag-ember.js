"use strict";
/* jshint ignore:start */

/* jshint ignore:end */

define('swag-ember/adapters/application', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].RESTAdapter.extend({
    namespace: 'api',
    shouldReloadAll: function shouldReloadAll() {
      return false;
    }
  });

});
define('swag-ember/adapters/swagmap', ['exports', 'swag-ember/adapters/application'], function (exports, ApplicationAdapter) {

  'use strict';

  exports['default'] = ApplicationAdapter['default'].extend({
    //namespace: 'api'
    urlForFindRecord: function urlForFindRecord() {
      return 'https://rawgit.com/tunapanda/swagmaps/3285ac0826815078f49b67520509b045f826fcca/PythonExample/v2.0.json';
    },
    urlForFindAll: function urlForFindAll() {
      return 'https://rawgit.com/tunapanda/swagmaps/3285ac0826815078f49b67520509b045f826fcca/PythonExample/v2.0.json';
    }
  });

});
define('swag-ember/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'swag-ember/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  var App;

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('swag-ember/components/app-version', ['exports', 'ember-cli-app-version/components/app-version', 'swag-ember/config/environment'], function (exports, AppVersionComponent, config) {

  'use strict';

  var _config$APP = config['default'].APP;
  var name = _config$APP.name;
  var version = _config$APP.version;

  exports['default'] = AppVersionComponent['default'].extend({
    version: version,
    name: name
  });

});
define('swag-ember/components/swag-map', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  /* global d3 */
  Array.prototype.containsEvery = function (values) {
    var _this = this;

    return values.every(function (value) {
      return _this.contains(value);
    });
  };

  Array.prototype.containsAny = function (values) {
    var _this2 = this;

    return values.any(function (value) {
      return _this2.contains(value);
    });
  };

  exports['default'] = Ember['default'].Component.extend(Ember['default'].Evented, {
    classNames: ['swag-map'],

    swagifacts: [],
    nodes: [],
    links: [],

    skillsInMap: [],

    skills: (function () {
      var skills = [];
      this.get('swagifacts').forEach(function (swagifact) {
        skills.addObjects(swagifact.get('provides'));
      });
      return skills;
    }).property('swagifacts.@each.provides'),

    wantedSkills: Ember['default'].computed.filterBy('skills', 'wanted', true),

    skillsNotInMap: Ember['default'].computed.setDiff('wantedSkills', 'skillsInMap'),

    d3data: (function () {
      var _this3 = this;

      var lastNodeAdded = undefined;
      this.get('swagifacts').setEach('inMap', false);
      this.get('swagifacts').setEach('dependenciesMet', true);

      function handleSwagifact(swagifact) {
        var containsWantedSkills = Array.prototype.containsAny.call(swagifact.get('provides'), this.get('skillsNotInMap'));
        var dependenciesMet = Array.prototype.containsEvery.call(this.get('skillsInMap'), swagifact.get('requires'));

        if (containsWantedSkills && dependenciesMet) {
          var node = { name: swagifact.get('name'), model: swagifact };
          this.get('nodes').addObject(node);
          swagifact.set('inMap', true);
          swagifact.set('dependenciesMet', true);
          this.get('skillsInMap').addObjects(swagifact.get('provides'));
          this.get('links').addObject({ source: lastNodeAdded, target: node });
          console.log('node added %s', swagifact.get('name'));
          console.log(this.get('skillsNotInMap.length'));
          lastNodeAdded = node;
        }
        if (swagifact.get('provides.length') > 0 && !dependenciesMet) {
          swagifact.set('dependenciesMet', false);
        }
      }

      Ember['default'].run.schedule('actions', function () {
        var swagifacts = _this3.get('swagifacts');

        _this3.set('skillsInMap', []);
        _this3.set('nodes', []);
        _this3.set('links', []);

        console.log('want %d skills', _this3.get('wantedSkills.length'));

        var start = { name: 'start', fixed: true, x: 20, y: 20 };
        _this3.get('nodes').push(start);

        lastNodeAdded = start;
        var i = 0; // prevent infinate loop while working on this
        while (_this3.get('skillsNotInMap.length') > 0 && i < 20) {
          swagifacts.forEach(handleSwagifact.bind(_this3));
          i++;
        }

        _this3.get('nodes.lastObject').fixed = true;
        _this3.get('nodes.lastObject').x = 900 - 100;
        _this3.get('nodes.lastObject').y = 500 - 20;
      });
    }).observes('wantedSkills.[]').on('init'),

    /**
     * Set up svg and trigger inital drawing
     *
     * @method didInsertElement
     *
     */
    didInsertElement: function didInsertElement() {
      var _this4 = this;

      console.log('swagifacts loaded: %d', this.get('swagifacts.length'));

      Ember['default'].run(function () {
        return _this4.draw();
      });
    },

    draw: function draw() {
      this.$('svg').replaceWith('<svg />');
      var elem = this.$('svg')[0];
      var svg = d3.select(elem).attr('width', 900).attr('height', 500);
      this.set('svg', svg);

      // Per-type markers, as they don't inherit styles.
      svg.append("defs").selectAll("marker").data(['test']).enter().append("marker").attr("id", function (d) {
        return d;
      }).attr("viewBox", "0 -5 10 10").attr("refX", 15).attr("refY", -1.5).attr("markerWidth", 10).attr("markerHeight", 10).attr("orient", "auto").append("path").attr("d", "M0,-5L10,0L0,5");

      var force = d3.layout.force().nodes(this.get('nodes')).links(this.get('links')).size([900, 500]).linkDistance(100).charge(-100).on("tick", this.tick.bind(this)).start();

      this.set('force', force);
    },

    redraw: (function () {
      var _this5 = this;

      Ember['default'].run.schedule('actions', function () {
        // this.get('force').nodes(this.get('nodes'))
        // .links(this.get('links')).start();
        // this.propertyDidChange('force');
        _this5.draw();
      });
    }).observes('nodes', 'links'),

    path: (function () {
      return this.get('svg').append("g").selectAll("path").data(this.get('force').links()).enter().append("path").attr("class", function () {
        return "link";
      }).attr("marker-end", function () {
        return "url(" + window.location.pathname + "#test)";
      });
    }).property('force'),

    circle: (function () {
      return this.get('svg').append("g").selectAll("circle").data(this.get('force').nodes()).enter().append("circle").attr("class", function (d) {
        return "node-level" + d.level;
      }).attr("r", 10).on('mouseover', (function (d) {
        this.set('currentSwagifact', d.model);
      }).bind(this)).call(this.get('force').drag);
    }).property('force'),

    text: (function () {
      return this.get('svg').append("g").selectAll("text").data(this.get('force').nodes()).enter().append("text").attr("x", 8).attr("y", ".81em").text(function (d) {
        return d.name;
      });
    }).property('force'),

    tick: function tick() {
      this.get('path').attr("d", linkArc);
      this.get('circle').attr("transform", transform);
      this.get('text').attr("transform", transform);

      // var k = 6 * e.alpha;
      // this.get('nodes.lastObject').x += 10 * k;

      function linkArc(d) {
        var dx = d.target.x - d.source.x,
            dy = d.target.y - d.source.y,
            dr = dx * dx + dy * dy;
        return "M" + d.source.x + "," + d.source.y + "A" + dr + "," + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
      }

      function transform(d) {
        return "translate(" + d.x + "," + d.y + ")";
      }
    }

  });

});
define('swag-ember/components/swag-swagifact', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({
    currentUser: Ember['default'].inject.service('current-user'),
    lrs: Ember['default'].inject.service('lrs'),

    tagName: 'li',
    classNames: ['swagifact'],
    classNameBindings: ['completed', 'available'],

    /**
     * Whether this swagifact has been completed
     *
     * @method computed
     *
     * @return {boolean}
     */

    completed: Ember['default'].computed('currentUser.model.completed.[]', function () {
      return this.get('currentUser') ? this.get('currentUser').hasCompleted(this.get('item')) : false;
    }),

    /**
     * Whether the current user has the skills available to be able to attempt this
     *
     * @method computed
     *
     * @return {boolean}
     */

    available: Ember['default'].computed('item.requires.[]', 'currentUser.model.completed.[]', function () {
      var _this = this;

      if (this.get('item.requires.length') === 0) {
        return true;
      }
      return this.get('item.requires') ? this.get('item.requires').every(function (skill) {
        return _this.get('currentUser').hasSkill(skill);
      }) : [];
    }),

    /**
     * Wraps requires with whether current user has that skill
     *
     * @method computed
     *
     * @return {boolean}
     */

    requires: Ember['default'].computed('item.requires.[]', 'currentUser.model.skills.[]', function () {
      var _this2 = this;

      return this.get('item.requires') ? this.get('item.requires').map(function (skill) {
        return Ember['default'].Object.create({ completed: _this2.get('currentUser').hasSkill(skill), name: skill.get('name') });
      }) : [];
    }),

    /**
    * Wraps provides with whether current user has that skill
     *
     * @method computed
     *
     * @return {boolean}
     */

    provides: Ember['default'].computed('item.provides.[]', 'currentUser.model.skills.[]', function () {
      var _this3 = this;

      return this.get('item.provides') ? this.get('item.provides').map(function (skill) {
        return Ember['default'].Object.create({ completed: _this3.get('currentUser').hasSkill(skill), name: skill.get('name') });
      }) : [];
    }),

    actions: {
      sendCompleted: function sendCompleted() {
        this.get('lrs').sendCompleted(this.get('item'));
      }
    },

    /**
     * Computed transform attribute
     *
     * @method transform
     */

    style: Ember['default'].computed('item.x', 'item.y', function () {
      var style = 'transform:translate(';

      style += '' + (this.get('item.x') || 0) + 'px,';
      style += '' + (this.get('item.y') || 0) + 'px);';

      return Ember['default'].String.htmlSafe(style);
    })

  });

});
define('swag-ember/controllers/application', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    currentUser: Ember['default'].inject.service('current-user'),
    index: Ember['default'].inject.controller('index'),
    swagmap: Ember['default'].inject.controller('swagmap'),
    lrs: Ember['default'].inject.service('lrs'),
    actions: {
      logOut: function logOut() {
        this.get('currentUser').logOut();
      },
      sessionAuthenticationSucceded: function sessionAuthenticationSucceded() {}
    },

    swagmaps: (function () {
      return this.store.peekAll('swagmap');
    }).property('index.model', 'swagmap.model')
  });

});
define('swag-ember/controllers/array', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('swag-ember/controllers/index', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller.extend({});

});
define('swag-ember/controllers/object', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Controller;

});
define('swag-ember/controllers/swagmap', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend({
    currentUser: Ember['default'].inject.service('current-user'),
    actions: {
      swagifactHover: function swagifactHover(swagifact) {
        this.set('currentSwagifact', swagifact);
      }
    },

    skills: Ember['default'].computed('model.swagifacts', function () {
      var skills = Ember['default'].A();
      this.get('model.swagifacts').forEach(function (swagifact) {
        skills.addObjects(swagifact.get('provides'));
      });
      return skills;
    }),

    allSkillsWanted: Ember['default'].computed('skills.@each.wanted', {
      set: function set(key, value) {
        if (value === true) {
          return this.get('skills').setEach('wanted', true);
        }

        this.get('skills').setEach('wanted', false);
      },
      get: function get() {
        if (this.get('skills').every(function (skill) {
          return skill.get('wanted') === true;
        })) return true;
        return false;
      }
    })
  });

});
define('swag-ember/helpers/fa-icon', ['exports', 'ember-cli-font-awesome/helpers/fa-icon'], function (exports, fa_icon) {

	'use strict';



	exports['default'] = fa_icon['default'];
	exports.faIcon = fa_icon.faIcon;

});
define('swag-ember/initializers/app-version', ['exports', 'ember-cli-app-version/initializer-factory', 'swag-ember/config/environment'], function (exports, initializerFactory, config) {

  'use strict';

  var _config$APP = config['default'].APP;
  var name = _config$APP.name;
  var version = _config$APP.version;

  exports['default'] = {
    name: 'App Version',
    initialize: initializerFactory['default'](name, version)
  };

});
define('swag-ember/initializers/export-application-global', ['exports', 'ember', 'swag-ember/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize() {
    var application = arguments[1] || arguments[0];
    if (config['default'].exportApplicationGlobal !== false) {
      var value = config['default'].exportApplicationGlobal;
      var globalName;

      if (typeof value === 'string') {
        globalName = value;
      } else {
        globalName = Ember['default'].String.classify(config['default'].modulePrefix);
      }

      if (!window[globalName]) {
        window[globalName] = application;

        application.reopen({
          willDestroy: function willDestroy() {
            this._super.apply(this, arguments);
            delete window[globalName];
          }
        });
      }
    }
  }

  ;

  exports['default'] = {
    name: 'export-application-global',

    initialize: initialize
  };

});
define('swag-ember/models/skill', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    name: DS['default'].attr(),
    wanted: DS['default'].attr({ defaultValue: true })
  });

});
define('swag-ember/models/swagifact', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    name: DS['default'].attr(),
    description: DS['default'].attr(),
    provides: DS['default'].hasMany('skill'),
    requires: DS['default'].hasMany('skill'),
    inMap: DS['default'].attr(),
    dependenciesMet: DS['default'].attr(),
    link: DS['default'].attr()
  });

});
define('swag-ember/models/swagmap', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  var swagmap = DS['default'].Model.extend({
    name: DS['default'].attr(),
    description: DS['default'].attr(),
    swagifacts: DS['default'].hasMany('swagifact')
  });

  exports['default'] = swagmap;

});
define('swag-ember/models/user', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    email: DS['default'].attr(),
    completed: DS['default'].hasMany('swagifact'),
    skills: DS['default'].hasMany('skill')
  });

});
define('swag-ember/router', ['exports', 'ember', 'swag-ember/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    this.route('swagmap', { path: '/swagmap/:swagmap_id' });
  });

  exports['default'] = Router;

});
define('swag-ember/routes/application', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend();

});
define('swag-ember/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return this.store.findAll('swagmap');
    }
  });

});
define('swag-ember/routes/swagmap', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    currentUser: Ember['default'].inject.service('current-user'),
    lrs: Ember['default'].inject.service('lrs'),

    afterModel: function afterModel(model) {
      var _this = this;

      // contact lrs
      return Ember['default'].RSVP.all(model.get('swagifacts').map(function (swagifact) {
        return _this.checkIfComplete(swagifact);
      }));
    },

    /**
     * Contact the LRS and find out if the swagifacts have been competed
     *
     * @method checkIfComplete
     * @param  Model        model   swagifact model
     */

    checkIfComplete: function checkIfComplete(swagifact) {
      return this.get('lrs').syncComplete(swagifact);
    }
  });

});
define('swag-ember/serializers/application', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].RESTSerializer.extend({
    normalize: function normalize(model, hash, prop) {
      hash.link = hash.id;
      hash.id = hash.id.split('/').pop();
      hash.name = hash.definition.name['en-US'];
      hash.description = hash.definition.description ? hash.definition.description['en-US'] : '';
      delete hash.definition;

      if (hash.swagifacts) {
        hash.swagifacts = hash.swagifacts.map(function (swagifact) {
          return swagifact.split('/').pop();
        });
      }

      if (hash.requires) {
        hash.requires = hash.requires.map(function (skill) {
          return skill.split('/').pop();
        });
      }

      if (hash.provides) {
        hash.provides = hash.provides.map(function (skill) {
          return skill.split('/').pop();
        });
      }
      return this._super(model, hash, prop);
    },
    normalizeFindManyResponse: function normalizeFindManyResponse(store, primaryModelClass, payload, id, requestType) {

      payload.swagmaps = [payload.swagmap];
      delete payload.swagmap;

      return this['super'](store, primaryModelClass, payload, id, requestType);
    }
  });

});
define('swag-ember/services/current-user', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Service.extend({
    /**
     * initializes current user, loaded from localstorage
     *
     * @method init
     *
     */

    init: function init() {
      this.set('email', window.localStorage.getItem('LRS:email'));
    },

    saveEmail: Ember['default'].observer('email', function () {
      if (window.localStorage) window.localStorage.setItem('LRS:email', this.get('email'));
    }),

    /**
     * helper to determine if a user has compelted a given swagifact
     *
     * @method hasCompleted
     *
     */

    hasCompleted: function hasCompleted(swagifact) {
      if (this.get('model')) {
        return !!this.get('model.completed').findBy('id', swagifact.get('id'));
      }
      return false;
    },

    /**
     * helper to determine if a user has compelted a given skill
     *
     * @method hasCompleted
     *
     */

    hasSkill: function hasSkill(skill) {
      if (this.get('model')) {
        return !!this.get('model.skills').findBy('id', skill.get('id'));
      }
      return false;
    }
  });

});
define('swag-ember/services/lrs', ['exports', 'ember', 'swag-ember/config/environment'], function (exports, Ember, ENV) {

  'use strict';

  var tincan = new TinCan({
    recordStores: [{
      endpoint: ENV['default'].APP.xAPIEndpoint,
      username: ENV['default'].APP.xAPIUsername,
      password: ENV['default'].APP.xAPIPassword,
      allowFail: false
    }]
  });

  /**
   * Serivce that can be injected into any object that needs acces to the LRS
   *
   * @extends Ember.Service
   */

  exports['default'] = Ember['default'].Service.extend({
    currentUser: Ember['default'].inject.service('current-user'),
    tincan: tincan,

    /**
     * agent is bound to the current logged in user
     *
     * @method agent
     */

    agent: Ember['default'].computed('currentUser.model.content.email', function () {
      return new TinCan.Agent({
        'mbox': 'mailto:' + ENV['default'].APP.agentEmailOverride ? ENV['default'].APP.agentEmailOverride : this.get('currentUser.model.content.email')
      });
    }),

    /**
     * tell LRS that a swagifact has been completed
     *
     * @method sendCompleted
     *
     */

    sendCompleted: function sendCompleted(swagifact) {
      var _this = this;

      tincan.sendStatement({
        verb: {
          id: 'http://adlnet.gov/expapi/verbs/completed'
        },
        actor: this.get('agent'),
        target: {
          id: swagifact.get('xAPIID')
        }
      }, function (res) {
        if (res.err) return;

        _this.get('currentUser.model.completed').addObject(swagifact);
        _this.get('currentUser.model.skills').addObjects(swagifact.get('provides'));
        _this.get('currentUser.model').save();
      });
    },

    /**
     * find out if swagifact has been completed, updates model store if it has
     *
     * @method syncComplete
     *
     */

    syncComplete: function syncComplete(swagifact) {
      var _this2 = this;

      new Ember['default'].RSVP.Promise(function (resolve, reject) {
        var activity = new TinCan.Activity({
          "id": swagifact.get('xAPIID')
        });

        _this2.get('tincan').getStatements({
          params: {
            "agent": _this2.get('lrs.agent'),
            "activity": activity
          },
          callback: function callback(err, res) {
            if (err !== null) return reject();
            res.statements.forEach(function (statement) {
              if (statement.verb.id === 'http://adlnet.gov/expapi/verbs/completed') {
                _this2.get('currentUser.model.completed').addObject(swagifact);
                _this2.get('currentUser.model.skills').addObjects(swagifact.get('provides'));
              }
            });
            _this2.get('currentUser.model').save();
            resolve();
          }
        });
      });
    }
  });

});
define('swag-ember/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 2,
              "column": 2
            },
            "end": {
              "line": 2,
              "column": 58
            }
          },
          "moduleName": "swag-ember/templates/application.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("Swag Map Viewer");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() { return []; },
        statements: [

        ],
        locals: [],
        templates: []
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 9,
                "column": 10
              },
              "end": {
                "line": 9,
                "column": 78
              }
            },
            "moduleName": "swag-ember/templates/application.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["content","swagmap.name",["loc",[null,[9,62],[9,78]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 8,
              "column": 8
            },
            "end": {
              "line": 10,
              "column": 8
            }
          },
          "moduleName": "swag-ember/templates/application.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("          ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["block","link-to",["swagmap",["get","swagmap",["loc",[null,[9,31],[9,38]]]]],["class","dropdown-item"],0,null,["loc",[null,[9,10],[9,90]]]]
        ],
        locals: ["swagmap"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 24,
            "column": 0
          }
        },
        "moduleName": "swag-ember/templates/application.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("nav");
        dom.setAttribute(el1,"class","navbar navbar-light bg-faded");
        dom.setAttribute(el1,"role","navigation");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","btn-group");
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3,"type","button");
        dom.setAttribute(el3,"class","btn btn-secondary dropdown-toggle");
        dom.setAttribute(el3,"data-toggle","dropdown");
        dom.setAttribute(el3,"aria-haspopup","true");
        dom.setAttribute(el3,"aria-expanded","false");
        var el4 = dom.createTextNode("\n        Quick Switch\n      ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","dropdown-menu");
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("      ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("form");
        dom.setAttribute(el2,"class","form-inline navbar-form pull-right");
        var el3 = dom.createTextNode("\n   ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n   ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3,"class","btn btn-success-outline");
        dom.setAttribute(el3,"type","submit");
        var el4 = dom.createTextNode("Save");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("main");
        dom.setAttribute(el1,"class","container-fluid");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","row");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(element0, [5]);
        var element2 = dom.childAt(element1, [3]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(element0,1,1);
        morphs[1] = dom.createMorphAt(dom.childAt(element0, [3, 3]),1,1);
        morphs[2] = dom.createMorphAt(element1,1,1);
        morphs[3] = dom.createElementMorph(element2);
        morphs[4] = dom.createMorphAt(dom.childAt(fragment, [2, 1]),1,1);
        return morphs;
      },
      statements: [
        ["block","link-to",["index"],["class","navbar-brand"],0,null,["loc",[null,[2,2],[2,70]]]],
        ["block","each",[["get","swagmaps",["loc",[null,[8,16],[8,24]]]]],[],1,null,["loc",[null,[8,8],[10,17]]]],
        ["inline","input",[],["value",["subexpr","@mut",[["get","currentUser.email",["loc",[null,[14,17],[14,34]]]]],[],[]],"class","form-control","placeholder","LRS Email"],["loc",[null,[14,3],[14,81]]]],
        ["element","action",["saveEmail"],[],["loc",[null,[15,57],[15,79]]]],
        ["content","outlet",["loc",[null,[21,4],[21,14]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('swag-ember/templates/components/login-form', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 26,
            "column": 8
          }
        },
        "moduleName": "swag-ember/templates/components/login-form.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h1");
        dom.setAttribute(el1,"class","text-center");
        var el2 = dom.createTextNode("Please Login to Proceed!");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n  ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","row");
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","small-6 small-centered columns");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("button");
        dom.setAttribute(el3,"class","button");
        var el4 = dom.createTextNode("Login with Facebook");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element0 = dom.childAt(fragment, [3, 1, 1]);
        var morphs = new Array(1);
        morphs[0] = dom.createElementMorph(element0);
        return morphs;
      },
      statements: [
        ["element","action",["fbLogin"],[],["loc",[null,[5,27],[5,47]]]]
      ],
      locals: [],
      templates: []
    };
  }()));

});
define('swag-ember/templates/components/swag-map', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 16,
                "column": 12
              },
              "end": {
                "line": 18,
                "column": 12
              }
            },
            "moduleName": "swag-ember/templates/components/swag-map.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
            return morphs;
          },
          statements: [
            ["content","requires.name",["loc",[null,[17,18],[17,35]]]]
          ],
          locals: ["requires"],
          templates: []
        };
      }());
      var child1 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 28,
                "column": 12
              },
              "end": {
                "line": 30,
                "column": 12
              }
            },
            "moduleName": "swag-ember/templates/components/swag-map.hbs"
          },
          arity: 1,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("li");
            var el2 = dom.createComment("");
            dom.appendChild(el1, el2);
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(dom.childAt(fragment, [1]),0,0);
            return morphs;
          },
          statements: [
            ["content","provides.name",["loc",[null,[29,18],[29,35]]]]
          ],
          locals: ["provides"],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 5,
              "column": 0
            },
            "end": {
              "line": 46,
              "column": 0
            }
          },
          "moduleName": "swag-ember/templates/components/swag-map.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("aside");
          dom.setAttribute(el1,"class","card card-block");
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("h3");
          dom.setAttribute(el2,"class","card-title");
          var el3 = dom.createTextNode("Info: ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("table");
          dom.setAttribute(el2,"class","table table-sm");
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("tbody");
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("tr");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          dom.setAttribute(el5,"scope","row");
          var el6 = dom.createTextNode("\n          Requires\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("ul");
          var el7 = dom.createTextNode("\n");
          dom.appendChild(el6, el7);
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("          ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("tr");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          dom.setAttribute(el5,"scope","row");
          var el6 = dom.createTextNode("\n          Provides\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("ul");
          var el7 = dom.createTextNode("\n");
          dom.appendChild(el6, el7);
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          var el7 = dom.createTextNode("          ");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n      ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("tr");
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          dom.setAttribute(el5,"scope","row");
          var el6 = dom.createTextNode("\n          Link\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n        ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("td");
          var el6 = dom.createTextNode("\n          ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("a");
          var el7 = dom.createComment("");
          dom.appendChild(el6, el7);
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n        ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n      ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n  ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n  ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n\n");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [0]);
          var element1 = dom.childAt(element0, [3, 1]);
          var element2 = dom.childAt(element1, [5, 3, 1]);
          var morphs = new Array(5);
          morphs[0] = dom.createMorphAt(dom.childAt(element0, [1]),1,1);
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [1, 3, 1]),1,1);
          morphs[2] = dom.createMorphAt(dom.childAt(element1, [3, 3, 1]),1,1);
          morphs[3] = dom.createAttrMorph(element2, 'href');
          morphs[4] = dom.createMorphAt(element2,0,0);
          return morphs;
        },
        statements: [
          ["content","currentSwagifact.name",["loc",[null,[7,31],[7,56]]]],
          ["block","each",[["get","currentSwagifact.requires",["loc",[null,[16,20],[16,45]]]]],[],0,null,["loc",[null,[16,12],[18,21]]]],
          ["block","each",[["get","currentSwagifact.provides",["loc",[null,[28,20],[28,45]]]]],[],1,null,["loc",[null,[28,12],[30,21]]]],
          ["attribute","href",["concat",[["get","currentSwagifact.link",["loc",[null,[39,21],[39,42]]]]]]],
          ["content","currentSwagifact.link",["loc",[null,[39,46],[39,71]]]]
        ],
        locals: [],
        templates: [child0, child1]
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 46,
              "column": 0
            },
            "end": {
              "line": 48,
              "column": 0
            }
          },
          "moduleName": "swag-ember/templates/components/swag-map.hbs"
        },
        arity: 0,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createElement("p");
          var el2 = dom.createTextNode("Hover over swagifact for info.");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes() { return []; },
        statements: [

        ],
        locals: [],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 49,
            "column": 0
          }
        },
        "moduleName": "swag-ember/templates/components/swag-map.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        dom.setNamespace("http://www.w3.org/2000/svg");
        var el1 = dom.createElement("svg");
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(fragment,2,2,contextualElement);
        dom.insertBoundary(fragment, null);
        return morphs;
      },
      statements: [
        ["block","if",[["get","currentSwagifact",["loc",[null,[5,6],[5,22]]]]],[],0,1,["loc",[null,[5,0],[48,7]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('swag-ember/templates/components/swag-swagifact', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 14,
              "column": 8
            },
            "end": {
              "line": 16,
              "column": 8
            }
          },
          "moduleName": "swag-ember/templates/components/swag-swagifact.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element1, 'class');
          morphs[1] = dom.createMorphAt(element1,0,0);
          return morphs;
        },
        statements: [
          ["attribute","class",["concat",[["subexpr","if",[["get","skill.completed",["loc",[null,[15,24],[15,39]]]],"completed"],[],["loc",[null,[15,19],[15,53]]]]]]],
          ["content","skill.name",["loc",[null,[15,55],[15,69]]]]
        ],
        locals: ["skill"],
        templates: []
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 21,
              "column": 8
            },
            "end": {
              "line": 23,
              "column": 8
            }
          },
          "moduleName": "swag-ember/templates/components/swag-swagifact.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(2);
          morphs[0] = dom.createAttrMorph(element0, 'class');
          morphs[1] = dom.createMorphAt(element0,0,0);
          return morphs;
        },
        statements: [
          ["attribute","class",["concat",[["subexpr","if",[["get","skill.completed",["loc",[null,[22,24],[22,39]]]],"completed"],[],["loc",[null,[22,19],[22,53]]]]]]],
          ["content","skill.name",["loc",[null,[22,55],[22,69]]]]
        ],
        locals: ["skill"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 33,
            "column": 0
          }
        },
        "moduleName": "swag-ember/templates/components/swag-swagifact.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","swag-icon");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("circle");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","swagifact-name");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","swagifact-meta");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("strong");
        var el5 = dom.createTextNode("description:");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("strong");
        var el5 = dom.createTextNode("completed:");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(" ");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("strong");
        var el5 = dom.createTextNode("requires:");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","requires");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("strong");
        var el5 = dom.createTextNode("provides:");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","provides");
        var el5 = dom.createTextNode("\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createElement("strong");
        var el5 = dom.createTextNode("Send Verb to Learninglocker");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode(":\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createElement("button");
        dom.setAttribute(el6,"type","button small");
        var el7 = dom.createTextNode("Completed");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(fragment, [2]);
        var element4 = dom.childAt(element3, [1]);
        var element5 = dom.childAt(element4, [9, 2, 1, 0]);
        var morphs = new Array(8);
        morphs[0] = dom.createAttrMorph(element2, 'style');
        morphs[1] = dom.createMorphAt(dom.childAt(element2, [3]),1,1);
        morphs[2] = dom.createAttrMorph(element3, 'style');
        morphs[3] = dom.createMorphAt(dom.childAt(element4, [1, 2]),0,0);
        morphs[4] = dom.createMorphAt(dom.childAt(element4, [3]),2,2);
        morphs[5] = dom.createMorphAt(dom.childAt(element4, [5, 2]),1,1);
        morphs[6] = dom.createMorphAt(dom.childAt(element4, [7, 2]),1,1);
        morphs[7] = dom.createElementMorph(element5);
        return morphs;
      },
      statements: [
        ["attribute","style",["get","style",["loc",[null,[1,31],[1,36]]]]],
        ["content","item.name",["loc",[null,[4,4],[4,17]]]],
        ["attribute","style",["get","style",["loc",[null,[8,36],[8,41]]]]],
        ["content","item.description",["loc",[null,[10,41],[10,61]]]],
        ["content","completed",["loc",[null,[11,36],[11,49]]]],
        ["block","each",[["get","requires",["loc",[null,[14,16],[14,24]]]]],[],0,null,["loc",[null,[14,8],[16,17]]]],
        ["block","each",[["get","provides",["loc",[null,[21,16],[21,24]]]]],[],1,null,["loc",[null,[21,8],[23,17]]]],
        ["element","action",["sendCompleted"],[],["loc",[null,[28,40],[28,66]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('swag-ember/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 5,
                "column": 4
              },
              "end": {
                "line": 5,
                "column": 74
              }
            },
            "moduleName": "swag-ember/templates/index.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["content","swagmap.name",["loc",[null,[5,58],[5,74]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 4,
              "column": 2
            },
            "end": {
              "line": 6,
              "column": 2
            }
          },
          "moduleName": "swag-ember/templates/index.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var morphs = new Array(1);
          morphs[0] = dom.createMorphAt(fragment,1,1,contextualElement);
          return morphs;
        },
        statements: [
          ["block","link-to",["swagmap",["get","swagmap",["loc",[null,[5,25],[5,32]]]]],["class","list-group-item"],0,null,["loc",[null,[5,4],[5,86]]]]
        ],
        locals: ["swagmap"],
        templates: [child0]
      };
    }());
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 9,
            "column": 0
          }
        },
        "moduleName": "swag-ember/templates/index.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-md-12");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        var el3 = dom.createTextNode("Select A Swag Map");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","list-group");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var morphs = new Array(1);
        morphs[0] = dom.createMorphAt(dom.childAt(fragment, [0, 3]),1,1);
        return morphs;
      },
      statements: [
        ["block","each",[["get","model",["loc",[null,[4,10],[4,15]]]]],[],0,null,["loc",[null,[4,2],[6,11]]]]
      ],
      locals: [],
      templates: [child0]
    };
  }()));

});
define('swag-ember/templates/swagmap', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 33,
                "column": 14
              },
              "end": {
                "line": 33,
                "column": 54
              }
            },
            "moduleName": "swag-ember/templates/swagmap.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["inline","fa-icon",["tick"],[],["loc",[null,[33,36],[33,54]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      var child1 = (function() {
        return {
          meta: {
            "revision": "Ember@2.0.1",
            "loc": {
              "source": null,
              "start": {
                "line": 33,
                "column": 54
              },
              "end": {
                "line": 33,
                "column": 81
              }
            },
            "moduleName": "swag-ember/templates/swagmap.hbs"
          },
          arity: 0,
          cachedFragment: null,
          hasRendered: false,
          buildFragment: function buildFragment(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            return el0;
          },
          buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
            var morphs = new Array(1);
            morphs[0] = dom.createMorphAt(fragment,0,0,contextualElement);
            dom.insertBoundary(fragment, 0);
            dom.insertBoundary(fragment, null);
            return morphs;
          },
          statements: [
            ["inline","fa-icon",["times"],[],["loc",[null,[33,62],[33,81]]]]
          ],
          locals: [],
          templates: []
        };
      }());
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 29,
              "column": 6
            },
            "end": {
              "line": 35,
              "column": 6
            }
          },
          "moduleName": "swag-ember/templates/swagmap.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("tr");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element1 = dom.childAt(fragment, [1]);
          var morphs = new Array(4);
          morphs[0] = dom.createAttrMorph(element1, 'class');
          morphs[1] = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
          morphs[2] = dom.createMorphAt(dom.childAt(element1, [3]),0,0);
          morphs[3] = dom.createMorphAt(dom.childAt(element1, [5]),0,0);
          return morphs;
        },
        statements: [
          ["attribute","class",["concat",[["subexpr","unless",[["get","skill.wanted",["loc",[null,[30,28],[30,40]]]],"fade-row"],[],["loc",[null,[30,19],[30,53]]]]]]],
          ["inline","input",[],["type","checkbox","checked",["subexpr","@mut",[["get","skill.wanted",["loc",[null,[31,46],[31,58]]]]],[],[]]],["loc",[null,[31,14],[31,60]]]],
          ["content","skill.name",["loc",[null,[32,14],[32,28]]]],
          ["block","if",[["get","skill.fufilled",["loc",[null,[33,20],[33,34]]]]],[],0,1,["loc",[null,[33,14],[33,88]]]]
        ],
        locals: ["skill"],
        templates: [child0, child1]
      };
    }());
    var child1 = (function() {
      return {
        meta: {
          "revision": "Ember@2.0.1",
          "loc": {
            "source": null,
            "start": {
              "line": 45,
              "column": 6
            },
            "end": {
              "line": 49,
              "column": 6
            }
          },
          "moduleName": "swag-ember/templates/swagmap.hbs"
        },
        arity: 1,
        cachedFragment: null,
        hasRendered: false,
        buildFragment: function buildFragment(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("tr");
          var el2 = dom.createTextNode("\n          ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("td");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
          var element0 = dom.childAt(fragment, [1]);
          var morphs = new Array(3);
          morphs[0] = dom.createAttrMorph(element0, 'class');
          morphs[1] = dom.createElementMorph(element0);
          morphs[2] = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
          return morphs;
        },
        statements: [
          ["attribute","class",["concat",[["subexpr","unless",[["get","swagifact.inMap",["loc",[null,[46,28],[46,43]]]],"fade-row"],[],["loc",[null,[46,19],[46,56]]]]," ",["subexpr","unless",[["get","swagifact.dependenciesMet",["loc",[null,[46,66],[46,91]]]],"table-danger"],[],["loc",[null,[46,57],[46,108]]]]]]],
          ["element","action",["swagifactHover",["get","swagifact",["loc",[null,[46,136],[46,145]]]]],["on","mouseEnter"],["loc",[null,[46,110],[46,163]]]],
          ["content","swagifact.name",["loc",[null,[47,14],[47,32]]]]
        ],
        locals: ["swagifact"],
        templates: []
      };
    }());
    return {
      meta: {
        "revision": "Ember@2.0.1",
        "loc": {
          "source": null,
          "start": {
            "line": 1,
            "column": 0
          },
          "end": {
            "line": 63,
            "column": 0
          }
        },
        "moduleName": "swag-ember/templates/swagmap.hbs"
      },
      arity: 0,
      cachedFragment: null,
      hasRendered: false,
      buildFragment: function buildFragment(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-md-9");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        dom.setAttribute(el2,"class","display-4");
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-md-3");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("section");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h3");
        var el4 = dom.createTextNode("Skills:");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("\n      Uncheck skills you don't want/need.\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3,"class","table table-sm");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("thead");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("tr");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createComment("");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("\n            Name\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("th");
        var el7 = dom.createTextNode("\n            fufilled\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n    ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("section");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("h4");
        var el4 = dom.createTextNode("Swagifacts");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("table");
        dom.setAttribute(el3,"class","table table-sm");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("tbody");
        var el5 = dom.createTextNode("\n\n");
        dom.appendChild(el4, el5);
        var el5 = dom.createComment("");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n    ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("ul");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("em");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6,"style","background-color: #f2dede;");
        var el7 = dom.createTextNode("red");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode(" = unmet skill dependencies");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("li");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("em");
        var el6 = dom.createElement("span");
        dom.setAttribute(el6,"style","opacity: 0.3;");
        var el7 = dom.createTextNode("grey");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode(" = contains no wanted skills");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      buildRenderNodes: function buildRenderNodes(dom, fragment, contextualElement) {
        var element2 = dom.childAt(fragment, [0]);
        var element3 = dom.childAt(fragment, [2]);
        var element4 = dom.childAt(element3, [1, 5]);
        var morphs = new Array(5);
        morphs[0] = dom.createMorphAt(dom.childAt(element2, [1]),0,0);
        morphs[1] = dom.createMorphAt(element2,3,3);
        morphs[2] = dom.createMorphAt(dom.childAt(element4, [1, 1, 1]),1,1);
        morphs[3] = dom.createMorphAt(dom.childAt(element4, [3]),1,1);
        morphs[4] = dom.createMorphAt(dom.childAt(element3, [3, 3, 1]),1,1);
        return morphs;
      },
      statements: [
        ["content","model.name",["loc",[null,[2,24],[2,38]]]],
        ["inline","swag-map",[],["swagifacts",["subexpr","@mut",[["get","model.swagifacts",["loc",[null,[4,24],[4,40]]]]],[],[]],"currentSwagifact",["subexpr","@mut",[["get","currentSwagifact",["loc",[null,[4,58],[4,74]]]]],[],[]]],["loc",[null,[4,2],[4,76]]]],
        ["inline","input",[],["type","checkbox","checked",["subexpr","@mut",[["get","allSkillsWanted",["loc",[null,[17,44],[17,59]]]]],[],[]]],["loc",[null,[17,12],[17,61]]]],
        ["block","each",[["get","skills",["loc",[null,[29,14],[29,20]]]]],[],0,null,["loc",[null,[29,6],[35,15]]]],
        ["block","each",[["get","model.swagifacts",["loc",[null,[45,14],[45,30]]]]],[],1,null,["loc",[null,[45,6],[49,15]]]]
      ],
      locals: [],
      templates: [child0, child1]
    };
  }()));

});
define('swag-ember/tests/adapters/application.jshint', function () {

  'use strict';

  QUnit.module('JSHint - adapters');
  QUnit.test('adapters/application.js should pass jshint', function(assert) { 
    assert.ok(true, 'adapters/application.js should pass jshint.'); 
  });

});
define('swag-ember/tests/adapters/swagmap.jshint', function () {

  'use strict';

  QUnit.module('JSHint - adapters');
  QUnit.test('adapters/swagmap.js should pass jshint', function(assert) { 
    assert.ok(true, 'adapters/swagmap.js should pass jshint.'); 
  });

});
define('swag-ember/tests/app.jshint', function () {

  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('app.js should pass jshint', function(assert) { 
    assert.ok(true, 'app.js should pass jshint.'); 
  });

});
define('swag-ember/tests/components/swag-map.jshint', function () {

  'use strict';

  QUnit.module('JSHint - components');
  QUnit.test('components/swag-map.js should pass jshint', function(assert) { 
    assert.ok(true, 'components/swag-map.js should pass jshint.'); 
  });

});
define('swag-ember/tests/components/swag-swagifact.jshint', function () {

  'use strict';

  QUnit.module('JSHint - components');
  QUnit.test('components/swag-swagifact.js should pass jshint', function(assert) { 
    assert.ok(true, 'components/swag-swagifact.js should pass jshint.'); 
  });

});
define('swag-ember/tests/controllers/application.jshint', function () {

  'use strict';

  QUnit.module('JSHint - controllers');
  QUnit.test('controllers/application.js should pass jshint', function(assert) { 
    assert.ok(true, 'controllers/application.js should pass jshint.'); 
  });

});
define('swag-ember/tests/controllers/index.jshint', function () {

  'use strict';

  QUnit.module('JSHint - controllers');
  QUnit.test('controllers/index.js should pass jshint', function(assert) { 
    assert.ok(true, 'controllers/index.js should pass jshint.'); 
  });

});
define('swag-ember/tests/controllers/swagmap.jshint', function () {

  'use strict';

  QUnit.module('JSHint - controllers');
  QUnit.test('controllers/swagmap.js should pass jshint', function(assert) { 
    assert.ok(true, 'controllers/swagmap.js should pass jshint.'); 
  });

});
define('swag-ember/tests/helpers/resolver', ['exports', 'ember/resolver', 'swag-ember/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('swag-ember/tests/helpers/resolver.jshint', function () {

  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/resolver.js should pass jshint', function(assert) { 
    assert.ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('swag-ember/tests/helpers/start-app', ['exports', 'ember', 'swag-ember/app', 'swag-ember/config/environment'], function (exports, Ember, Application, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('swag-ember/tests/helpers/start-app.jshint', function () {

  'use strict';

  QUnit.module('JSHint - helpers');
  QUnit.test('helpers/start-app.js should pass jshint', function(assert) { 
    assert.ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('swag-ember/tests/models/skill.jshint', function () {

  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/skill.js should pass jshint', function(assert) { 
    assert.ok(true, 'models/skill.js should pass jshint.'); 
  });

});
define('swag-ember/tests/models/swagifact.jshint', function () {

  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/swagifact.js should pass jshint', function(assert) { 
    assert.ok(true, 'models/swagifact.js should pass jshint.'); 
  });

});
define('swag-ember/tests/models/swagmap.jshint', function () {

  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/swagmap.js should pass jshint', function(assert) { 
    assert.ok(true, 'models/swagmap.js should pass jshint.'); 
  });

});
define('swag-ember/tests/models/user.jshint', function () {

  'use strict';

  QUnit.module('JSHint - models');
  QUnit.test('models/user.js should pass jshint', function(assert) { 
    assert.ok(true, 'models/user.js should pass jshint.'); 
  });

});
define('swag-ember/tests/router.jshint', function () {

  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('router.js should pass jshint', function(assert) { 
    assert.ok(true, 'router.js should pass jshint.'); 
  });

});
define('swag-ember/tests/routes/application.jshint', function () {

  'use strict';

  QUnit.module('JSHint - routes');
  QUnit.test('routes/application.js should pass jshint', function(assert) { 
    assert.ok(true, 'routes/application.js should pass jshint.'); 
  });

});
define('swag-ember/tests/routes/index.jshint', function () {

  'use strict';

  QUnit.module('JSHint - routes');
  QUnit.test('routes/index.js should pass jshint', function(assert) { 
    assert.ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('swag-ember/tests/routes/swagmap.jshint', function () {

  'use strict';

  QUnit.module('JSHint - routes');
  QUnit.test('routes/swagmap.js should pass jshint', function(assert) { 
    assert.ok(true, 'routes/swagmap.js should pass jshint.'); 
  });

});
define('swag-ember/tests/serializers/application.jshint', function () {

  'use strict';

  QUnit.module('JSHint - serializers');
  QUnit.test('serializers/application.js should pass jshint', function(assert) { 
    assert.ok(true, 'serializers/application.js should pass jshint.'); 
  });

});
define('swag-ember/tests/services/current-user.jshint', function () {

  'use strict';

  QUnit.module('JSHint - services');
  QUnit.test('services/current-user.js should pass jshint', function(assert) { 
    assert.ok(true, 'services/current-user.js should pass jshint.'); 
  });

});
define('swag-ember/tests/services/lrs.jshint', function () {

  'use strict';

  QUnit.module('JSHint - services');
  QUnit.test('services/lrs.js should pass jshint', function(assert) { 
    assert.ok(true, 'services/lrs.js should pass jshint.'); 
  });

});
define('swag-ember/tests/test-helper', ['swag-ember/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('swag-ember/tests/test-helper.jshint', function () {

  'use strict';

  QUnit.module('JSHint - .');
  QUnit.test('test-helper.js should pass jshint', function(assert) { 
    assert.ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/adapters/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:application', 'Unit | Adapter | application', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('swag-ember/tests/unit/adapters/application-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/adapters');
  QUnit.test('unit/adapters/application-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/adapters/application-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/adapters/swagmap-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('adapter:swagmap', 'Unit | Adapter | swagmap', {
    // Specify the other units that are required for this test.
    // needs: ['serializer:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var adapter = this.subject();
    assert.ok(adapter);
  });

});
define('swag-ember/tests/unit/adapters/swagmap-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/adapters');
  QUnit.test('unit/adapters/swagmap-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/adapters/swagmap-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/controllers/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:application', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('swag-ember/tests/unit/controllers/application-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/controllers');
  QUnit.test('unit/controllers/application-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/controllers/application-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/controllers/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:index', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('swag-ember/tests/unit/controllers/index-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/controllers');
  QUnit.test('unit/controllers/index-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/controllers/index-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/controllers/swagmap-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('controller:swagmap', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

});
define('swag-ember/tests/unit/controllers/swagmap-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/controllers');
  QUnit.test('unit/controllers/swagmap-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/controllers/swagmap-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/models/skill-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('skill', 'Unit | Model | skill', {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('swag-ember/tests/unit/models/skill-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/models');
  QUnit.test('unit/models/skill-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/models/skill-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/models/swagifact-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('swagifact', 'Unit | Model | swagifact', {
    // Specify the other units that are required for this test.
    needs: ['model:skill', 'model:swagmap', 'service:current-user']
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('swag-ember/tests/unit/models/swagifact-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/models');
  QUnit.test('unit/models/swagifact-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/models/swagifact-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/models/user-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel('user', 'Unit | Model | user', {
    // Specify the other units that are required for this test.
    needs: ['model:swagifact', 'model:skill']
  });

  ember_qunit.test('it exists', function (assert) {
    var model = this.subject();
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('swag-ember/tests/unit/models/user-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/models');
  QUnit.test('unit/models/user-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/models/user-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/routes/application-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:application', 'Unit | Route | application', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('swag-ember/tests/unit/routes/application-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/routes');
  QUnit.test('unit/routes/application-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/routes/application-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/routes/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:index', 'Unit | Route | index', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('swag-ember/tests/unit/routes/index-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/routes');
  QUnit.test('unit/routes/index-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/routes/index-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/routes/swagmap-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('route:swagmap', 'Unit | Route | swagmap', {
    // Specify the other units that are required for this test.
    // needs: ['controller:foo']
  });

  ember_qunit.test('it exists', function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

});
define('swag-ember/tests/unit/routes/swagmap-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/routes');
  QUnit.test('unit/routes/swagmap-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/routes/swagmap-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/services/current-user-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:current-user', 'Unit | Service | current user', {
    // Specify the other units that are required for this test.
    needs: ['model:user']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

});
define('swag-ember/tests/unit/services/current-user-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/services');
  QUnit.test('unit/services/current-user-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/services/current-user-test.js should pass jshint.'); 
  });

});
define('swag-ember/tests/unit/services/lrs-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor('service:lrs', 'Unit | Service | lrs', {
    // Specify the other units that are required for this test.
    // needs: ['service:foo']
  });

  // Replace this with your real tests.
  ember_qunit.test('it exists', function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

});
define('swag-ember/tests/unit/services/lrs-test.jshint', function () {

  'use strict';

  QUnit.module('JSHint - unit/services');
  QUnit.test('unit/services/lrs-test.js should pass jshint', function(assert) { 
    assert.ok(true, 'unit/services/lrs-test.js should pass jshint.'); 
  });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('swag-ember/config/environment', ['ember'], function(Ember) {
  var prefix = 'swag-ember';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("swag-ember/tests/test-helper");
} else {
  require("swag-ember/app")["default"].create({"xAPIEndpoint":"http://learninglocker.swag.testing.tunapanda.org/data/xAPI/","xAPIUsername":"caae95f54d6545c76fc289f02a3c1d51c455f7e6","xAPIPassword":"40cb0287f95189298729f6ccc36f6277840604ad","agentEmailOverride":"jake@tunapanda.org","useFixtures":true,"name":"swag-ember","version":"0.0.0+31c8ec15"});
}

/* jshint ignore:end */
//# sourceMappingURL=swag-ember.map