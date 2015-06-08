var fs = require('fs');
var q = require('q');
var _ = require('lodash');

var tryGetStats = require('./tryGetStats');
var createManifest = require('./createManifest');
var supplant = require('./supplant');

var promisingManifestCreator = q.denodeify(createManifest);
var promisingReadFile = q.denodeify(fs.readFile);
var compareManifests = require('./compareManifests');

function getManifestPromise(path, stats) {
    var promiser = stats.isDirectory() ? promisingManifestCreator : promisingReadFile;
    return promiser(path);
}

module.exports = function(aPath, bPath) {
    var stats = _.compact([
        tryGetStats(aPath),
        tryGetStats(bPath)
    ]);

    if (stats.length !== 2)
    {
        return;
    }

    if ((!stats[0].isDirectory() && !stats[0].isFile()) || (!stats[1].isDirectory() && !stats[1].isFile()))
    {
        console.error('\n  error: One or both of the paths were not files or directories.\n');
        return;
    }

    q.allSettled([
        getManifestPromise(aPath, stats[0]),
        getManifestPromise(bPath, stats[1])
    ])
    .then(function(results) {
        _.chain(results).reject({state: 'fulfilled'}).pluck('reason').each(function(reason) {
            console.error(supplant('\n  error: Failed to create or open manifest because {reason}\n', {
                reason: reason
            }));
        }).value();

        var manifests = _.chain(results).filter({state: 'fulfilled'}).pluck('value').map(JSON.parse).value();

        if (manifests.length === 2)
        {
            console.log(compareManifests(manifests[0], manifests[1]));
        }
    })
    .done();
};