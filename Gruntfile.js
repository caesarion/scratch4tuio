module.exports = function(grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
            ' * Scratch4TUIO v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2015-<%= grunt.template.today("yyyy") %> <%= pkg.author %>\n' +
            ' * Licensed under the <%= pkg.license %> license\n' +
            ' */\n',

        browserify: {
            options: {
                banner: '<%= banner %>',
            },
            dist: {
                src: [ 'src/index.js' ],
                dest: '<%= pkg.name %>.js',
            },
        },

        uglify: {
            options: {
                compress: {
                    warnings: false
                },
                mangle: true,
                preserveComments: false,
                banner: '<%= banner %>'
            },
            dist: {
                src: '<%= pkg.name %>.js',
                dest: '<%= pkg.name %>.min.js'
            },
        },

        compress: {
            sbx: {
                options: {
                    archive: '<%= pkg.name %>.sbx',
                    mode: 'zip'
                },
                files: [{
                    src: ['_tmp/*'],
                    dest: '.',
                    expand: true,
                    flatten: true,
                    filter: 'isFile'
                }]
            },
        },

        // jshint: {
        //   files: ['src/tuio.js', 'src/extension.js'],
        //   options: {jshintrc: '.jshintrc'}
        // },
    });

    // grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('sbx', 'Create .sbx file.', function() {
        var descr = grunt.file.readJSON('src/descriptor.json');

        var project = grunt.file.readJSON('build-support/sbx/project.json');
        project.info.savedExtensions[0].extensionName = descr.title;
        project.info.savedExtensions[0].javascriptURL = descr.javascriptURL;
        project.info.savedExtensions[0].blockSpecs = descr.descriptors['en'].blocks;
        project.info.savedExtensions[0].menus = descr.descriptors['en'].menus;

        grunt.file.write('_tmp/project.json', JSON.stringify(project, null, 2));

        grunt.file.copy('build-support/sbx/0.png', '_tmp/0.png');
        grunt.file.copy('build-support/sbx/0.wav', '_tmp/0.wav');
    });
    
    grunt.registerTask('sbx-clean', 'Clean temporary .sbx files.', function() {
        grunt.file.delete('_tmp');
    });

    grunt.registerTask('default', ['browserify','uglify','sbx','compress:sbx','sbx-clean']);

};
