let mrPumpkinHead = App.loadSpritesheet('halloween_chara1_pumpkin.png', 96, 128, 8);

// プレイヤーがスペースに参加したときのイベント
App.onJoinPlayer.Add(function(player) {
	player.sprite = mrPumpkinHead;
	player.sendUpdated();
});