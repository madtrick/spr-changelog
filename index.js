'use strict';

var fs             = require('fs');
var path           = require('path');
var flatten        = require('lodash.flatten');
var find           = require('lodash.find');
var keepachangelog = require('keepachangelog');
var Promise        = require('bluebird');

var CHANGELOG_NAMES = ['CHANGELOG', 'CHANGELOG.md'];

module.exports = {
  preMessageHook : function () {
    return new Promise( function(resolve) {
      var changelogSummary;

      var changelogPath = find(
        CHANGELOG_NAMES.map( function (name) {
          return path.join(process.cwd(), name);
        }),
        function (path) {
          return fs.existsSync(path);
        }
      );

      if (changelogPath){
        keepachangelog.read(changelogPath)
        .then( function (changelog) {

          var upcomingChanges = changelog.releases.filter( function (release) {
            return release.version === 'upcoming';
          })[0];

          var changes = flatten(upcomingChanges.Changed);

          console.log(changes);
          changelogSummary = changes.join('\n');
          console.log(changelogSummary);

          resolve(changelogSummary);
        });
      } else {
        resolve('');
      }

    });
  }
};
