var path = require('path');
var walk = require('walk');

var hashFile = require('./hashFile');

module.exports = function(searchDirectory, onFinish) {
    var manifest = {};

    var walker = walk.walk(searchDirectory, {
        followLinks: false
    });

    walker.on('file', function(root, fileStats, next) {
        // Ignore dot files
        if (fileStats.name.substr(0, 1) === '.')
        {
            next();
            return;
        }

        var filePath = path.join(root, fileStats.name);
        var fileRelativePath = path.resolve(filePath).replace(path.resolve(searchDirectory), '.');

        hashFile(filePath, function(hash) {
            manifest[fileRelativePath] = [
                hash,
                fileStats.size
            ];

            next();
        });
    });

    walker.on('end', function () {
        onFinish(null, JSON.stringify(manifest));
    });
};