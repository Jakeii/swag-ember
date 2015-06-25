import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  urlForFind () {
    return 'https://rawgit.com/tunapanda/swagmaps/master/PythonExample/v1.0.json';
  },
  urlForFindAll: function () {
    return 'https://rawgit.com/tunapanda/swagmaps/master/PythonExample/v1.0.json';
  }
});
