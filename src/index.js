var ext = require('./extension.js');
var data = require('./descriptor.json');

(function(e) { 'use strict';
    // Check for GET param 'lang'
    // codes from https://github.com/khanning/scratch-arduino-extension/blob/da1ab317a215a8c1c5cda1b9db756b9edc14ba68/arduino_extension.js#L533-L541
    var paramString = window.location.search.replace(/^\?|\/$/g, '');
    var vars = paramString.split('&');
    var lang = 'en';
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split('=');
        if (pair.length > 1 && pair[0] == 'lang') {
            lang = pair[1];
        }
    }

    // merge objects
    for (var attrname in ext) {
        if (ext.hasOwnProperty(attrname)) {
            e[attrname] = ext[attrname];
        }
    }

    e.title = data.title;
    e.lang = lang;
    e.descriptor = data.descriptors[lang];

    // register exention
    ScratchExtensions.register(e.title, e.descriptor, e);
})({});
