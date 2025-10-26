// load sprite
// スプライトシートを読み込む。sprite はそのまま技術用語（画像やアニメーションの単位）として残す
let snowflake = App.loadSpritesheet('snowflake.png', 48, 43, [0], 16);

// load sprite
// スプライトシートを読み込む。向き別のアニメーション定義を与えている
let snowman = App.loadSpritesheet('snowman.png', 32, 48, {
    left: [0],  // 基本アニメーションを定義（left）
    right: [0], // 基本アニメーションを定義（right）
    up: [0],    // 基本アニメーションを定義（up）
    down: [0],  // 基本アニメーションを定義（down）
});

const STATE_INIT = 3000;   // 初期状態（ゲーム開始準備）
const STATE_READY = 3001;  // 準備完了状態（スタート前のカウントダウン等）
const STATE_PLAYING = 3002; // プレイ中
const STATE_JUDGE = 3004;  // 判定フェーズ（生存者判定など）
const STATE_END = 3005;    // 終了状態（リセットや後処理）

// レベル管理
let _level = 1;            // 現在のレベル
let _levelTimer = 15;      // レベルが上がるまでの時間（秒）
let _levelAddTimer = 0;    // レベル昇格用の内部タイマー

// ゲーム進行管理
let _start = false;        // ゲームが開始しているかどうかのフラグ
let _timer = 90;          // 制限時間（プレイ中に減る可能性のあるタイマー）

let _snowflakes = [];          // 落下オブジェクト（snowflake）の配列。各要素は [x, y]
let _stateTimer = 0;      // 現在の状態(state)での経過時間（秒）

let _genTime = 0;         // 次の生成までの時間
let _dropTime = 0;        // 次のドロップ（落下移動）までの時間

let _live = 0;            // 生存者数（判定用）

let _players = App.players; // 現在のプレイヤー一覧。App.players はプレイヤー配列を返す

// ゲーム全体を開始する初期化処理
function startApp()
{
    _stateTimer = 0;
    _genTime = 0;
    _dropTime = 0;
    _timer = 90;

    for(let i in _players) {
        let p = _players[i];
        AddNewPlayer(p);
    }
    _start = true;
}

// 状態遷移処理（state をセットして初期化処理を行う）
function startState(state)
{
    _state = state;
    _stateTimer = 0; 
    switch(_state)
    {
        case STATE_INIT:
            // ゲーム全体の準備を行う
            startApp();
            break;
        case STATE_READY:
            // スタート前の表示や準備（特に追加処理が無ければここで待つ）
            break;
        case STATE_PLAYING:
            // ゲーム開始時のラベル表示
            App.showCenterLabel("Game Start");
            break;
        case STATE_JUDGE:
            // 判定フェーズ開始時に、すべての落下オブジェクトをマップから削除する
            for(let i in _snowflakes) {
                let b = _snowflakes[i];
                Map.putObject(b[0], b[1], null);
            }
            break;
        case STATE_END:
            // ゲーム終了処理：プレイヤーの見た目と速度をリセットし、ゲームフラグをオフにする
            _start = false;
            for(let i in _players) {
                let p = _players[i];
                p.sprite = null;       // sprite は技術用語（画像表示）
                p.moveSpeed = 80;      // 元の移動速度に戻す
                p.sendUpdated();       // 変更を反映させるために送信
            }
            break;
    }
}

// 生存者チェック関数
// _start が false の場合は処理しない
// プレイヤー配列を確認して alive フラグで生存者をカウントする
// 注：元コードの条件では p.sprite が falsy の場合に lastSurvivor に代入しているが、これは意図と異なる可能性があるため補足説明を追加
function checkSuvivors() {
    if(!_start)
        return;

    let alive = 0;
    for(let i in _players) {
        let p = _players[i];
        if(p.tag && p.tag.alive) {
            lastSurvivor = p; // 最後に見つかった（条件を満たす）プレイヤーを保存
            ++alive;
        }
    }

    return alive;
}

// App の開始イベント：初期状態へ遷移
App.onStart.Add(function() {
    startState(STATE_INIT);
});

// プレイヤーがスペースに参加したときのイベント
App.onJoinPlayer.Add(function(p) {

    App.showCenterLabel(`Player joined. Num alive: ` + _live);
    // ゲームが既に開始している場合、参加プレイヤーは死んだ（観戦）状態で入れる
    if(_start)
    {
        p.tag = {
            alive : false, // 参加時は生存扱いしない（観戦）
        };

        // 移動速度を落として動きを制限
        p.moveSpeed = 20;
        // 見た目を snowman スプライトに変更（技術用語）
        p.sprite = snowman;
        // プレイヤーのプロパティ変更を反映するために sendUpdated を呼ぶ
        p.sendUpdated();
    }
    else{
        AddNewPlayer(p);
    }
    _players = App.players; // 最新のプレイヤー配列を再取得

});

function AddNewPlayer(p){
        // プレイヤーごとのタグ（オプションデータ）を作成して管理
        p.tag = {
            alive : true, // 生存フラグ（true: 生存中）
        };
        p.sendUpdated();
    
        _live = checkSurvivors();
        App.showCenterLabel(`Player added. Num alive: ` + _live);
}

// プレイヤーがスペースを離れたときのイベント
App.onLeavePlayer.Add(function(p) {
    // 参加時に与えた変更をリセットする
    p.title = null;d
    p.sprite = null;
    p.moveSpeed = 80;
    p.sendUpdated();

    _players = App.players; // プレイヤー一覧を更新
});

// プレイヤーがオブジェクトに触れたときのイベント（衝突判定等）
// sender: 衝突したプレイヤー, x/y/tileID は位置やタイル情報
App.onObjectTouched.Add(function(sender, x, y, tileID) {
    if(!_start)
        return;

    if(!sender.tag.alive)
        return;

    // 衝突したプレイヤーを「死亡」状態にする
    sender.tag.alive = false;
    sender.sprite = snowman;     // snowman スプライトで表示
    sender.moveSpeed = 40;    // 移動速度を変更（遅くする）
    sender.sendUpdated();

    // 生存者数を更新
    _live = checkSuvivors();

    // 生存者が 1 人以下なら判定フェーズへ移行
    if(_live == 0)
    {
        startState(STATE_JUDGE);
    }
    else
    {
        // ここは元のコードの意図が曖昧。_stateTimer を使ってタイマーを減らしているが、
        // onObjectTouched 呼び出しが頻発すると不安定になる可能性がある点を補足する。
        if(_stateTimer >= 1)
        {   
            _stateTimer = 0;
            _timer--;
            if(_timer <= 0)
            {
                startState(STATE_JUDGE);
            }
        }
    }
});

// ゲームブロック（ワールドの破壊等）が押された（destroy）ときの処理
// ここでは全ての落下オブジェクトをマップから削除している
App.onDestroy.Add(function() {
    for(let i in _snowflakes) {
        let b = _snowflakes[i];
        Map.putObject(b[0], b[1], null);
    }
});

// フレームごとの更新（約20ms 毎）
// dt: 経過時間（秒）
// ゲームが開始されていない場合は処理をスキップする
App.onUpdate.Add(function(dt) {
    if(!_start)
        return;

    _stateTimer += dt;
    switch(_state)
    {
        case STATE_INIT:
            // 初期状態の表示
            App.showCenterLabel(`Avoid falling snowflakes. Num alive: ` + _live);

            // 5 秒経過したら準備状態へ
            if(_stateTimer >= 5)
            {
                startState(STATE_READY);
            }
            break;
        case STATE_READY:
            // スタート前の案内表示
            App.showCenterLabel(`The game will start soon. Num alive: ` + _live);

            // 3 秒経過でプレイ状態へ遷移
            if(_stateTimer >= 3)
            {
                startState(STATE_PLAYING);
            }
            break;
        case STATE_PLAYING:
            // 生成タイマーを減算し、0 以下になったら新しい snowflake を生成する
            _genTime -= dt;
            if(_genTime <= 0) {
                // レベルが上がると生成間隔が短くなる設計
                _genTime = Math.random() * (0.5 - (_level * 0.05));
                
                // x はマップ幅にランダム、y は -1（マップ外の上）で生成
                let b = [Math.floor(Map.width * Math.random()),-1];

                _snowflakes.push(b);
                // y が 0 以上のときだけ実際にマップに表示（-1 はまだ見えない位置）
                if(b[1] >= 0)
                    Map.putObject(b[0], b[1], snowflake, {
                        overlap: true, // overlap オプションで重なりを許可
                    });
            }

            // 落下（移動）処理のタイマー
            _dropTime -= dt;
            if(_dropTime <= 0) {
                _dropTime = Math.random() * (0.5 - (_level * 0.08));
                
                // すべての snowflake を一段下げる
                for(let i in _snowflakes) {
                    let b = _snowflakes[i];
                    // いったん現在位置のオブジェクトを消してから y++ して再表示
                    Map.putObject(b[0], b[1], null);
            
                    b[1]++;
                    if(b[1] < Map.height) {
                        Map.putObject(b[0], b[1], snowflake, {
                            overlap: true,
                        });
                    }
                }

                // 画面外（マップ下端）に出た snowflake を配列から削除する
                for(let k = _snowflakes.length - 1;k >= 0;--k) {
                    let b = _snowflakes[k];
                    if(b[1] >= Map.height)
                        _snowflakes.splice(k, 1);
                }
            }

            // レベル上昇のためのタイマー更新
            _levelAddTimer += dt;
            if(_levelAddTimer >= _levelTimer)
            {
                _level++;
                _levelAddTimer = 0;

                // レベル上限を 6 に制限
                if(_level > 6)
                {
                    _level = 6;
                }
            }
            break;
        case STATE_JUDGE:
            // 判定フェーズのメッセージ表示
            if(_live == 1)
            {
                App.showCenterLabel(`${lastSurvivor.name} is last suvivor`);
            }
            else if(_live == 0)
            {
                App.showCenterLabel(`There are no survivors.`);
            }
            else
            {
                App.showCenterLabel(`Final survivors : ` + _live);
            }

            // 5 秒後に終了状態へ遷移
            if(_stateTimer >= 5)
            {
                startState(STATE_END);
            }
            break;
        case STATE_END:
            // 終了状態では特に毎フレーム行う処理は無し（必要ならここに追加）
            break;
    }
});




