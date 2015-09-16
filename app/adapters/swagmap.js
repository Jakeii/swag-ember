import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  //namespace: 'api'
  urlForFindRecord() {
    return 'https://rawgit.com/tunapanda/swagmaps/3285ac0826815078f49b67520509b045f826fcca/PythonExample/v2.0.json';
  },
  urlForFindAll() {
    return 'https://rawgit.com/tunapanda/swagmaps/3285ac0826815078f49b67520509b045f826fcca/PythonExample/v2.0.json';
  },
});
