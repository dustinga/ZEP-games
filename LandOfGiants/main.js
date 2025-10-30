let superSnowman = App.loadSpritesheet('superSnowman.png', 96, 128, 8);

// プレイヤーがスペースに参加したときのイベント
App.onJoinPlayer.Add(function(player) {
	player.sprite = superSnowman;
	player.sendUpdated();
});