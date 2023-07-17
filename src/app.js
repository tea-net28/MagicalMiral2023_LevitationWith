'use strict';

// ================================================================================================
// Import library
// ================================================================================================
import { Player } from "textalive-app-api";
import * as THREE from "three";
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Water } from 'three/examples/jsm/objects/Water.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
// import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';

import "./style.css";
import whaleModel from "./Assets/blue_whale.glb";
// import waterTexture from "./Assets/Water_1_M_Normal.jpg";
import waterTexture from "./Assets/waternormals.jpg";
import textJson from "./Assets/Rounded Mplus 1c Bold_Bold.json";
import { Vector3 } from "three";

// ================================================================================================
// for Debug
// ================================================================================================
const isDebug = false;
function Logger(text) {
    const style = "color:#93eb4c; background-color: #333333; padding: 0px 10px; display: block;";
    if (isDebug)
        console.log(`%c${text}`, style);
}
function LoggerError(text) {
    const style = "color:#d85b51; background-color: #333333; padding: 0px 10px; display: block;";
    if (isDebug)
        console.log(`%c${text}`, style);
}

// ================================================================================================
// #region Text Alive

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
    onTimerReady,
    onPlay,
    onPause,
    onTimeUpdate,
});
// Footer
const footer = document.querySelector("#footer");

// Overlay
const overlay = document.querySelector("#overlay");
// Container
const textContainer = document.querySelector("#text");

const startBtn = document.querySelector("#startButton");
// Contol Buttons
const playBtns = document.querySelectorAll(".play");
const jumpBtn = document.querySelector("#jump");
const pauseBtn = document.querySelector("#pause");
const rewindBtn = document.querySelector("#rewind");
const positionEl = document.querySelector("#position strong");

// Meta Info
const artistSpan = document.querySelector("#artist span");
const songSpan = document.querySelector("#song span");

// Seekbar
const seekbar = document.querySelector("#seekbar");
const paintedSeekbar = seekbar.querySelector("div");

// プレイヤーの情報の構造体
let playerProgress = {
    position: null,
    duration: null,
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

let chars = [];
let phrases = [];

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

    // 予め歌詞のメッシュを作成する
    phrases = player.video.phrases;
    phrases.forEach((value, index) => {
        CreateTextMesh(value);
    });
    Logger("歌詞のメッシュの生成が完了");

    // 歌詞の時間を取得
    playerProgress.duration = player.video.duration;

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
    startBtn.addEventListener("click", () => {
        player.video && player.requestPlay();
        textContainer.textContent = "";
        overlay.className = "disabled";

    });
    // 歌詞頭出しボタン / Seek to the first character in lyrics text
    jumpBtn.addEventListener(
        "click",
        () => {
            player.video &&
                player.requestMediaSeek(player.video.firstChar.startTime);
            playerProgress.phrase = player.video.firstPhrase
            playerProgress.char = player.video.firstChar;
            playerProgress.word = player.video.firstWord;
        }

    );

    // 一時停止ボタン / Pause music playback
    pauseBtn.addEventListener(
        "click",
        () => player.video && player.requestPause()
    );

    // 巻き戻しボタン / Rewind music playback
    rewindBtn.addEventListener(
        "click",
        () => {
            player.video && player.requestMediaSeek(0);
            playerProgress.Phrase = player.video.firstPhrase;
        }
    );
}
function onTimerReady() {
    startBtn.className = "center";
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
    // シークバーの表示を更新
    paintedSeekbar.style.width = `${parseInt((playerProgress.position * 1000) / playerProgress.duration) / 10}%`;
    // 歌詞情報があるか
    if (!player.video.firstChar)
        return;
    // 再生位置を表示
    // MEMO: さらに精確な情報が必要な場合は `player.timer.position` でいつでも取得できます
    positionEl.textContent = String(Math.floor(position));

    // 文字を取得する
    let currentChar = playerProgress.char || player.video.firstChar;
    while (currentChar && currentChar.startTime < position + 500) {
        // 新しい文字の場合は更新
        if (playerProgress.char !== currentChar) {
            playerProgress.char = currentChar;
        }
        currentChar = currentChar.next;
    }

    // 単語を取得する
    let currentWord = playerProgress.word || player.video.firstWord;
    while (currentWord && currentWord.startTime < position + 500) {
        // 新しい単語の場合は更新
        if (playerProgress.word !== currentWord) {
            playerProgress.word = currentWord;
        }
        currentWord = currentWord.next;
    }

    // フレーズを取得し 画面に表示する
    let currentPhrase = playerProgress.phrase || player.video.firstPhrase;
    while (currentPhrase && currentPhrase.startTime < position + 5000) {
        // 新しい文字の場合は更新
        if (playerProgress.phrase !== currentPhrase) {
            // div 要素を作成し その中にテキストを入れる
            // const div = document.createElement("div");
            // div.appendChild(document.createTextNode(currentPhrase.text));
            // textContainer の子要素として追加
            // textContainer.appendChild(div);

            playerProgress.phrase = currentPhrase;

            // メッシュを作成
            // ConvertTextToMesh(currentPhrase);
            // CreateTextMesh(currentPhrase);
        }

        currentPhrase = currentPhrase.next;
    }
}
//#endregion
// -----------------------------------------------------------------------
// シークバー
seekbar.addEventListener("click", (e) => {
    e.preventDefault();
    if (player) {
        player.requestMediaSeek(
            (player.video.duration * e.offsetX) / seekbar.clientWidth
        );
        player.requestPlay();

        // すべてのメッシュの透明度をリセットする
        _lyricObjects.forEach((obj, index) => {
            obj.material.opacity = 1.0;
        });
    }
    return false;
});
// -----------------------------------------------------------------------
// #endregion
// ================================================================================================
// #region three.js
const _canvas = document.querySelector("#renderCanvas");
window.addEventListener("DOMContentLoaded", init);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let _renderer, _scene, _camera;
let orbitControls;
let water;
let _sky;
let _sun;
let _modelLoader;

let _mixer;
let _clock = new THREE.Clock();

let _lyricObjects = [];

let animationChangePoint = [0, 50000, 95000, 131000, 153000, 174000, 195000, 217000];
const fadeOutDuration = 1000; // フェードアウトの時間（ミリ秒）

// -----------------------------------------------------------------------
// Initialize
function init() {
    // UI 周りの設定
    if (!isDebug)
    {
        footer.className = "disabled";
        textContainer.className = "disabled";
    }

    // レンダラーの作成
    _renderer = new THREE.WebGLRenderer({
        canvas: _canvas
    });
    // レンダラーのサイズを変更
    _renderer.setSize(windowWidth, windowHeight);
    _renderer.setPixelRatio(1);
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer.toneMappingExposure = 0.5;
    // _renderer.setClearColor(0xffffff, 1);
    // _renderer.setClearColor(0x000000, 1);

    // シーンの作成
    _scene = new THREE.Scene();
    // カメラの作成
    _camera = new THREE.PerspectiveCamera(55, windowWidth / windowHeight, 1, 1000);
    if (isDebug)
    {
        _camera.position.set(-15, 16, 15);
        _scene.add(_camera);
        document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
        orbitControls = new OrbitControls(_camera, _canvas);
    }
    else
    {
        const vec3 = new Vector3(0, 14.5, 0.01);
        _camera.position.set(0, 14.5, 0);
        _camera.rotateY(Math.PI);
        _scene.add(_camera);

        orbitControls = new OrbitControls(_camera, _canvas);
        orbitControls.target = vec3;
        orbitControls.enableZoom = false;
        orbitControls.enablePan = false;
    }
    // 常にカメラの向きを原点に
    // _camera.lookAt(_scene.position);
    //OrbitControls


    // // 立方体の作成
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshStandardMaterial({
    //     color: 0x0000ff
    // });
    // // メッシュを作成
    // const box = new THREE.Mesh(geometry, material);
    // box.position.set(0, 14, 0);
    // // シーンに追加
    // _scene.add(box);

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

    // 空の生成
    CreateSky();

    // 3D モデルを読み込む
    LoadGLTF(whaleModel);

    // グリッドの作成
    if (isDebug)
        CreateHelper();

    render();
}

// -----------------------------------------------------------------------
// シーンのレンダリング
function render() {
    if (playerProgress.isPlaying) {
        // 歌詞オブジェクトの位置を更新
        _lyricObjects.forEach((obj, index) => {
            if (obj.phrase.startTime < playerProgress.position + 10000 && obj.phrase.endTime < (playerProgress.position + 20000)) {

                // 現在の再生位置に応じて アニメーションを変化させる
                if (obj.phrase.startTime <= animationChangePoint[1]) {
                    obj.mesh.visible = true;
                    obj.mesh.position.x = ((index % 3) - 1) * 25;
                    obj.mesh.position.z = (obj.phrase.startTime - (playerProgress.position || 0)) / 20 + 150;
                }
                else if (animationChangePoint[1] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[2]) {
                    obj.mesh.visible = true;
                    obj.mesh.position.x = 50 * Math.sin(Math.PI * (40 * (index + 1)) / 180);
                    obj.mesh.position.y = -1 * (obj.phrase.startTime - (playerProgress.position || 0)) / 100 + 10;
                    obj.mesh.position.z = 50 * Math.cos(Math.PI * (40 * (index + 1)) / 180);

                    obj.mesh.rotation.y = Math.PI + (Math.PI * (40 * (index + 1)) / 180);
                }
                else if (animationChangePoint[2] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[3]) {
                    obj.mesh.visible = true;
                    obj.mesh.position.x = ((index % 3) - 1) * 25;
                    obj.mesh.position.z = (obj.phrase.startTime - (playerProgress.position || 0)) / 20 + 150;
                }
                else if (animationChangePoint[3] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[4]) {
                    obj.mesh.visible = true;
                    const adjustCount = -23;
                    // Logger("Char Instance");
                    obj.mesh.position.x = 25 * Math.sin(Math.PI * (7.5 * (-index + adjustCount)) / 180);
                    obj.mesh.position.y = -1 * (obj.phrase.startTime - (playerProgress.position || 0)) / 100 + 10;
                    obj.mesh.position.z = 25 * Math.cos(Math.PI * (7.5 * (-index + adjustCount)) / 180);

                    obj.mesh.rotation.y = Math.PI + (Math.PI * (7.5 * (-index + adjustCount)) / 180);
                }
                else if (animationChangePoint[4] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[5]) {
                    obj.mesh.visible = true;
                    obj.mesh.position.x = ((index % 3) - 1) * 25;
                    obj.mesh.position.z = (obj.phrase.startTime - (playerProgress.position || 0)) / 20 + 150;
                }
                else if (animationChangePoint[5] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[6]) {
                    if (animationChangePoint[5] < playerProgress.position && obj.phrase.startTime < playerProgress.position) {
                        obj.mesh.visible = true;
                        obj.mesh.position.y = 15;
                        obj.mesh.position.z = 30 + (index % 5);

                        // Fade Out Animation
                        if (obj.phrase.endTime - (playerProgress.position || 0) < 1000)
                            obj.material.opacity -= 1.0 / fadeOutDuration * (1000 / 60);
                    }
                    else
                    {
                        obj.mesh.visible = false;
                        obj.material.opacity = 1.0;
                    }
                }
                else if (animationChangePoint[6] < obj.phrase.startTime && obj.phrase.startTime <= animationChangePoint[7]) {
                    if (animationChangePoint[6] < playerProgress.position && obj.phrase.startTime < playerProgress.position)
                    {
                        const adjustCount = 2;
                        obj.mesh.visible = true;
                        obj.mesh.position.x = 25 * Math.sin(Math.PI * (14 * (-index + adjustCount)) / 180);
                        obj.mesh.position.y = (index / 6);
                        obj.mesh.position.z = 25 * Math.cos(Math.PI * (14 * (-index + adjustCount)) / 180);
                        obj.mesh.rotation.y = Math.PI + (Math.PI * (14 * (-index + adjustCount)) / 180);

                        // Animation
                        const t = (playerProgress.position - obj.phrase.startTime) / 500;
                        const a = 2;
                        const v0 = -5;
                        const v = a * t + v0;
                        let x = 0;
                        if (v < 0)
                            x = 1 / 2 * a * Math.pow(t, 2) + v0 * t;
                        else
                        {
                            let t2 = -v0 / a;
                            x = 1 / 2 * a * Math.pow(t2, 2) + v0 * t2;
                        }
                        // x, y に分割
                        const rad = index % 7 * index;
                        const vectorX = x * Math.cos(rad);
                        const vectorY = x * Math.sin(rad);
                        // obj.mesh.translateX(Math.max((-3 * ((500 - (playerProgress.position - obj.phrase.startTime)) / 500)), -3));
                        obj.mesh.translateX(vectorX);
                        obj.mesh.translateY(vectorY);

                        // Fade Out Animation
                        if (obj.phrase.endTime + 3000 - (playerProgress.position || 0) < -5000)
                            obj.material.opacity -= 1.0 / fadeOutDuration * (1000 / 60);
                    }
                    else
                    {
                        obj.mesh.visible = false;
                        obj.material.opacity = 1.0;
                    }
                }
                else if (animationChangePoint[7] < obj.phrase.startTime) {
                    if (animationChangePoint[7] < playerProgress.position && obj.phrase.startTime < playerProgress.position) {
                        obj.mesh.visible = true;
                        obj.mesh.position.x = 0;
                        obj.mesh.position.y = 15;
                        obj.mesh.position.z = 30;

                        // Fade In Animation
                        if (obj.phrase.startTime - (playerProgress.position || 0) > -500)
                            obj.material.opacity = Math.min(1.0, obj.material.opacity + 1.0 / fadeOutDuration * (1000 / 60));

                        // Fade Out Animation
                        if (obj.phrase.endTime - (playerProgress.position || 0) < -1000)
                            obj.material.opacity -= 1.0 / fadeOutDuration * 3 * (1000 / 60);
                    }
                    else
                    {
                        obj.mesh.visible = false;
                        obj.material.opacity = 1.0;
                    }
                }
                else {
                    obj.mesh.visible = false;
                    obj.material.opacity = 1.0;
                }
            }
            else {
                obj.mesh.visible = false;
                obj.material.opacity = 1.0;
                // _scene.remove(obj.mesh);
                // _lyricObjects.splice(index, 1);
                // Logger(`removeObject`)
            }
        });
    }

    // water
    if (water !== undefined && water !== null) {
        water.material.uniforms['time'].value += 1.0 / 120.0;
    }

    // 太陽の位置
    const progress = playerProgress.position / playerProgress.duration;
    UpdateSun(progress);

    // Camera Control
    orbitControls.update();

    //Animation Mixerを実行
    if (_mixer) {
        _mixer.update(_clock.getDelta());
    }

    // 描画
    _renderer.render(_scene, _camera);
    // 繰り返し描画するように
    requestAnimationFrame(render);
}
// -----------------------------------------------------------------------

/**
 * 歌詞を THREE.Mesh 形式に変換するメソッド
 * @param {string} メッシュに変換したい文字列
 * @returns {THREE.Mesh} THREE.Mesh 形式のテキスト
 */
function ConvertTextToMesh(phrase) {
    try {
        const canvas = document.createElement('canvas');
        canvas.width = phrase.text.length * (512 + 32);
        canvas.height = 512 + 32;

        const context = canvas.getContext('2d');
        context.font = "420px sans";
        // context.fillStyle = "#393939";
        context.fillStyle = "#EEEEEE";
        context.fillText(phrase.text, 0, 512);

        const planeGeometry = new THREE.PlaneGeometry(phrase.text.length, 1);
        const meshBasicMaterial = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
        const mesh = new THREE.Mesh(planeGeometry, meshBasicMaterial);

        mesh.position.y = 5;

        _scene.add(mesh);

        // オブジェクトを作成・配列に追加
        let obj = {
            phrase: phrase,
            mesh: mesh
        };
        _lyricObjects.push(obj);
        Logger("Convert text to mesh");

        // return mesh;
    }
    catch (error) {
        console.error(error);
    }
}

// FontLoader.js を用いて テキストメッシュを生成
async function CreateTextMesh(phrase) {
    try {
        const loader = new FontLoader();
        loader.loadAsync(textJson).then((loadedFont) => {
            const color = 0xffffff;
            // マテリアルの設定
            const matLite = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1.0,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });

            // ジオメトリを作成
            // 指定の範囲の歌詞については 文字単位で作成する
            if (animationChangePoint[3] < phrase.startTime && phrase.startTime < animationChangePoint[4]) {
                CreateObjectByChar(loadedFont, matLite, phrase);
            }
            else if (animationChangePoint[6] < phrase.startTime && phrase.startTime < animationChangePoint[7]) {
                // 90文字？
                CreateObjectByChar(loadedFont, matLite, phrase);
            }
            else {
                const shapes = loadedFont.generateShapes(phrase.text, 1.5);
                const geometry = new THREE.ShapeGeometry(shapes);

                // const textGeometry = new TextGeometry(phrase.text, {
                //     font: loadedFont,
                //     size: 0.5,
                //     height: 0.02,
                //     curveSegments: 12,
                //     bevelEnabled: true,
                //     bevelThickness: 0.03,
                //     bevelSize: 0.02,
                //     bevelOffset: 0,
                //     bevelSegments: 5,
                // });
                // Logger("Text Loaded")

                // // BoundingBox を作成し X 中心にテキストの中心を移動
                geometry.center();
                // geometry.computeBoundingBox();
                // const xMid = -0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x);
                // geometry.translate(xMid, 0, 0);
                // // textGeometry.center();

                // // メッシュを作成
                const textMesh = new THREE.Mesh(geometry, matLite);
                // const textMesh = new THREE.Mesh(textGeometry, matLite);
                textMesh.position.y = 20;
                textMesh.rotation.y = Math.PI;
                textMesh.visible = false;
                _scene.add(textMesh);

                // オブジェクトを作成・配列に追加
                let obj = {
                    phrase: phrase,
                    mesh: textMesh,
                    material: matLite
                };
                _lyricObjects.push(obj);
            }
            // return textMesh;
        });

    } catch (error) {
        LoggerError(error);
        // return null;
    }
}

function CreateObjectByWord(loadedFont, matLite, phrase) {
    const word = phrase.children;
    word.forEach((value, index) => {
        let text = null;
        text = value.text;
        Logger(text);

        const shapes = loadedFont.generateShapes(text, 1.5);
        const geometry = new THREE.ShapeGeometry(shapes);
        geometry.center();

        // // メッシュを作成
        const textMesh = new THREE.Mesh(geometry, matLite);
        textMesh.position.y = 5;
        textMesh.rotation.y = Math.PI;
        textMesh.visible = false;
        _scene.add(textMesh);

        // オブジェクトを作成・配列に追加
        let obj = {
            phrase: value,
            mesh: textMesh,
            material: matLite
        };

        _lyricObjects.push(obj);
    });
}

function CreateObjectByChar(loadedFont, matLite, phrase) {
    const word = phrase.children;
    word.forEach((value, index) => {
        const char = value.children;
        char.forEach((value2, index2) => {
            let text = null;
            if (value2.text == "、" || value2.text == "。")
                text = " ";
            else
                text = value2.text
            const shapes = loadedFont.generateShapes(text, 1.5);
            const geometry = new THREE.ShapeGeometry(shapes);
            geometry.center();

            // // メッシュを作成
            const textMesh = new THREE.Mesh(geometry, matLite);
            textMesh.position.y = 5;
            textMesh.rotation.y = Math.PI;
            textMesh.visible = false;
            _scene.add(textMesh);

            // オブジェクトを作成・配列に追加
            let obj = {
                phrase: value2,
                mesh: textMesh,
                material: matLite
            };

            _lyricObjects.push(obj);
        })
    })
}

// -----------------------------------------------------------------------
// Water.js を用いて 海を生成
function CreateWaterGeometry() {
    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(waterTexture, function (texture) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; }),
            // sunDirection: new THREE.Vector3(),
            // sunColor: 0xffffff,
            // alpha: 0.5,
            waterColor: 0x3e89ce,
            distortionScale: 3.7,
            fog: _scene.fog !== undefined
        }
    );

    // シーンに追加
    water.rotation.x = - Math.PI / 2;
    _scene.add(water);
}
// -----------------------------------------------------------------------
// Sky.js を用いて空を生成
function CreateSky() {
    _sky = new Sky();
    _sky.scale.setScalar(1000);
    _scene.add(_sky);

    // Sky の設定
    // const sky_uniforms = _sky.material.uniforms;
    // sky_uniforms['turbidity'].value = 10;
    // sky_uniforms['rayleigh'].value = 2;
    // sky_uniforms['mieCoefficient'].value = 0.005;
    // sky_uniforms['mieDirectionalG'].value = 0.8;

    // 太陽
    const sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(200, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xFFFFFF })
    );
    _scene.add(sunSphere);

    //Sunの設定
    _sun = new THREE.Vector3();

    const sun_uniforms = _sky.material.uniforms;
    sun_uniforms['turbidity'].value = 5;
    sun_uniforms['rayleigh'].value = 2;
    sun_uniforms['mieCoefficient'].value = 0.005;
    sun_uniforms['mieDirectionalG'].value = 0.8;

    const phi = THREE.MathUtils.degToRad(90);
    const theta = THREE.MathUtils.degToRad(90);
    _sun.setFromSphericalCoords(1, phi, theta);
    sun_uniforms['sunPosition'].value.copy(_sun);
    // const theta = Math.PI * (-0.01);
    // const phi = 2 * Math.PI * (-0.25);
    // const distance = 40000;
    // sunSphere.position.x = distance * Math.cos(phi);
    // sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    // sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = true;
    // sun_uniforms['sunPosition'].value.copy(sunSphere.position);
}

// 太陽の位置を更新するメソッド
// let phi = 90;
function UpdateSun(progress) {
    if (_sun != null) {
        const sun_uniforms = _sky.material.uniforms;
        sun_uniforms['turbidity'].value = 5;
        sun_uniforms['rayleigh'].value = 2;
        sun_uniforms['mieCoefficient'].value = 0.005;
        sun_uniforms['mieDirectionalG'].value = 0.8;

        const phi = THREE.MathUtils.degToRad(90 - (180 * progress));
        // animationChangePoint[5];
        // 現在の再生時間に応じて 係数を設定
        let coefficient = 1;
        if (animationChangePoint[5] < playerProgress.position && playerProgress.position < animationChangePoint[6])
            coefficient = 5;
        const theta = THREE.MathUtils.degToRad(145);

        _sun.setFromSphericalCoords(1, phi, theta);

        sun_uniforms['sunPosition'].value.copy(_sun);
    }
}
// -----------------------------------------------------------------------
// GLTFLoader.js を用いて glTF データを読み込む
function LoadGLTF(modelPath) {
    _modelLoader = new GLTFLoader();

    // glTF リソースを読み込む
    _modelLoader.load(
        // resource URL
        whaleModel,
        // called when the resource is loaded
        function (gltf) {
            let obj = gltf.scene;
            obj.position.set(0, 10, -5);


            const animations = gltf.animations; // Array<THREE.AnimationClip>
            gltf.scene; // THREE.Group
            gltf.scenes; // Array<THREE.Group>
            gltf.cameras; // Array<THREE.Camera>
            gltf.asset; // Object

            // アニメーションクリップを作成
            if (animations && animations.length) {
                // Animation Mixer
                _mixer = new THREE.AnimationMixer(obj);

                for (let i = 0; i < animations.length; i++) {
                    let animation = animations[i];
                    let action = _mixer.clipAction(animation);
                    action.setLoop(THREE.LoopRepeat);
                    action.clampWhenFinished = false;
                    action.play();
                }
            }

            _scene.add(obj);

            Logger("glTF モデルを読み込みました");
        },
        // called while loading is progressing
        function (xhr) {
            Logger((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // called when loading has errors
        function (error) {
            LoggerError('An error happened');
            LoggerError(error);
        }
    );
}
// -----------------------------------------------------------------------
// 確認用グリッドと座標軸を作成
function CreateHelper() {
    //座標軸の生成
    const axes = new THREE.AxesHelper(1000);
    axes.position.set(0, 0, 0);
    _scene.add(axes);

    //グリッドの生成
    const grid = new THREE.GridHelper(100, 100);
    _scene.add(grid);
}
//#endregion
// ================================================================================================
// #region Resize Window
function CalcWindowSize()
{
    // 回転した直後だと 回転前の情報を取得するため 100ms 待つ
    setTimeout(() => {
        // アプリケーションのアスペクト比を設定
        const aspectRatio = 16.0 / 9.0;
        // ウインドウのサイズを取得する
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        Logger(`width: ${windowWidth}, height: ${windowHeight}`);

        // タブレットの回転状態に応じて
        // Width と Height を入れ替える
        // ランドスケープのとき
        let width;
        let height;
        if (windowWidth > windowHeight)
        {
            Logger("ランドスケープ表示です");
            width = windowHeight * aspectRatio;
            height = windowHeight;
            if (width > windowWidth)
            {
                width = windowWidth;
                height = windowWidth / aspectRatio;
            }
        }
        // ポートレートのとき
        else
        {
            Logger("ポートレート表示です");
            width = windowWidth;
            height = windowWidth / aspectRatio;
        }

        // 設定したウインドウサイズを入れ込む
        const frame = document.querySelector("#frame");
        frame.style.width = `${width}px`;
        frame.style.height = `${height}px`;

    // Update cameta info
    _camera.aspect = aspectRatio;
    _camera.updateProjectionMatrix();

    // レンダラーのサイズを変更
    _renderer.setSize(width, height);
    _renderer.setPixelRatio(1);
    _renderer.toneMapping = THREE.ACESFilmicToneMapping;
    _renderer.toneMappingExposure = 0.5;
    }, 200);
}

// イベントリスナーに登録
window.addEventListener('load', () => {
    CalcWindowSize();
  });

  window.addEventListener('resize', () => {
    CalcWindowSize();
  });
// #endregion
// ================================================================================================