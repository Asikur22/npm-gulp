var gulp = require('gulp');
var gulpif = require('gulp-if');
var flatten = require('gulp-flatten');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var autoprefixer = require('gulp-autoprefixer');
var browserSync = require('browser-sync').create();
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var cssNano = require('gulp-cssnano');
var development = true;
var devUrl = 'http://localhost/html-boiler-plate-2';
var distPath = './assets/';
var buildPath = './build/';
var path = {
    dist: {
        fonts: './assets/fonts/',
        images: './assets/images/',
        styles: './assets/styles/',
        scripts: './assets/scripts/'
    },
    build: {
        fonts: './build/fonts/',
        images: './build/images/',
        styles: './build/styles/',
        scripts: './build/scripts/'
    }
};

// tasks
gulp.task('browserSync', function () {
    browserSync.init({
        server: {
            baseDir: './'
        },
    });

    gulp.watch("*.html", function () {
        browserSync.reload();
    });
});

gulp.task('styles', function() {
    return gulp.src([
            './build/styles/plugins/*.css',
            './build/styles/main.scss'
        ])
        .pipe(gulpif(development, sourcemaps.init()))
        .pipe(sass({
            outputStyle: 'nested',
            precision: 10,
            includePaths: ['.']
        }).on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: [
                'last 5 versions',
                'android 4',
                'opera 12',
                'IE 7',
                'Firefox >= 20'
            ]
        }))
        .pipe(concat('main.min.css'))
        .pipe(gulpif(!development, cssNano({
            discardComments: { removeAll: true },
            safe: true
        })))

        .pipe(gulpif(development, sourcemaps.write('.')))
        .pipe(gulp.dest(path.dist.styles))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// process scripts from build script's plugin folder
gulp.task('plugin-scripts', function() {
    return gulp.src([
            './build/scripts/jquery/jquery-3.3.1.min.js',
            './build/scripts/plugins/*.js'
        ])
        .pipe(gulpif(development, sourcemaps.init()))
        .pipe(concat('plugins.min.js'))
        .pipe(uglify({
            compress: {
                'drop_debugger': true,
                'drop_console': true,
                'unused': true
            }
        }))
        .pipe(gulpif(development, sourcemaps.write('.')))
        .pipe(gulp.dest(path.dist.scripts))
        .pipe(browserSync.reload({
            stream: true
        }))
});

// process custom script file
gulp.task('custom-scripts', function() {
    return gulp.src([
            './build/scripts/scripts.js'
        ])
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'))
        .pipe(gulpif(development, sourcemaps.init()))
        .pipe(concat('scripts.min.js'))
        /*comment to disable minify of custom scripts*/
        .pipe(uglify({
            compress: {
                'drop_debugger': true,
                'drop_console': false,
                'unused': true
            }
        }))
        .pipe(gulpif(development, sourcemaps.write('.')))
        .pipe(gulp.dest(path.dist.scripts))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('scripts', function(callback) {
    runSequence('plugin-scripts', 'custom-scripts', callback);
});

gulp.task('fonts', function() {
    return gulp.src(['./build/fonts/**'])
        .pipe(flatten())
        .pipe(gulp.dest(path.dist.fonts))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('images', function() {
    return gulp.src(['./build/images/**'])
        .pipe(imagemin({
            progressive: true,
            interlaced: true,
            svgoPlugins: [{ removeUnknownsAndDefaults: false }, { cleanupIDs: false }]
        }))
        .pipe(gulp.dest(path.dist.images))
        .pipe(browserSync.reload({
            stream: true
        }))
});

gulp.task('watch', ['browserSync', 'styles'], function () {
    gulp.watch(['./build/styles/**/**'], ['styles']);
    gulp.watch(['./build/scripts/plugins/**/**'], ['plugin-scripts']);
    gulp.watch(['./build/scripts/scripts.js'], ['custom-scripts']);
    gulp.watch(['./build/fonts/**/*'], ['fonts']);
    gulp.watch('./build/images/**/*', ['images']);
});

// build process
gulp.task('build', function(callback) {
    runSequence('styles',
        'scripts', ['fonts', 'images'],
        callback);
});

// delete build folder completely
gulp.task('clean', require('del').bind(null, [distPath]));

gulp.task('default', ['clean'], function() {
    gulp.start('build');
});
