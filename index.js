'use strict';

/**
 * Builds the cordova project for the iOS platform.
 *
 * @author Sam Verschueren      <sam.verschueren@gmail.com>
 * @since  30 April 2015
 */

// module dependencies
var path = require('path'),
    fs = require('fs'),
    through = require('through2'),
    gutil = require('gulp-util'),
    Q = require('q'),
    cordovaLib = require('cordova-lib').cordova,
    cordova = cordovaLib.raw;

// export the module
module.exports = function(options) {
    options = options || {};

    return through.obj(function(file, enc, cb) {
        // Change the working directory
        process.env.PWD = file.path;

        // Pipe the file to the next step
        this.push(file);

        cb();
    }, function(cb) {
        var iosPath = path.join(cordovaLib.findProjectRoot(), 'platforms', 'ios');

        var exists = fs.existsSync(iosPath),
            reAdd = exists === true && options.rm === true;

        Q.fcall(function() {
            if(reAdd) {
                // First remove the platform if we have to re-add it
                return cordova.platforms('rm', 'ios');
            }
        }).then(function() {
            if(exists === false || reAdd) {
                // Add the iOS platform if it does not exist or we have to re-add it
                return cordova.platforms('add', 'ios');
            }
        }).then(function() {
            var buildOptions = {
                codeSignIdentity: options.codeSignIdentity,
                provisioningProfile: options.provisioningProfile
            };

            // Build the platform
            return cordova.build({platforms: ['ios'], options: buildOptions});
        }).then(function() {
            var base = path.join(iosPath, 'build/device'),
                cwd = process.env.PWD;
            var filePath = path.join(base, '*.ipa');

            // Push the file to the result set
            self.push(new gutil.File({
                base: base,
                cwd: cwd,
                path: filePath,
                contents: fs.readFileSync(filePath)
            }));

            cb();
        }).catch(function(err) {
            // Return an error if something happened
            cb(new gutil.PluginError('gulp-cordova-build-ios', err.message));
        });
    });
};
