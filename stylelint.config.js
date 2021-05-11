module.exports = {
  //アルファベット順の並び替え
  plugins: ['stylelint-order'],
  //PrettierとStylelintの連携
  extends: [
    'stylelint-config-standard', //ベースの設定ファイル
    'stylelint-prettier/recommended', //stylelintのPrettierと重複するルールをオフする
  ],
  // .prettierrc.jsの内容を上書きしたい時は rules から可能
  rules: {
    //アルファベット順の並び替え
    'order/properties-alphabetical-order': true,
    'at-rule-no-unknown': null,
    //prettierの設定を上書きすることも可能
    'prettier/prettier': [
      true,
      {
        semi: false,
        singleQuote: true,
        tabWidth: 2,
        printWidth: 100,
        parser: 'scss',
      },
    ],
  },
};

/*
**捕捉

下記は同義
{
  'extends': 'stylelint-config-recommended-scss'
}
=
{
  'extends': ['stylelint-config-recommended'],//stylelintと最低限のルールの設定パッケージ
  'plugins': ['stylelint-scss'],//stylelintがSCSS、Sass記法のファイルを読めるようにする
  'rules': {
    //scssで使える @include などにエラーがでないようにする
    'at-rule-no-unknown': null, 
     //scssでもサポートしていない @ルール にはエラーを出す
    'scss/at-rule-no-unknown': true,
  }
}

npx = インストールせずともスクリプトの実行が簡単にできる便利なコマンド
https://qiita.com/sivertigo/items/622550c5d8ec991e59a6
*/
