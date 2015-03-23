'use strict';

var fs             = require('fs');
var path           = require('path');
var find           = require('lodash.find');
var keepachangelog = require('keepachangelog');
var Promise        = require('bluebird');

var CHANGELOG_NAMES = ['CHANGELOG', 'CHANGELOG.md'];

module.exports = {
  preMessageHook : function () {
    return new Promise( function(resolve) {

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

          var upcoming,
              changelogSummary;

          upcoming = changelog.releases.filter( function (release) {
            return release.version === 'upcoming';
          })[0];

          changelogSummary = ['Summary on changes included in this pull request'];
          changelogSummary = ['Changed', 'Added', 'Removed'].reduce( function (summary, group) {
            if (upcoming[group]) {
              return summary.concat(buildChangesGroup(group, upcoming[group]));
            } else {
              return summary;
            }
          }, changelogSummary);

          changelogSummary = changelogSummary.join('\n');

          resolve(changelogSummary);
        });
      } else {
        resolve('');
      }

    });
  }
};

function buildChangesGroup(groupName, changes) {
  return [
    markdownHeading(groupName),
    markdownListify(changes)
  ];
}


function markdownHeading(value) {
  return '#### ' + value;
}

function markdownListify(elements) {
  return elements.map( function (el) {
    var markdownElement = el.map(transformJsonMLIntoMarkdownString).join('');
    return '- ' + markdownElement + '\n';
  }).join('');
}

function transformJsonMLIntoMarkdownString (el) {
  if (typeof el === 'string') {
    return el;
  }

  var tagName = el.shift();

  if (tagName === 'inlinecode') {
    return buildAndSurroundElementList('`', el);
  } else if (tagName === 'em') {
    return buildAndSurroundElementList('*', el);
  } else {
    throw new Error('Unknown tag ' + tagName);
  }
}

function buildAndSurroundElementList (marker, els) {
  return marker + buildElementList(els) + marker;
}

function buildElementList (md, sep) {
  sep = sep || '';

  if (md) {
    return md.map(transformJsonMLIntoMarkdownString).join(sep);
  } else {
    return '';
  }
}
