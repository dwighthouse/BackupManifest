var fs = require('fs');
var HashStream = require('xxhash').Stream;

module.exports = function(path, onFinish) {
    var hasher = new HashStream(0xCAFEBABE);

    fs.createReadStream(path)
    .pipe(hasher)
    .on('finish', function() {
        onFinish(hasher.read());
    });
}