import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
  //namespace: 'api'
  urlForFindRecord() {
    return 'https://rawgit.com/tunapanda/swagmaps/7a119d02fda56f1ee9539d871b642821ad270d0e/PythonExample/v2.0.json';
  },
  urlForFindAll() {
    return 'https://rawgit.com/tunapanda/swagmaps/7a119d02fda56f1ee9539d871b642821ad270d0e/PythonExample/v2.0.json';
  },
});
