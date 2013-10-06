'use strict';

var _ = require('underscore'),
    childProcess = require('child_process'),
    mime = require('mime'),
    Q = require('q');

var unoconv = exports = module.exports = {};


var spawn = function(file, args, options) {
    var child,
        stdout = [],
        stderr = [],
        deferred = Q.defer();

    if (options.exportFilters) {
        args.unshift('FilterOptions=' + options.exportFilters);
        args.unshift('-e');
    }

    if (_.isFunction(options)) {
        callback = options;
        options = {};
    }

    if (options.port) {
        args.push('-p' + options.port);
    }

    args.push(file);

    child = childProcess.spawn((options.bin || './bin/unoconv'), args, function (err, stdout, stderr) {
        if (err) {
            deferred.reject(err);
        }
        if (stderr) {
            deferred.reject(new Error(stderr.toString()));
        }
        deferred.resolve(stdout);
    });

    child.stdout.on('data', function (data) {
        stdout.push(data);
    });

    child.stderr.on('data', function (data) {
        stderr.push(data);
    });

    child.on('exit', function () {
        if (stderr.length) {
            return deferred.reject(new Error(Buffer.concat(stderr).toString()));
        }
        deferred.resolve(Buffer.concat(stdout));
    });

    return deferred.promise;
}


/**
* Convert a document.
*
* @param {String} file
* @param {String} outputFormat
* @param {Object|Function} options
* @api public
*/
unoconv.convert = function(file, options) {
    var options = options || {};
    var args = [];

    if (options.sheet) {
        args.push('--sheet=' + options.sheet + '');
    }

    args.push('-f');
    args.push(options.outputFormat || 'csv');
    args.push('--stdout');

    return spawn(file, args, options);
};

/**
*
*
*/
unoconv.getSheets = function(file, options) {
    var args = [
        '--show-sheet-names'
    ];
    return spawn(file, args, options).then(function(buffer) {
        return buffer.toString().split('\n').filter(function(line) {
            return line.length > 0;
        });
    });
};

/**
* Start a listener.
*
* @param {Object} options
* @return {ChildProcess}
* @api public
*/
unoconv.listen = function (options) {
    var bin = './bin/unoconv';

    args = [ '--listener' ];

    if (options && options.port) {
        args.push('-p' + options.port);
    }

    if (options && options.bin) {
        bin = options.bin;
    }

    return childProcess.spawn(bin, args);
};
