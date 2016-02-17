module.exports = function(grunt) {
    'use strict';

    // Force use of Unix newlines
    grunt.util.linefeed = '\n';

    grunt.initConfig({

        pkg: grunt.file.readJSON('package.json'),
        banner: '/*!\n' +
            ' * Scratch4TUIO v<%= pkg.version %> (<%= pkg.homepage %>)\n' +
            ' * Copyright 2015-<%= grunt.template.today("yyyy") %> ' +
                '<%= pkg.author %>\n' +
            ' * Licensed under the <%= pkg.license %> license\n' +
            ' */\n',

        // For checkout of ScratchX
        scratchx_git: 'https://github.com/LLK/scratchx.git',
        scratchx_path: 'node_modules/scratchx',
        // For opening scratchx for testing
        scratchx_url: 'http://localhost:8888/<%= scratchx_path %>?url=http://localhost:8888/<%= pkg.name %>.js#scratch',

        browserify: {
            options: {
                banner: '<%= banner %>',
            },
            dist: {
                src: ['src/index.js'],
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

        jshint: {
            src: 'src/*.js',
            options: {jshintrc: '.jshintrc'}
        },

        jscs: {
            src: 'src/*.js',
            options: {config: '.jscsrc'}
        },

        connect: {
            server: {
                options: {
                    port: 8888,
                    base: '.'
                }
            }
        },

        open: {
            osx: {
                path: '<%= scratchx_url %>',
                app: 'Google Chrome'
            },
            win: {
                path: '<%= scratchx_url %>',
                app: 'chrome'
            }
        },

        watch: {
            osx: {
                files: ['<%= pkg.name %>.js'],
                tasks: ['open:osx'],
                options: {
                //   spawn: false,
                },
            },
            win: {
                files: ['<%= pkg.name %>.js'],
                tasks: ['open:win'],
                options: {
                //   spawn: false,
                },
            }
        },

        gitclone: {
           scratchx: {
               options: {
                   repository: '<%= scratchx_git %>',
                   branch: 'gh-pages',
                   directory: '<%= scratchx_path %>'
               }
           }
        },

        gitpull: {
           scratchx: {
                options: {
                    cwd: './node_modules/scratchx'
                }
           }
        },
    });

    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-git');
    grunt.loadNpmTasks('grunt-jscs');
    grunt.loadNpmTasks('grunt-open');

    grunt.registerTask('sbx-create', 'Creates content for .sbx file.', function() {
        var descr = grunt.file.readJSON('src/descriptor.json');

        var files = grunt.file.expand({cwd: './build-support/sbx'}, '*');
        for (var i = 0; i < files.length; i++) {
            if (files[i] !== 'project.json') {
                grunt.file.copy(
                        './build-support/sbx/' + files[i],
                        '_tmp/' + files[i]
                    );
            }
        }

        var project = grunt.file.readJSON('build-support/sbx/project.json');

        var lang = 'en';
        project.info.savedExtensions[0].extensionName = descr.title;
        project.info.savedExtensions[0].javascriptURL = descr.javascriptURL;
        project.info.savedExtensions[0].blockSpecs =
                descr.descriptors[lang].blocks;
        project.info.savedExtensions[0].menus = descr.descriptors[lang].menus;

        grunt.file.write('_tmp/project.json', JSON.stringify(project, null, 2));
        grunt.log.ok('Created temporary sbx files.');
    });

    grunt.registerTask('sbx-clean', 'Clean temporary .sbx files.', function() {
        grunt.file.delete('_tmp');
        grunt.log.ok('Removed temporary files');
    });

    grunt.registerTask('sbx', ['sbx-create', 'compress:sbx', 'sbx-clean']);

    grunt.registerTask('scratchx', 'Clone or checkout ScratchX for testing.', function() {
        if (grunt.file.exists('./node_modules/scratchx')) {
            // grunt.log.ok('scratchx found, updating branch');
            // grunt.task.run('gitpull');
            grunt.log.ok('scratchx found, to pull the latest version run grunt gitpull:scratchx');
        } else {
            grunt.log.ok('scratchx not found, cloning from github');
            grunt.task.run('gitclone');
        }
    });

    grunt.registerTask('docs', 'Generate the docs for different languages.', function() {
        // Read main template
        var template = grunt.file.read('./build-support/docs/index.html');

        // Read config from json files
        var langs = {};
        var codes = [];
        var files = grunt.file.expand({cwd: './build-support/docs/lang'}, '*.yml');
        for (var i = 0; i < files.length; i++) {
            var yml = grunt.file.readYAML('./build-support/docs/lang/' + files[i]);
            langs[files[i]] = yml;
            codes[yml.code] = yml.name;
        }

        // Generate info/*.html files
        for (var file in langs) {
            var l = langs[file];

            l.site.langs = codes;
            l.site.baseurl = '.';

            var content = grunt.template.process(template, {data: l});
            grunt.file.write('./info/' + l.code + '.html', content);
            grunt.log.write('  ' + l.code + '.html');
        }

        // Generate main index.html file
        var defaultLang = langs['de.yml']; // TODO: Make an option ..
        defaultLang.site.langs = codes;
        defaultLang.site.baseurl = 'info';

        grunt.file.write('./index.html',
            grunt.template.process(template, {data: defaultLang})
        );
        grunt.log.write('  index.html');
    });

    grunt.registerTask('dist', ['jshint', 'jscs', 'browserify', 'uglify', 'sbx']);
    grunt.registerTask('dev', ['jshint', 'jscs', 'browserify']);
    grunt.registerTask('test', ['browserify', 'scratchx',
            'connect', 'open:osx', 'watch:osx']);
    grunt.registerTask('test:win', ['browserify', 'scratchx',
            'connect', 'open:win', 'watch:win']);

    grunt.registerTask('default', ['dist']);

};
