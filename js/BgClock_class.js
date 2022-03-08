// BgClock_class.js
'use strict';

class BgClock {
  constructor(gameobj) {
    this.parentobj = gameobj;
    this.clock = [0, 600, 600];
    this.delayInit = 12;
    this.delay = this.delayInit;
    this.clockplayer = 0;
    this.clockobj = 0;

    this.clockmodeflg = false;
    this.pauseMode = false; //true=ゲーム中、false=ゲーム開始前
    this.setDomNames();
  }

  setDomNames() {
    this.pausebtn    = $("#pausebtn");
    this.clockmodeflg= $("[name=useclock]").prop("checked");
    this.matchlen    = $("#matchlen");
    this.selminpoint = $("#selminpoint");
    this.seldelay    = $("#seldelay");
  }

  //クロックタイマー用ロジック
  tapTimer(turn) {
    if (!this.clockmodeflg) { return; }

    this.clockplayer = BgUtil.cvtTurnGm2Bd(turn);
    const player = this.clockplayer;
    const oppo = BgUtil.getBdOppo(this.clockplayer);

    this.pauseMode = true; //ゲーム中モード
    this.delay = this.delayInit; //保障時間を設定
    this.stopTimer(); //相手方のクロックをストップし
    this.startTimer(this.pauseMode); //自分方のクロックをスタートさせる

    $("#delay" + player).text(Math.trunc(this.delay)).show();
    $("#delay" + oppo).hide();
    this.parentobj.setButtonEnabled(this.pausebtn, true);
  }

  pauseTimer(pausemode) {
    this.stopTimer();
    this.pauseMode = pausemode ? this.pauseMode : false;
    this.parentobj.setButtonEnabled(this.pausebtn, false); //ポーズ時はポーズボタンは非活性
    if (!pausemode) {
      $(".delay").hide(); //ゲーム終了時にはディレイは非表示
    } //ポーズボタン、設定ボタンが押されたとき(ゲーム中モード時)はディレイはそのまま表示
  }

  //クロックをカウントダウン
  countdownClock(player, clockspd) {
    if (this.delay > 0) {
      //保障時間内
      this.delay -= clockspd / 1000;
      $("#delay" + player).text(Math.trunc(this.delay));
    } else {
      //保障時間切れ後
      $("#delay" + player).hide();
      this.clock[player] -= clockspd / 1000;
      this.dispTimer(player, this.clock[player]);
      if (this.clock[player] <= 0) {
        this.timeupLose(player); //切れ負け処理
      }
    }
  }

  startTimer() {
    if (!this.pauseMode) { return; }
    const clockspd = 1000;
    this.clockobj = setInterval(() => this.countdownClock(this.clockplayer, clockspd), clockspd);
    //アロー関数で呼び出すことで、コールバック関数内でthisが使える
  }

  stopTimer() {
    clearInterval(this.clockobj);
  }

  dispTimer(player, time) {
    if (time < 0) { time = 0; }
    const min = Math.trunc(time / 60);
    const sec = Math.trunc(time % 60);
    const timestr = ("00" + min).substr(-2) + ":" + ("00" + sec).substr(-2);
    $("#clock" + player).text(timestr);
  }

  timeupLose(player) {
    $("#clock" + player).addClass("timeupLose");
    const oppo = BgUtil.cvtTurnBd2Gm(BgUtil.getBdOppo(player));
    this.parentobj.matchwinflg = true;
    this.parentobj.showGameEndPanel(oppo, true); //切れ勝ちの画面を表示
    this.parentobj.gameFinished = true;
    this.pauseTimer(false);
  }

  setClockOption() {
    const matchlength = parseInt(this.matchlen.val());
    const selminpoint = parseFloat(this.selminpoint.val());
    const time = (matchlength == 0) ? 100 * 60 : Math.ceil(matchlength * selminpoint) * 60;
    //設定時間 = ポイント数 x 時間(分) で分単位に切り上げ。このアプリは秒で管理するため、60を掛ける

    this.clock = [0, time, time];
    this.delayInit = parseInt(this.seldelay.val());
    this.dispTimer(1, time);
    this.dispTimer(2, time);
    $("#delay1").text(this.delayInit);
    $("#delay2").text(this.delayInit);

    this.clockmodeflg = $("[name=useclock]").prop("checked");
    $(".clock,.delay").toggle(this.clockmodeflg).removeClass("timeupLose");
    this.pausebtn.toggle(this.clockmodeflg); //クロックモードでない時はポーズボタンを表示しない
    this.parentobj.setButtonEnabled(this.pausebtn, false);
  }

}
