'use strict';

var _ = require('lodash');

var tryGetStats = require('./src/tryGetStats');
var createManifest = require('./src/createManifest');
var performCompare = require('./src/performCompare');
var supplant = require('./src/supplant');

var program = require('commander');

program
.version('1.0.0')
.option('-m, --manifest <source-path>', 'Creates a manifest of the directory provided and writes to standard out. Manifest paths are rendered relative to this path.', _.identity)
.option('-c, --compare', 'Compares two directories, manifest files, or any combination of the two.')
.parse(process.argv);

if (_.isString(program.manifest))
{
    var stats = tryGetStats(program.manifest);

    if (!stats)
    {
        return;
    }

    if (!stats.isDirectory())
    {
        console.error(supplant('\n  error: Source path is not a directory {manifest}\n', {
            manifest: program.manifest
        }));
        return;
    }

    createManifest(program.manifest, function(err, manifest) {
        console.log(manifest);
    });

    return;
}

if (program.compare)
{
    var argCount = program.args.length;

    if (argCount !== 2)
    {
        console.error(supplant('\n  error: Must compare exactly two directories, manifest files, or a combination of the two. There were {argCount} paths provided.\n', {
            argCount: argCount
        }));
        return;
    }

    performCompare(program.args[0], program.args[1]);

    return;
}