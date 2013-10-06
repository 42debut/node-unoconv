# node-unoconv

A node.js wrapper for converting documents with [unoconv](http://dag.wieers.com/home-made/unoconv/).

## Requirements

[Unoconv](http://dag.wieers.com/home-made/unoconv/) is required, which requires [LibreOffice](http://www.libreoffice.org/) (or OpenOffice.)

## Install

Install with:

    npm install unoconv

## Converting documents

	var unoconv = require('unoconv');

	unoconv.convert('document.docx').then(function (result) {
		// `result` is a `Buffer` object
		fs.writeFile('converted.pdf', result);
	});

## Starting a listener

You can also start a unoconv listener to avoid launching Libre/OpenOffice on every conversion:

	unoconv.listen();

## API

### unoconv.convert(file, [options])

Converts `file` to the specified `outputFormat`. `options` is an object with the following properties:

* `bin` Path to the unoconv binary
* `port` Unoconv listener port to connect to
* `outputFormat` The format to convert to; defaults to `csv`
* `sheet` The sheet to convert

`callback` gets the arguments `err` and `result`. `result` is returned as a Buffer object.

### unoconv.getSheets(file, [options])

Retrieves the list of sheets contained in the `file`.

* `bin` Path to the unoconv binary
* `port` Unoconv listener port to connect to

`callback` gets the arguments `err` and `result`. `result` is returned as a Buffer object.

### unoconv.listen([options])

Starts a new unoconv listener. `options` accepts the same parameters as `convert()`.

Returns a `ChildProcess` object. You can handle errors by listening to the `stderr` property:

	var listener = unoconv.listen({ port: 2002 });

	listener.stderr.on('data', function (data) {
		console.log('stderr: ' + data.toString('utf8'));
	});
