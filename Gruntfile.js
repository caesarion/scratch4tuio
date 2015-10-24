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

        concat: {
            options: {
                stripBanners: true,
                banner: '<%= banner %>'
            },
            dist: {
                src: [
                    'build-support/js/lib-header.js',
                    'node_modules/osc/dist/osc.js',
                    'node_modules/lodash/lodash.js',
                    'node_modules/socket.io-client/socket.io.js',
                    'src/tuio.js',
                    'build-support/js/lib-footer.js',
                    'build-support/js/ext-header.js',
                    'src/extension.js',
                    'build-support/js/ext-footer.js'
                ],
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
                src: '<%= concat.dist.dest %>',
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
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-compress');

    grunt.registerTask('sbx', 'Create .sbx file', function() {
        var descr = grunt.file.readJSON('src/descriptor.json');

        var project = grunt.file.readJSON('build-support/sbx/project.json');
        project.info.savedExtensions[0].extensionName = descr.title;
        project.info.savedExtensions[0].javascriptURL = descr.script_url;
        project.info.savedExtensions[0].blockSpecs = descr.blocks['en'];
        project.info.savedExtensions[0].menus = descr.menus['en'];

        grunt.file.write('_tmp/project.json', JSON.stringify(project, null, 2));

        grunt.file.copy('build-support/sbx/0.png', '_tmp/0.png');
        grunt.file.copy('build-support/sbx/0.wav', '_tmp/0.wav');

        grunt.task.run('compress:sbx');

        grunt.file.delete('_tmp');
    });

    grunt.registerTask('default', ['concat','uglify','sbx']);

};
