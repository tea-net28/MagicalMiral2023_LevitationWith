const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
    // モード値を production に設定すると最適化された状態で、
    // development に設定するとソースマップ有効でJSファイルが出力される
    mode: "development",
    // メインとなるJavaScriptファイル（エントリーポイント）
    entry: `./src/app.js`,

    // ファイルの出力設定
    output: {
        //  出力ファイルのディレクトリ名
        path: `${__dirname}/dist`,
        // 出力ファイル名
        filename: "main.js",
        // "dist/asset/名前.拡張子" として出力される
        assetModuleFilename: "asset/[name][ext]",
    },
    // ローカル開発用環境を立ち上げる
    // 実行時にブラウザが自動的に localhost を開く
    devServer: {
        static: "dist",
        open: true
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader'],
            },
            {
                // 画像やフォントファイル
                test: /\.(jpg|ico|png|svg|ttf|otf|eot|woff?2?)$/,
                type: "asset/resource",
            },
            {
                // 3D モデル
                test: /\.glb$/,
                type: "asset/resource"
            }
        ],
    },
    // "plugins" エントリーを追加
    plugins: [
        new MiniCssExtractPlugin(),
        // プラグインのインスタンスを作成
        new HtmlWebpackPlugin({
            // テンプレート
            template: "./src/index.html",
            // ファイル名
            filename: 'index.html',
            // <script> ~ </script> タグの挿入位置
            inject: "body",
            // スクリプト読み込みのタイプ
            scriptLoading: "defer",
            // ファビコンも <link rel="shortcut icon" ~ /> として挿入できる
            // favicon: "./src/favicon.ico",
        }),
    ],
};