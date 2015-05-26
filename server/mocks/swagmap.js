module.exports = function(app) {
  var express = require('express');
  var swagmapsRouter = express.Router();

  swagmapsRouter.get('/', function(req, res) {
    res.send({
      'swagmaps': [{
        id: 1,
        name: 'ktouch',
        map: '/swagmaps/ktouch.json'
      }]
    });
  });

  swagmapsRouter.get('/1', function(req, res) {
    res.send({
      'swagmap': {
        id: 1,
        name: 'ktouch',
        map: '/swagmaps/ktouch.json'
      }
    });
  });

  app.use('/api/swagmaps', swagmapsRouter);
};
