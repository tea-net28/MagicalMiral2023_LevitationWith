@ECHO OFF
CHCP 65001

REM node module をインストールするための bat ファイル
REM 実行するとパッケージをインストールする

SET path=%~dp0

ECHO ==================================================
ECHO パッケージをインストール
ECHO ==================================================

CD /D %path%
CALL npm install

ECHO ==================================================
ECHO パッケージのインストールが終了しました
ECHO ==================================================

PAUSE