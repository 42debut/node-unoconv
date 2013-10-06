'use strict';

var _ = require('underscore'),
    childProcess = require('child_process'),
    mime = require('mime');

var unoconv = exports = module.exports = {};


var spawn = function(file, args, options, callback) {
    var child,
        stdout = [],
        stderr = [];

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
            return callback(err);
        }
        if (stderr) {
            return callback(new Error(stderr.toString()));
        }
        callback(null, stdout);
    });

    child.stdout.on('data', function (data) {
        stdout.push(data);
    });

    child.stderr.on('data', function (data) {
        stderr.push(data);
    });

    child.on('exit', function () {
        if (stderr.length) {
            return callback(new Error(Buffer.concat(stderr).toString()));
        }
        callback(null, Buffer.concat(stdout));
    });
}


/**
* Convert a document.
*
* @param {String} file
* @param {String} outputFormat
* @param {Object|Function} options
* @param {Function} callback
* @api public
*/
unoconv.convert = function(file, options, callback) {
    var options = options || {};
    var args = [];

    if (options.sheet) {
        args.push('--sheet=' + options.sheet + '');
    }

    args.push('-f');
    args.push(options.outputFormat || 'csv');
    args.push('--stdout');

    return spawn(file, args, options, callback);
};

/**
*
*
*/
unoconv.getSheets = function(file, options, callback) {
    var args = [
        '--show-sheet-names'
    ];
    return spawn(file, args, options, function(err, buffer) {
        if (err) return callback(err);
        return callback(null, buffer.toString()
                                    .split('\n')
                                    .filter(function(line) { return line.length > 0; }));
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
    var self = this,
        args,
        bin = 'unoconv';

    args = [ '--listener' ];

    if (options && options.port) {
        args.push('-p' + options.port);
    }

    if (options && options.bin) {
        bin = options.bin;
    }

    return childProcess.spawn(bin, args);
};

/**
* Detect supported conversion formats.
*
* @param {Object|Function} options
* @param {Function} callback
*/
unoconv.detectSupportedFormats = function (options, callback) {
    var self = this,
        docType,
        detectedFormats = {
            document: [],
            graphics: [],
            presentation: [],
            spreadsheet: []
        },
        bin = 'unoconv';

    if (_.isFunction(options)) {
        callback = options;
        options = null;
    }

    if (options && options.bin) {
        bin = options.bin;
    }

    childProcess.execFile(bin, [ '--show' ], function (err, stdout, stderr) {
        if (err) {
            return callback(err);
        }

        // For some reason --show outputs to stderr instead of stdout
        var lines = stderr.split('\n');

        lines.forEach(function (line) {
            if (line === 'The following list of document formats are currently available:') {
                docType = 'document';
            } else if (line === 'The following list of graphics formats are currently available:') {
                docType = 'graphics';
            } else if (line === 'The following list of presentation formats are currently available:') {
                docType = 'presentation';
            } else if (line === 'The following list of spreadsheet formats are currently available:') {
                docType = 'spreadsheet';
            } else {
                var format = line.match(/^(.*)-/);

                if (format) {
                    format = format[1].trim();
                }

                var extension = line.match(/\[(.*)\]/);

                if (extension) {
                    extension = extension[1].trim().replace('.', '');
                }

                var description = line.match(/-(.*)\[/);

                if (description) {
                    description = description[1].trim();
                }

                if (format && extension && description) {
                    detectedFormats[docType].push({
                        'format': format,
                        'extension': extension,
                        'description': description,
                        'mime': mime.lookup(extension)
                    });
                }
            }
        });

        if (detectedFormats.document.length < 1 &&
            detectedFormats.graphics.length < 1 &&
            detectedFormats.presentation.length < 1 &&
            detectedFormats.spreadsheet.length < 1) {
            return callback(new Error('Unable to detect supported formats'));
        }

        callback(null, detectedFormats);
    });
};
