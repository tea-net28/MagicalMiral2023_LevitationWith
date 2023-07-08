'use strict';

// ================================================================================================
// Import library
// ================================================================================================
import { Player } from "textalive-app-api";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';

import "./style.css";
import "./Assets/blue_whale.glb";
import waterTexture from "./Assets/Water_1_M_Normal.jpg";

// ================================================================================================
// for Debug
// ================================================================================================
const isDebug = true;
function Logger(text) {
    const style = "color:#93eb4c; background-color: #333333; padding: 0px 10px; display: block;";
    if (isDebug)
        console.log(`%c${text}`, style);
}

// ================================================================================================
// #region Text Alive
// const { Player } = TextAliveApp;

// 単語が発声されたら #text に表示する
const animateWord = function (now, unit) {
    if (unit.contains(now)) {
        document.querySelector("#text").textContent = unit.text;
    }
};

// TextAlive Player の生成
const player = new Player({
    app: {
        token: "xydQ44AmN6vLSASJ",
    },
    mediaElement: document.querySelector("#media"),
});

player.addListener({
    onVideoReady,
    onAppReady,
    onPlay,
    onPause,
    onTimeUpdate,
});

// Container
const textContainer = document.querySelector("#text");

// Contol Buttons
const playBtns = document.querySelectorAll(".play");
const jumpBtn = document.querySelector("#jump");
const pauseBtn = document.querySelector("#pause");
const rewindBtn = document.querySelector("#rewind");
const positionEl = document.querySelector("#position strong");

// Meta Info
const artistSpan = document.querySelector("#artist span");
const songSpan = document.querySelector("#song span");

// プレイヤーの情報の構造体
let playerProgress = {
    position: null,
    beat: null,
    chorus: null,
    chord: null,
    phrase: null,
    word: null,
    char: null,
    volume: null,
    isPlaying: false,
    ready: false
};

let c = null;
let lyrics = [];

// -----------------------------------------------------------------------
//#region Evect Listener
/**
 * 動画オブジェクトの準備が整ったとき（楽曲に関する情報の読み込みが終わったとき）に実行される
 * @param {IVideo} v - https://developer.textalive.jp/packages/textalive-app-api/interfaces/ivideo.html
 */
function onVideoReady(v) {
    // 各単語の animate 関数をセット
    let word = player.video.firstPhrase;
    while (word) {
        word.animate = animateWord;
        word = word.next;
    }

    // アーティスト名・楽曲名を表示
    artistSpan.textContent = player.data.song.artist.name;
    songSpan.textContent = player.data.song.name;

    // 再生
    // MEMO: ここで再生リクエストをすると エラーが発生して再生されなかった。
    // player.requestPlay();
}

function onAppReady(app) {
    console.log("ON App Ready");
    if (!app.songUrl) {
        // URL で指定した楽曲を元にした動画データを作成
        // ブレス・ユア・ブレス
        // player.createFromSongUrl("http://www.youtube.com/watch?v=a-Nf3QUFkOU");
        // ネオンライトの海を往く
        player.createFromSongUrl("https://piapro.jp/t/fyxI/20230203003935");
        Logger("楽曲を読み込み");
    }
    if (!app.managed) {
        // 再生コントロールを表示
        // showControl();
    }

    // 各ボタンにイベントハンドラを追加
    playBtns.forEach((playBtn) =>
        playBtn.addEventListener("click", () => {
            player.video && player.requestPlay();
            textContainer.textContent = "";
        }));
    // 歌詞頭出しボタン / Seek to the first character in lyrics text
    jumpBtn.addEventListener(
        "click",
        () =>
            player.video &&
            player.requestMediaSeek(player.video.firstChar.startTime)
    );

    // 一時停止ボタン / Pause music playback
    pauseBtn.addEventListener(
        "click",
        () => player.video && player.requestPause()
    );

    // 巻き戻しボタン / Rewind music playback
    rewindBtn.addEventListener(
        "click",
        () => player.video && player.requestMediaSeek(0)
    );
}

/* 楽曲の再生が始まったら呼ばれる */
function onPlay() {
    playerProgress.isPlaying = true;
    Logger("Playing");
}

function onPause() {
    playerProgress.isPlaying = false;
    Logger("Pause");
}

// 再生位置の情報が更新されたら呼ばれる
function onTimeUpdate(position) {
    // 構造体の更新
    playerProgress.position = position;
    // 歌詞情報があるか
    if (!player.video.firstChar)
        return;
    // 再生位置を表示
    // MEMO: さらに精確な情報が必要な場合は `player.timer.position` でいつでも取得できます
    positionEl.textContent = String(Math.floor(position));

    // 文字を取得し 画面に表示する
    let currentPhrase = c || player.video.firstPhrase;
    while (currentPhrase && currentPhrase.startTime < position + 5000)
    {
        // 新しい文字の場合は更新
        if (c !== currentPhrase)
        {
            // div 要素を作成し その中にテキストを入れる
            const div = document.createElement("div");
            div.appendChild(document.createTextNode(currentPhrase.text));
            // textContainer の子要素として追加
            textContainer.appendChild(div);

            c = currentPhrase;

            // メッシュを作成
            const mesh = ConvertTextToMesh(currentPhrase.text);
            Logger("Lyrics push");
            lyrics.push({
                obj: currentPhrase,
                mesh: mesh
            });
        }

        currentPhrase = currentPhrase.next;
    }

    // 歌詞メッシュをシーンに追加
    lyrics.forEach((value, index) => {
        // Logger("Add mesh to scene");
        value.mesh.position.x = index % 3 - 1;
        value.mesh.position.y = -index;
        value.mesh.position.z = index % 3 - 1;
        // value.mesh.visible = true;
        _scene.add(value.mesh);
    });
}
//#endregion
// -----------------------------------------------------------------------
// #endregion
// ================================================================================================
// #region three.js
const _canvas = document.querySelector("#renderCanvas");
window.addEventListener("DOMContentLoaded", init);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let _renderer, _scene, _camera;
let water;
let orbitControls;

function init()
{
    // レンダラーの作成
    _renderer = new THREE.WebGLRenderer({
        canvas: _canvas
    });
    // レンダラーのサイズを変更
    _renderer.setSize(windowWidth, windowHeight);
    // _renderer.setClearColor(0xffffff, 1);
    _renderer.setClearColor(0x000000, 1);

    // シーンの作成
    _scene = new THREE.Scene();
    // カメラの作成
    _camera = new THREE.PerspectiveCamera(70, windowWidth / windowHeight, 0.1, 1000);
    _camera.position.set(-15, 15, 15);
    _scene.add(_camera);
    // 常にカメラの向きを原点に
    // _camera.lookAt(_scene.position);
    //OrbitControls
    document.addEventListener('touchmove',function(e){e.preventDefault();},{passive: false});
    orbitControls = new OrbitControls(_camera, _canvas);

    // 立方体の作成
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({
        color: 0x0000ff
    });
    // メッシュを作成
    const box = new THREE.Mesh(geometry, material);
    box.position.set(0, 5, 0);
    // シーンに追加
    _scene.add(box);

    // ライトの作成
    const light = new THREE.DirectionalLight(0xffffff);
    light.intensity = 2; // 光の強さ
    light.position.set(1, 1, 1); // ライトに位置
    // シーンに追加
    _scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    _scene.add(ambientLight);

    // 海の生成
    CreateWaterGeometry();

    // グリッドの作成
    // if (isDebug)
        // CreateHelper();

    render();
}

// シーンのレンダリング
function render()
{
    if (playerProgress.isPlaying)
    {
        // 歌詞オブジェクトの位置を更新
        lyrics.forEach ((line, index) => {
            if (line.obj.startTime < playerProgress.position + 5000 && line.obj.endTime < (playerProgress.position + 200000))
            {
                line.mesh.visible = true;
                // line.mesh.position.x = (line.obj.startTime - (playerProgress.position || 0) * 0.5 + 10) / 100;
                line.mesh.position.x = (line.obj.startTime - (playerProgress.position || 0)) / 500;
                Logger(line.mesh.position.x);
                // Logger(line.obj.startTime);
            }
            else
            {
                line.mesh.visible = false;示されます
            }
        });
    }

    // water
    if (water !== undefined && water !== null)
    {
        water.material.uniforms['time'].value += 1.0 / 60.0;
    }

    // Camera Control
    orbitControls.update();

    // 描画
    _renderer.render(_scene, _camera);
    // 繰り返し描画するように
    requestAnimationFrame(render);
}

/**
 * 歌詞を THREE.Mesh 形式に変換するメソッド
 * @param {string} メッシュに変換したい文字列
 * @returns {THREE.Mesh} THREE.Mesh 形式のテキスト
 */
function ConvertTextToMesh(text)
{
    try
    {
        Logger("Convert text to mesh");
        const canvas = document.createElement('canvas');
        canvas.width = text.length * (512 + 32);
        canvas.height = 512 + 32;

        const context = canvas.getContext('2d');
        context.font = "420px sans";
        // context.fillStyle = "#393939";
        context.fillStyle = "#EEEEEE";
        context.fillText(text, 0, 512);

        const planeGeometry = new THREE.PlaneGeometry(text.length, 1);
        const meshBasicMaterial = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(canvas), transparent: true});
        const mesh = new THREE.Mesh(planeGeometry, meshBasicMaterial);

        return mesh;
    }
    catch (error)
    {
        console.error(error);
    }
}
// -----------------------------------------------------------------------
// Water.js を用いて 海を生成
function CreateWaterGeometry()
{
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormal: new THREE.TextureLoader().load(waterTexture, function(texture){ texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }),
            alpha: 0.5,
            waterColor: 0x3e89ce,
            distortionScale: 3.7,
            fog:_scene.fog !== undefined
        }
    );

    // シーンに追加
    _scene.add(water);
    water.rotation.x = - Math.PI / 2;
}


// -----------------------------------------------------------------------
// 確認用グリッドと座標軸を作成
function CreateHelper(){
    //座標軸の生成
    const axes = new THREE.AxesHelper(1000);
    axes.position.set(0,0,0);
    _scene.add(axes);

    //グリッドの生成
    const grid = new THREE.GridHelper(100,100);
    _scene.add(grid);
}
//#endregion
// ================================================================================================