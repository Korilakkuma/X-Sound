var gulp       = require('gulp');
var plumber    = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var jshint     = require('gulp-jshint');
var uglify     = require('gulp-uglify');
var sass       = require('gulp-sass');
var rename     = require('gulp-rename');

gulp.task('jshint', function() {
    gulp.src('javascripts/controller.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('build-js', function() {
    gulp.src('javascripts/controller.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(uglify())
        .pipe(rename('controller.min.js'))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('javascripts/'));
});

gulp.task('build-css', function() {
    gulp.src('stylesheets/scss/*.scss')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('stylesheets/css/'));
});

gulp.task('build', ['build-js', 'build-css']);

gulp.task('watch', function() {
    gulp.watch('javascripts/controller.js', ['build-js']);
    gulp.watch('stylesheets/scss/*.scss',   ['build-css']);
});
