const existsSync = require('fs').existsSync;
exports.hyphenate = function (variable) {
    return variable.replaceAll(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

exports.fileExists = function (file) {
    return !!existsSync(file);
}