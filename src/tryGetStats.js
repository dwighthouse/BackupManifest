'use strict';

var fs = require('fs');
var supplant = require('./supplant');

module.exports = function(path) {
    try {
        return fs.lstatSync(path);
    }
    catch (e) {
        console.error(supplant('\n  error: Path does not exist {path}\n', {
            path: path
        }));
    }
}