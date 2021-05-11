import gulp from 'gulp'; //gulp本体
import del from 'del'; //ディレクトリ削除
import rename from 'gulp-rename'; //名前変換
import browserSync from 'browser-sync'; //ファイルの変更を監視して、変更を即座にブラウザーに反映させる
import cleancss from 'gulp-cleancss'; //cssをminify化する
import touch from 'gulp-touch-fd';
import flatten from "gulp-flatten";

// tailwind
import tailwindcss from '@tailwindcss/jit';
// Postcss
import postcss from 'gulp-postcss';
import postcssImport from 'postcss-import'; //importが使用できるようになる
import postcssNext from 'postcss-preset-env'; //将来ブラウザで実装される可能性がある機能(変数など)を利用できるモジュールのプリセット
import postcssNested from 'postcss-nested'; //ネストできるようにする
import postcssMixins from 'postcss-mixins'; //mixinを使用できるようにする
import postcssSimpleVars from 'postcss-simple-vars'; //Sassのような変数が使用できる
import postcssMath from 'postcss-math'; //math.jsで計算を行うためのPostCSS

// JS
import rollup from 'gulp-better-rollup'; //バンドルする(複数のファイルを1つにまとめる)
import resolve from 'rollup-plugin-node-resolve'; //サードパーティのライブラリを読み込めるようにする
import commonjs from 'rollup-plugin-commonjs'; //require/exportsのファイルをまとめる
import babel from '@rollup/plugin-babel'; //rollupとbabelを結合させる
import { terser } from 'rollup-plugin-terser'; // バンドルされたJS の圧縮

// Views
import twig from 'gulp-twig';

//images
import imagemin from 'gulp-imagemin';
import mozjpeg from 'imagemin-mozjpeg';
import pngquant from 'imagemin-pngquant';
import changed from 'gulp-changed';

const syncBrowser = () => browserSync.stream();

const clean = () => del(['dest/']);
const rootDir = './dest';

const paths = {
  styles: {
    src: ['src/styles/index.css'],
    watch: ['src/styles/**/*.css'],
    dest: './dest/assets/css',
  },
  scripts: {
    src: ['src/scripts/**/*.js'],
    dest: `./dest/assets/js`,
  },
  views: {
    src: [
      'src/views/pages/**/*.twig',
    ],
    dest: `./dest`,
  },
  images: {
    src: ['./src/images/**/*'],
    dest: './dest/assets/images',
  },
};

const scripts = () => {
  return gulp
    .src(paths.scripts.src)
    .pipe(
      rollup(
        {
          plugins: [babel({ babelHelpers: 'bundled' }), resolve(), commonjs()],
        },
        { format: 'cjs' }
      )
    )
    .pipe(
      rename({
        dirname: './',
        suffix: '.bundle',
      })
    )
    .pipe(gulp.dest(paths.scripts.dest))
    .pipe(syncBrowser())
    .pipe(
      rollup(
        {
          plugins: [terser()],
        },
        { format: 'cjs' }
      )
    )
    .pipe(
      rename({
        dirname: './',
        suffix: '.bundle.min',
      })
    )
    .pipe(gulp.dest(paths.scripts.dest));
};

const styles = () => {
  return gulp
    .src(paths.styles.src)
    .pipe(
      postcss([
        postcssImport,
        postcssNested,
        postcssSimpleVars,
        postcssMath,
        postcssMixins,
        tailwindcss,
        postcssNext({
          stage: 2,
          features: {
            autoprefixer: true,
          },
        }),
      ])
    )
    .pipe(
      rename({
        dirname: './',
        basename: 'styles',
        suffix: '.bundle',
      })
    )
    .pipe(gulp.dest(paths.styles.dest))
    .pipe(syncBrowser())
    .pipe(cleancss())
    .pipe(
      rename({
        dirname: './',
        basename: 'styles',
        suffix: '.bundle.min',
      })
    )
    .pipe(gulp.dest(paths.styles.dest));
};

const views = () => {
  return gulp
    .src(paths.views.src)
    .pipe(twig({ base: "./src/views/" }))
    .pipe(flatten({ includeParents: [1, 2] }))
    .pipe(
      rename(function (path) {
        path.dirname = path.dirname.replace('Index', '').replace('Top', '');
      })
    )
    .pipe(gulp.dest(paths.views.dest));
};

const images = () => {
  return gulp
    .src(paths.images.src)
    .pipe(changed(paths.images.dest))
    .pipe(
      imagemin([
        pngquant({
          quality: [0.6, 0.7], // 画質
          speed: 1, // スピード
        }),
        mozjpeg({ quality: 70 }), // 画質
        imagemin.svgo(),
        imagemin.optipng(),
        imagemin.gifsicle({ optimizationLevel: 3 }), // 圧縮率
      ])
    )
    .pipe(gulp.dest(paths.images.dest));
};

/**
 * * Viewsを変更すると、tailwindを再ビルドさする
 */
const reSaveStylesWhenViewsChanged = () => {
  return gulp
    .src('./src/styles/tailwind/index.css', { base: './' })
    .pipe(gulp.dest('./'))
    .pipe(touch());
};

//参考
//https://www.i-ryo.com/entry/2020/04/08/074158
const server = () => {
  return browserSync.init({
    //リロードするhtmlファイルを設定
    server: {
      baseDir: rootDir,
    },
  });
};

const watch = () => {
  gulp.watch(paths.styles.watch, styles);
  gulp.watch(paths.scripts.src, scripts);
  gulp.watch(paths.images.src, images);
  gulp.watch(paths.views.src, views);
  gulp.watch([...paths.views.src], (done) => {
    reSaveStylesWhenViewsChanged();
    browserSync.reload();
    done();
  });
};

const build = gulp.series(
  clean,
  gulp.parallel(scripts, styles, views, images),
  gulp.parallel(server, watch)
);
/*
 * Export a default task
 */
export default build;
