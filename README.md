# Levitation With...
初音ミク 「マジカルミライ 2023」 プログラミング・コンテストの応募作品です。

Ponch♪ さんの ネオンライトの海を往く をベースに
クジラと一緒に空中浮遊を楽しむコンテンツにしてみました。

再生すると クジラを中心に歌詞が表示されます。最初はシンプルなものですが 終盤に向けて様々なアニメーションを試してみました。



## 操作方法
操作方法はシンプルで マウスでドラッグすると カメラの向きを変えることができます。

特定の部分ではクジラの周りに歌詞が表示されますので カメラを回転させながらお楽しみください。



## ビルドについて
本リポジトリは npm および webpack を使用して開発しております。

そのため クローン後
```
npm install
```
を実行し npm パッケージをインストール
```
npm run build
```
を実行し dist フォルダを生成する必要があります。



## 参考サイト
本コンテンツを制作するにあたり 様々なサイトを参考にさせていただきました。

この場をお借りして感謝申し上げます。

### 最新版で学ぶwebpack 5入門JavaScriptのモジュールバンドラ
https://ics.media/entry/12140/
### いちばんやさしい webpack 入門
https://zenn.dev/sprout2000/articles/9d026d3d9e0e8f

＞ webpack 環境を構築する際に参考にさせていただきました。

### three.js examples
https://threejs.org/examples/
＞ three.js 周りの処理を作成する際に参考にさせていただきました。

### Three.jsで海を制作
https://www.pentacreation.com/blog/2019/10/191021.html

＞ three.js にて海・空を生成する際に参考にさせていただきました。

### TextAlive App API lyric sheet example
https://github.com/TextAliveJp/textalive-app-lyric-sheet/tree/main
### 利用 TextAlive App API 與 three.js 製作互動式 PV - Magical Mirai 2020 Programming Contest 入門教學
https://43mmps.catlee.se/post/textalive-app-api%E4%BD%BF%E7%94%A8%E5%85%A5%E9%96%80-magical-mirai-2020-progamming-contest/

＞ TextAlive 周りの処理を作成する際に参考にさせていただきました。