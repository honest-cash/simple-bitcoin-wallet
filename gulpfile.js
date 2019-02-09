const gulp = require('gulp');
const clean = require('gulp-clean');
const runSequence = require('run-sequence');

gulp.task('default', [ "build" ]);

gulp.task('build', [ "clean" ], (done) => {
    runSequence("copyResources", "copyLibs", () => {
        console.log('Success');
        done();
    });
});

gulp.task('copyResources', () => gulp
	.src([
		'src/**/*.{html,xml}',
	])
	.pipe(gulp.dest('dist')));

gulp.task('copyLibs', () => gulp
	.src([])
	.pipe(gulp.dest('dist/libs')));

gulp.task('clean', function () {
    return gulp.src('dist', {read: false})
        .pipe(clean());
});
