'use strict';

const isDebug = true;
function Logger(text) {
    const style = "color:#93eb4c";
    if (isDebug)
        console.log(`%c${text}`, style);
}

// ================================================================================================
// Text Alive
const { Player } = TextAliveApp;

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
    onTimeUpdate,
});

// -----------------------------------------------------------------------
//#region Evect Listener
/**
 * 動画オブジェクトの準備が整ったとき（楽曲に関する情報の読み込みが終わったとき）に実行される
 * @param {IVideo} v - https://developer.textalive.jp/packages/textalive-app-api/interfaces/ivideo.html
 */
function onVideoReady(v) {
    // 各単語の animate 関数をセット
    // let word = player.video.firstPhrase;
    // while (word) {
    //     word.animate = animateWord;
    //     word = word.next;
    // }

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
    // const a = document.querySelector("#control > a#play");
    // while (a.firstChild) a.removeChild(a.firstChild);
    // a.appendChild(document.createTextNode("\uf28b"));
}

// 再生位置の情報が更新されたら呼ばれる
function onTimeUpdate(position) {
    // 歌詞情報があるか
    if (!player.video.firstChar)
        return;
    // 再生位置を表示
    // MEMO: さらに精確な情報が必要な場合は `player.timer.position` でいつでも取得できます
    positionEl.textContent = String(Math.floor(position));

    // 文字を取得し 画面に表示する
    let currentPhrase = c || player.video.firstPhrase;
    while (currentPhrase && currentPhrase.startTime < position + 500)
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
            lyrics.push(mesh);
        }

        // let word = currentPhrase.firstWord;
        // let textMeshes = [];
        // while (word && word.startTime < currentPhrase.endTime)
        // {
        //     // Canvas を使用して歌詞をメッシュも貼り付ける
        //     const canvas = document.createElement('canvas');
        //     canvas.width = word.text.length * (512 + 32);
        //     canvas.height = 512 + 32;
        //     const context = canvas.getContext('2d');

        //     // フォントの変更
        //     context.font = "420px sans";
        //     context.fillStyle = "#393939";
        //     context.fillText(word.text, 0, 512);

        //     textMeshes.push({
        //         obj: word,
        //         mesh: new THREE.Mesh(new THREE.PlaneGeometry(word.text.length, 1), new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(canvas), transparent: true})),
        //     });

        //     word = word.next;
        // }
        // lyrics.push(textMeshes);

        currentPhrase = currentPhrase.next;
    }

    // 歌詞メッシュをシーンに追加
    lyrics.forEach((value, index) => {
        Logger("Add mesh to scene");
        value.position.x = index % 3 - 1;
        value.position.y = -index;
        value.position.z = index % 3 - 1;
        value.visible = true;
        _scene.add(value);
    });


    // lyrics.forEach ((line, index) => {
    //     line.forEach ((word, idx) => {
    //         // y, z は固定。x 軸のみをレンダーで計算する
    //         word.mesh.position.x = index % 3 - 1;
    //         word.mesh.position.y = index % 3 - 1;
    //         word.mesh.position.z = index % 3 - 1;
    //         word.mesh.visible = true;
    //         _scene.add(word.mesh);
    //     })
    // })
}
//#endregion
// -----------------------------------------------------------------------
// ================================================================================================
// three.js
const _canvas = document.querySelector("#myCanvas");
window.addEventListener("DOMContentLoaded", init);

const windowWidth = window.innerWidth;
const windowHeight = window.innerHeight;

let _renderer, _scene, _camera;

function init()
{
    // レンダラーの作成
    _renderer = new THREE.WebGLRenderer({
        canvas: _canvas
    });
    // レンダラーのサイズを変更
    _renderer.setSize(windowWidth, windowHeight);
    _renderer.setClearColor(0xffffff, 1);

    // シーンの作成
    _scene = new THREE.Scene();
    // カメラの作成
    _camera = new THREE.PerspectiveCamera(70, windowWidth / windowHeight, 0.1, 1000);
    _camera.position.set(-1.2, 0, 5);
    // 常にカメラの向きを原点に
    _camera.lookAt(_scene.position);

    // 立方体の作成
    // const geometry = new THREE.BoxGeometry(500, 500, 500);
    // const material = new THREE.MeshStandardMaterial({
    //     color: 0x0000ff
    // });
    // メッシュを作成
    // const box = new THREE.Mesh(geometry, material);
    // シーンに追加
    // _scene.add(box);

    // ライトの作成
    const light = new THREE.DirectionalLight(0xffffff);
    light.intensity = 2; // 光の強さ
    light.position.set(1, 1, 1); // ライトに位置
    // シーンに追加
    _scene.add(light);

    const ambientLight = new THREE.AmbientLight(0x404040);
    _scene.add(ambientLight);

    render();
}

// シーンのレンダリング
function render()
{
    // 歌詞をオブジェクトを表示し 位置を更新する
    // const progress = Date.now();
    // if (player.isPlaying)
    // {
    //     lyrics.forEach (line => {
    //         line.forEach ((word, idx) => {
    //             if (word.obj.startTime < progress && word.obj.endTime < progress + 20000)
    //             {
    //                 // console.log("aaaaaaaaaaa");
    //                 word.mesh.visible = true;
    //                 // 最初のワードにのみ時間に従って配置する
    //                 // 残りのワードは前のメッシュに従う
    //                 word.mesh.position.x = (idx === 0 ? ((word.obj.startTime - (progress || 0)) * 1 + 10) : line[idx - 1] && (line[idx - 1].mesh.position.x + (line[idx - 1].obj.text.length / 2)) || Number.NEGATIVE_INFINITY) + (word.obj.text.length / 2);
    //             }
    //         })
    //     })
    // }

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
        context.fillStyle = "#393939";
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
