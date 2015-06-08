var _ = require('lodash');

// Based on: http://javascript.crockford.com/remedial.html
module.exports = function(string, values) {
    return string.replace(
        /\{([^{}]*)\}/g,
        function (match, key) {
            return _.has(values, key) ? values[key] : match;
        }
    );
};