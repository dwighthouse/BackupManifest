var _ = require('lodash');
var supplant = require('./supplant');

function aspectDiffString(list, prefix) {
    if (_.isEmpty(list))
    {
        return;
    }

    return supplant('{prefix} ({first} vs {second})', {
        prefix: prefix,
        first: list[0],
        second: list[1]
    });
}

function sharedPathDiffString(diff, path) {
    return supplant('Files with identical path ({path}) differ by {differences}', {
        path: path,
        differences: [
            aspectDiffString(diff.hash, 'hash'),
            aspectDiffString(diff.size, 'filesize')
        ].join(' and ')
    });
}

function similarFilesString(similarFileLookup, path) {
    if (!_.has(similarFileLookup, path))
    {
        return ''
    }

    return supplant('; similar file(s) in other directory, moved?: {movedFiles}', {
        movedFiles: similarFileLookup[path].join(', ')
    });
}

function unsharedPathDiffString(similarFileLookup, directoryName, path) {
    return supplant('File ({path}) only exists in {directoryName}{similarFiles}', {
        path: path,
        directoryName: directoryName,
        similarFiles: similarFilesString(similarFileLookup, path)
    });
}

function isFilesizeZero(data) {
    return data[1] === 0;
}

function findSimilarFiles(mainManifest, mainUniquePaths, otherManifest, otherUniquePaths) {
    // Create inverse lookup table for the otherManifest that maps stringified data to a list of paths with the same hash and filesize
    // Ignores files that are empty (filesize === 0), because reporting similarities of empty files is not helpful
    var otherListInverseFileLookup = _.chain(otherManifest).pick(otherUniquePaths).omit(isFilesizeZero).mapValues(JSON.stringify).invert(true).value();

    // Create an object that maps a path in the mainManifest to a list of potential duplicates paths from the otherManifest
    return _.chain(_.zipObject(mainUniquePaths, mainUniquePaths)).mapValues(function(path) {
        return otherListInverseFileLookup[JSON.stringify(mainManifest[path])];
    }).omit(_.isEmpty).value();
}

module.exports = function(a, b) {
    var aPaths = _.keys(a);
    var bPaths = _.keys(b);

    // Find diff occurances with shared paths
    var sharedPaths = _.intersection(aPaths, bPaths);
    var diffSet = _.omit(_.zipObject(sharedPaths, _.map(sharedPaths, function(path) {
        return _.pick({
            hash: a[path][0] !== b[path][0] ? [a[path][0], b[path][0]] : void 0,
            size: a[path][1] !== b[path][1] ? [a[path][1], b[path][1]] : void 0
        }, _.identity);
    })), _.isEmpty);

    // Find diff occurances with unshared paths
    var aOnlyPaths = _.difference(aPaths, bPaths);
    var bOnlyPaths = _.difference(bPaths, aPaths);

    // Generate report
    return _.flatten([
        _.map(diffSet, sharedPathDiffString),
        _.map(aOnlyPaths, _.partial(unsharedPathDiffString, findSimilarFiles(a, aOnlyPaths, b, bOnlyPaths), 'the first directory')),
        _.map(bOnlyPaths, _.partial(unsharedPathDiffString, findSimilarFiles(b, bOnlyPaths, a, aOnlyPaths), 'the second directory'))
    ]).join('\n');
};