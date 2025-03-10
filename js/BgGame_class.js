// BgGame_class.js
'use strict';

class BgGame {
  constructor(gametype) {
    this.gametype = gametype;
    const gameparam = BgUtil.getGametypeParam(this.gametype);
    this.ckrnum = gameparam[1]; //chequer num
    this.param0 = gameparam[0]; //my inner point = point num of one area
    this.param1 = this.param0 * 4 + 1; //array param of XGID position
    this.param2 = this.param0 * 4 + 2; //boff1
    this.param3 = this.param0 * 4 + 3; //boff2
    this.dicemx = gameparam[2]; //dice pip max

    this.player = false; //true=player1, false=player2
    this.gamescore = [];
    this.matchLength = 5;
    this.score = [0,0,0];
    this.matchwinflg = false;
    this.cubeValue = 1; // =2^0
    this.crawford = false;
    this.xgid = new Xgid(null, this.gametype);
    this.board = new BgBoard("bgBoardApp", this.gametype);
    this.undoStack = [];
    this.animDelay = 800;
    this.gameFinished = true;
    this.settingVars = {}; //設定内容を保持するオブジェクト

    this.clockobj = new BgClock(this);
    this.kifuobj = new BgKifu(this);

    this.setDomNames();
    this.setEventHandler();
    this.setChequerDraggable();
    this.showpipflg = true;
    this.flashflg = true;
    this.jacobyflg = true;
    this.outerDragFlag = false; //駒でない部分をタップしてドラッグを始めたら true
    this.initGameOption();
    this.beginNewGame(true); //スコアをリセットして新規ゲームを始める
  } //end of constructor()

  setDomNames() {
    //button
    this.rollbtn     = $("#rollbtn");
    this.doublebtn   = $("#doublebtn");
    this.resignbtn   = $("#resignbtn");
    this.takebtn     = $("#takebtn");
    this.dropbtn     = $("#dropbtn");
    this.donebtn     = $("#donebtn");
    this.undobtn     = $("#undobtn");
    this.newgamebtn  = $("#newgamebtn");
    this.cancelbtn   = $("#cancelbtn");
    this.settingbtn  = $("#settingbtn");
    this.pausebtn    = $("#pausebtn");
    this.restartbtn  = $("#restartbtn");
    this.openrollbtn = $("#openingroll");
    this.passbtn     = $("#passbtn");
    this.gameendnextbtn= $("#gameendnextbtn");
    this.gameendokbtn  = $("#gameendokbtn");
    this.diceAsBtn  = $("#dice10,#dice11,#dice20,#dice21");
    this.pointTriangle = $(".point");

    //infos
    this.playerinfo = [undefined, $("#playerinfo1"), $("#playerinfo2")];
    this.scoreinfo  = [undefined, $("#score1"), $("#score2")];
    this.pipinfo    = [undefined, $("#pip1"), $("#pip2")];
    this.matchinfo  = $("#matchinfo");

    //panel
    this.panelholder  = $("#panelholder");
    this.allpanel     = $(".panel");
    this.rolldouble   = $("#rolldouble");
    this.takedrop     = $("#takedrop");
    this.doneundo     = $("#doneundo");
    this.gameend      = $("#gameend");
    this.hideAllPanel(); //font awesome が描画するのを待つ必要がある
    this.panelholder.show();

    //settings and valiables
    this.settings    = $("#settings");
    this.showpipflg  = $("[name=showpip]").prop("checked");
    this.flashflg    = $("[name=flashdest]").prop("checked"); //ドラッグ開始時に移動可能なポイントを光らせる
    this.jacobyflg   = $("[name=jacoby]").prop("checked");
    this.matchlen    = $("#matchlen");

    //clock
    this.pausepanel  = $("#pausepanel");
    this.selminpoint = $("#selminpoint");
    this.seldelay    = $("#seldelay");

    //chequer
    this.chequerall = $(".chequer");
  }

  setEventHandler() {
    const clickEventType = 'click touchstart'; //(( window.ontouchstart !== null ) ? 'click':'touchstart');
    //Button Click Event
    this.rollbtn.       on(clickEventType, (e) => { e.preventDefault(); this.rollAction(false); });
    this.doublebtn.     on(clickEventType, (e) => { e.preventDefault(); this.doubleAction(); });
    this.resignbtn.     on(clickEventType, (e) => { e.preventDefault(); this.resignAction(); });
    this.takebtn.       on(clickEventType, (e) => { e.preventDefault(); this.takeAction(); });
    this.dropbtn.       on(clickEventType, (e) => { e.preventDefault(); this.dropAction(); });
    this.donebtn.       on(clickEventType, (e) => { e.preventDefault(); this.doneAction(); });
    this.undobtn.       on(clickEventType, (e) => { e.preventDefault(); this.undoAction(); });
    this.openrollbtn.   on(clickEventType, (e) => { e.preventDefault(); this.rollAction(true); });
    this.passbtn.       on(clickEventType, (e) => { e.preventDefault(); this.passAction(); });
    this.gameendnextbtn.on(clickEventType, (e) => { e.preventDefault(); this.gameendNextAction(); });
    this.gameendokbtn.  on(clickEventType, (e) => { e.preventDefault(); this.gameendOkAction(); });
    this.diceAsBtn.     on(clickEventType, (e) => { e.preventDefault(); this.diceAsDoneAction(e); });
    this.settingbtn.    on(clickEventType, (e) => { e.preventDefault(); this.showSettingPanelAction(); });
    this.pausebtn.      on(clickEventType, (e) => { e.preventDefault(); this.pauseClockAction(); });
    this.restartbtn.    on(clickEventType, (e) => { e.preventDefault(); this.restartClockAction(); });
    this.newgamebtn.    on(clickEventType, (e) => { e.preventDefault(); this.newGameAction(); });
    this.cancelbtn.     on(clickEventType, (e) => { e.preventDefault(); this.cancelSettingPanelAction(); });
    this.pointTriangle. on('touchstart mousedown', (e) => { e.preventDefault(); this.pointTouchStartAction(e); });
    $(window).          on('resize',       (e) => { e.preventDefault(); this.redrawAction(); }); 
  }

  initGameOption() {
    this.showpipflg  = $("[name=showpip]")  .prop("checked");
    this.flashflg    = $("[name=flashdest]").prop("checked");
    this.jacobyflg   = $("[name=jacoby]")   .prop("checked");

    this.matchLength = this.matchlen.val();
    const matchinfotxt = (this.matchLength == 0) ? "$" : this.matchLength;
    this.matchinfo.text(matchinfotxt);
    this.score = [0,0,0];
    this.scoreinfo[1].text(0);
    this.scoreinfo[2].text(0);
    this.clockobj.setClockOption();
    $(".pip").toggle(this.showpipflg && !this.clockobj.clockmodeflg); //クロックモードのときはピップ表示しない
  }

  beginNewGame(newmatch = false) {
    const initpos = this.getInitPos(this.gametype);
    this.xgid.initialize(initpos, newmatch, this.matchLength);
    this.board.showBoard2(this.xgid);
    this.showPipInfo();
    this.swapChequerDraggable(true, true);
    this.hideAllPanel();
    this.showOpenRollPanel();
  }

  getInitPos(gametype) {
    switch(gametype) {
      case "half" : return "-b-C--cC--c-B-";
      case "micro": return "-b--C-B-cC-b-c--B-";
      case "short": return "-b---D-C--dD--c-d---B-";
      case "long" : return "-b-----F-D----fF----d-f-----B-";
      case "hyper": return "-aaa------------------AAA-";
      case "nack" : return "-bb---D-C---dD---c-d---BB-";
      default     : return "-b----E-C---eE---c-e----B-";
    }
  }

  async rollAction(openroll = false) {
    this.hideAllPanel();
    this.undoStack = [];
    const dice = BgUtil.randomdice(this.dicemx, openroll);
    this.xgid.dice = dice[2];
    this.makeDiceList(dice[2]);
    this.xgid.usabledice = true;
    this.board.showBoard2(this.xgid);
    await this.board.animateDice(this.animDelay);
    if (openroll) {
      this.player = (dice[0] > dice[1]);
      this.xgid.turn = BgUtil.cvtTurnGm2Xg(this.player);
      this.clockobj.tapTimer(this.player);
      this.gameFinished = false;
    }
    this.swapChequerDraggable(this.player);
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.pushXgidPosition();
    this.showDoneUndoPanel(this.player, openroll);
  }

  undoAction() {
    //ムーブ前のボードを再表示
    if (this.undoStack.length == 0) { return; }
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr, this.gametype);
    this.xgid.usabledice = true;
    this.makeDiceList(this.xgid.dice);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
    this.pushXgidPosition();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(this.player);
  }

  doneAction() {
    if (this.donebtn.prop("disabled")) { return; }
    if (this.gameFinished) { return; }
    this.hideAllPanel();
    this.swapTurn();
    this.xgid.dice = "00";
    this.swapXgTurn();
    this.showPipInfo();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(true, true);
    this.showRollDoublePanel(this.player);
    this.clockobj.tapTimer(this.player);
  }

  resignAction() {
    this.cancelSettingPanelAction();
    if (this.gameFinished) { return; }
    this.hideAllPanel();
    this.swapTurn();
    this.xgid.dice = "00";
    this.calcScore(this.player);
    this.board.showBoard2(this.xgid);
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
    this.clockobj.pauseTimer(false);
  }

  async doubleAction() {
    if (this.doublebtn.prop("disabled")) { return; }
    this.hideAllPanel();
    this.swapTurn();
    this.xgid.dbloffer = true;
    this.board.showBoard2(this.xgid); //double offer
    await this.board.animateCube(this.animDelay); //キューブを揺すのはshowBoard()の後
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
    this.showTakeDropPanel(this.player);
    this.clockobj.tapTimer(this.player);
  }

  takeAction() {
    this.hideAllPanel();
    this.swapTurn();
    this.xgid.dice = "00";
    this.xgid.cube += 1;
    this.xgid.cubepos = this.xgid.turn;
    this.board.showBoard2(this.xgid);
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.swapXgTurn(); //XGのturnを変えるのは棋譜用XGID出力後
    this.showRollDoublePanel(this.player);
    this.clockobj.tapTimer(this.player);
  }

  dropAction() {
    this.hideAllPanel();
    this.swapTurn();
    this.calcScore(this.player); //dblofferフラグをリセットする前に計算する必要あり
    this.xgid.dbloffer = false;
    this.board.showBoard2(this.xgid);
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
    this.clockobj.pauseTimer(false);
  }

  gameendNextAction() {
    this.hideAllPanel();
    this.showScoreInfo();
    this.kifuobj.addKifuXgid(''); //空行
    this.beginNewGame(false);
  }

  gameendOkAction() {
    this.hideAllPanel();
    this.showScoreInfo();
  }

  bearoffAllAction() {
    this.hideAllPanel();
    this.calcScore(this.player); // this.player is winner
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.showGameEndPanel(this.player);
    this.gameFinished = true;
    this.clockobj.pauseTimer(false);
  }

  diceAsDoneAction(e) {
    if (BgUtil.cvtTurnGm2Bd(this.player) != e.currentTarget.id.substring(4, 5)) { return; } //ex. id="dice10"
    this.doneAction();
  }

  showSettingPanelAction() {
    if (this.settingbtn.prop("disabled")) { return; }
    this.clockobj.pauseTimer(true);
    this.settings.css(this.calcCenterPosition("S", this.settings));
    this.settings.slideToggle("normal", () => this.saveSettingVars()); //画面表示、設定情報を退避しておく
    this.setButtonEnabled(this.settingbtn, false);
    this.setButtonEnabled(this.pausebtn, false);
  }

  cancelSettingPanelAction() {
    this.clockobj.startTimer();
    this.settings.slideToggle("normal", () => this.loadSettingVars()); //画面を消す、設定情報を戻す
    this.setButtonEnabled(this.settingbtn, true);
    this.setButtonEnabled(this.pausebtn, this.clockobj.pauseMode); //ゲーム中でないときは非活性のまま
  }

  newGameAction() {
    this.settings.slideToggle("normal"); //画面を消す
    this.settingbtn.prop("disabled", false);
    this.initGameOption();
    this.kifuobj.clearKifuXgid();
    this.beginNewGame(true);
  }

  resetScoreAction() {
    this.score = [0,0,0];
    this.scoreinfo[1].text(0);
    this.scoreinfo[2].text(0);
  }

  passAction() {
    this.xgid.dice = "66";
    this.kifuobj.addKifuXgid(this.xgid.xgidstr);
    this.doneAction();
  }

  makeDiceList(dice) {
    const dice1 = Number(dice.slice(0, 1));
    const dice2 = Number(dice.slice(1, 2));
    if      (dice1 == dice2) { this.dicelist = [dice1, dice1, dice1, dice1]; }
    else if (dice1 <  dice2) { this.dicelist = [dice2, dice1]; } //大きい順
    else                     { this.dicelist = [dice1, dice2]; }
  }

  showPipInfo() {
    this.pipinfo[1].text(this.xgid.get_pip(+1));
    this.pipinfo[2].text(this.xgid.get_pip(-1));
  }

  showScoreInfo() {
    this.scoreinfo[1].text(this.xgid.sc_me);
    this.scoreinfo[2].text(this.xgid.sc_yu);
  }

  calcScore(player) {
    let [cubeprice, gammonprice] = this.xgid.get_gamesc( BgUtil.cvtTurnGm2Xg(player) );
    if (this.gamemode == "hyper") {
      gammonprice = this.calcHyperGammonScore(player);
    }
    if (this.jacobyflg && this.matchLength == 0 && cubeprice == 1) {
      gammonprice = 1;
    }
    this.gamescore = [cubeprice, gammonprice];
    const w = BgUtil.cvtTurnGm2Bd( player);
    const l = BgUtil.cvtTurnGm2Bd(!player);
    const scr = this.gamescore[0] * this.gamescore[1];
    this.xgid.crawford = this.xgid.checkCrawford(this.score[w], scr, this.score[l]);
    this.score[w] += scr;
    this.xgid.sc_me = this.score[1];
    this.xgid.sc_yu = this.score[2];
    this.matchwinflg = (this.matchLength != 0) && (this.score[w] >= this.matchLength);
  }

  calcHyperGammonScore(player) {
    let boff = [3, 3];
    let bgarea = [0, 0];
    const pos = this.xgid.get_position();
    const posary = pos.split("");
    for (let i = 0; i <= 25; i++) {
      const asc = posary[i].charCodeAt(0);
      if (asc == "-".charCodeAt(0)) {
        //do nothing
      } else if (asc >= "A".charCodeAt(0) && asc <= "Z".charCodeAt(0)) {
        const ptnum = asc - "A".charCodeAt(0) + 1;
        boff[0] -= ptnum;
        if (i > 18) { bgarea[0] += ptnum; }
      } else if (asc >= "a".charCodeAt(0) && asc <= "z".charCodeAt(0)) {
        const ptnum = asc - "a".charCodeAt(0) + 1;
        boff[1] -= ptnum;
        if (i < 7) { bgarea[1] += ptnum; }
      }
    } // for

    const looser = player ? 1 : 0;
    const dbloffer = this.xgid.get_dbloffer();
    const contact = this.xgid._have_contact();

    if (boff[looser] > 0)        { return 1; }
    else if (dbloffer)           { return 1; }
    else if (contact)            { return 3; }
    else if (bgarea[looser] > 0) { return 3; }
    else                         { return 2; }
  }

  canDouble(player) {
    return !this.xgid.crawford && (this.xgid.cubepos == 0) || (this.xgid.cubepos == this.xgid.turn);
  }

  showOpenRollPanel() {
    this.showElement(this.openrollbtn, 'R', true);
  }

  showTakeDropPanel(player) {
    if (player) {
      this.showElement(this.takedrop, 'R', player);
    } else {
      this.showElement(this.takedrop, 'L', player);
    }
  }

  showRollDoublePanel(player) {
    this.doublebtn.prop("disabled", !this.canDouble(player) );
    const closeout = this.isCloseout(player);
    this.rollbtn.toggle(!closeout); //rollボタンかpassボタンのどちらかを表示
    this.passbtn.toggle( closeout);
    if (player) {
      this.showElement(this.rolldouble, 'R', player);
    } else {
      this.showElement(this.rolldouble, 'L', player);
    }
  }

  showDoneUndoPanel(player, opening = false) {
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
    //常にダイスの下に表示(opening変数は使わなくなった)
    if (player) {
      this.showElement(this.doneundo, 'R', player, 12);
    } else {
      this.showElement(this.doneundo, 'L', player, -12);
    }
  }

  makeGameEndPanal(player, timeuplose) {
    const mes1 = "You WIN" + ((this.matchwinflg) ? " and the MATCH" : "");
    this.gameend.children('.mes1').text(mes1);

    if (timeuplose) {
      const mes2 = "Opponent LOSE by Timeup!";
      this.gameend.children('.mes2').text(mes2);
    } else {
      const winlevel = ["", "SINGLE", "GAMMON", "BACK GAMMON"];
      const res = winlevel[this.gamescore[1]];
      const mes2 = "Get " + this.gamescore[0] * this.gamescore[1] + "pt (" + res + ")";
      this.gameend.children('.mes2').text(mes2);
    }

    const p1 = BgUtil.cvtTurnGm2Bd(player);
    const p2 = BgUtil.cvtTurnGm2Bd(!player);
    if (timeuplose) {
      this.score[p1] = this.matchLength;
    }
    const mes3 = this.score[p1] + " - " + this.score[p2] + ((this.matchLength == 0) ? "" : "&emsp;(" +this.matchLength + "pt)");
    this.gameend.children('.mes3').html(mes3);
  }

  showGameEndPanel(player, timeuplose = false) {
    this.makeGameEndPanal(player, timeuplose);
    this.gameendnextbtn.toggle(!this.matchwinflg);
    this.gameendokbtn.toggle(this.matchwinflg);
    this.showElement(this.gameend, "B", player);
  }

  hideAllPanel() {
    this.allpanel.hide();
  }

  showElement(elem, pos, player, yoffset=0) {
    elem.show().toggleClass('turn1', player).toggleClass('turn2', !player)
        .css(this.calcCenterPosition(pos, elem, yoffset));
  }

  calcCenterPosition(pos, elem, yoffset=0) {
    let p_top, p_left, p_width, p_height;
    switch (pos) {
    case 'L': //left area
      p_top = 0;
      p_left = 0;
      p_width = 36 * this.board.getVw();
      p_height = 100 * this.board.getVh();
      break;
    case 'R': //right area
      p_top = 0;
      p_left = 42 * this.board.getVw();
      p_width = 36 * this.board.getVw();
      p_height = 100 * this.board.getVh();
      break;
    case 'B': //board area
      p_top = 0;
      p_left = 0;
      p_width = 78 * this.board.getVw();
      p_height = 100 * this.board.getVh();
      break;
    case 'S': //screen (default)
    default:
      p_top = 0;
      p_left = 0;
      p_width = 100 * this.board.getVw();
      p_height = 100 * this.board.getVh();
      break;
    }
    const dy = yoffset * this.board.getVh();
    const wx = p_left + (p_width - elem.outerWidth(true)) / 2;
    const wy = p_top + (p_height - elem.outerHeight(true)) / 2 + dy;

    return {left:wx, top:wy};
  }

  pushXgidPosition() {
   this.undoStack.push(this.xgid.xgidstr);
  }

  popXgidPosition() {
    return this.undoStack.pop();
  }

  swapTurn() {
    this.player = !this.player;
  }

  swapXgTurn() {
    this.xgid.turn = -1 * this.xgid.turn;
  }

  isCloseout(player) {
    const xgturn = BgUtil.cvtTurnGm2Xg(!player); //クローズアウトを確認するのは相手側
    return this.xgid.isCloseout(xgturn);
  }

  setChequerDraggable() {
    //関数内広域変数
    var x;//要素内のクリックされた位置
    var y;
    var dragobj; //ドラッグ中のオブジェクト
    var zidx; //ドラッグ中のオブジェクトのzIndexを保持

    //この関数内の処理は、パフォーマンスのため jQuery Free で記述

    //ドラッグ開始時のコールバック関数
    const evfn_dragstart = ((origevt) => {
      origevt.preventDefault();
      dragobj = origevt.currentTarget; //dragする要素を取得し、広域変数に格納
      if (!dragobj.classList.contains("draggable")) {
        //相手チェッカーのときはそこにポイントオンする(できるときは)
        const position = { //オブジェクトの位置
              left: dragobj.offsetLeft,
              top:  dragobj.offsetTop
            };
        //オブジェクト(チェッカー)の位置からポイント番号を得る
        const point = this.board.getDragEndPoint(position, 1); //下側プレイヤーから見たポイント番号
        this.makeBlockPointAction(point); //そこにブロックポイントを作る
        return;
      }

      dragobj.classList.add("dragging"); //drag中フラグ(クラス追加/削除で制御)
      zidx = dragobj.style.zIndex;
      dragobj.style.zIndex = 999;

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousedown") ? origevt : origevt.changedTouches[0];

      //要素内の相対座標を取得
      x = event.pageX - dragobj.offsetLeft;
      y = event.pageY - dragobj.offsetTop;

      //イベントハンドラを登録
      document.body.addEventListener("mousemove",  evfn_drag,    {passive:false});
      document.body.addEventListener("mouseleave", evfn_dragend, false);
      dragobj.      addEventListener("mouseup",    evfn_dragend, false);
      document.body.addEventListener("touchmove",  evfn_drag,    {passive:false});
      document.body.addEventListener("touchleave", evfn_dragend, false);
      document.body.addEventListener("touchend",   evfn_dragend, false);

      const position = { //dragStartAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 };
      this.dragStartAction(origevt, position);
    });

    //ドラッグ中のコールバック関数
    const evfn_drag = ((origevt) => {
      origevt.preventDefault(); //フリックしたときに画面を動かさないようにデフォルト動作を抑制

      //マウスイベントとタッチイベントの差異を吸収
      const event = (origevt.type === "mousemove") ? origevt : origevt.changedTouches[0];

      //マウスが動いた場所に要素を動かす
      dragobj.style.top  = event.pageY - y + "px";
      dragobj.style.left = event.pageX - x + "px";
    });

    //ドラッグ終了時のコールバック関数
    const evfn_dragend = ((origevt) => {
      origevt.preventDefault();
      dragobj.classList.remove("dragging"); //drag中フラグを削除
      dragobj.style.zIndex = zidx;

      //イベントハンドラの削除
      document.body.removeEventListener("mousemove",  evfn_drag,    false);
      document.body.removeEventListener("mouseleave", evfn_dragend, false);
      dragobj.      removeEventListener("mouseup",    evfn_dragend, false);
      document.body.removeEventListener("touchmove",  evfn_drag,    false);
      document.body.removeEventListener("touchleave", evfn_dragend, false);
      document.body.removeEventListener("touchend",   evfn_dragend, false);

      const position = { //dragStopAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 };
      this.dragStopAction(position);
    });

    //dragできるオブジェクトにdragstartイベントを設定
    for(const elm of this.chequerall) {
      elm.addEventListener("mousedown",  evfn_dragstart, false);
      elm.addEventListener("touchstart", evfn_dragstart, false);
    }
  }

  dragStartAction(event, position) {
    this.dragObject = $(event.currentTarget); //dragStopAction()で使うがここで取り出しておかなければならない
    const id = event.currentTarget.id;
    this.dragStartPt = this.board.getDragStartPoint(id, BgUtil.cvtTurnGm2Bd(this.player));
    if (!this.outerDragFlag) { this.dragStartPos = position; }
    this.outerDragFlag = false;
    this.flashOnMovablePoint(this.dragStartPt);
  }

  checkDragEndPt(xg, dragstartpt, dragendpt) {
    let endpt = dragendpt;
    let ok = false;

    if (dragstartpt == dragendpt) {
      //同じ位置にドロップ(＝クリック)したときは、ダイスの目を使ったマスに動かす
      for (let i = 0; i < this.dicelist.length; i++) {
        //ダイス目でピッタリに上がれればその目を使って上げる
        const endptwk = this.dicelist.includes(dragstartpt) ? dragstartpt - this.dicelist[i]
                                                            : Math.max(dragstartpt - this.dicelist[i], 0);
        if (xg.isMovable(dragstartpt, endptwk)) {
          this.dicelist.splice(i, 1);
          endpt = endptwk;
          ok = true;
          break;
        }
      }
    } else {
      if (this.flashflg) {
        //ドロップされた位置が前後 1pt の範囲であれば OK とする。せっかちな操作に対応
        const ok0 = xg.isMovable(dragstartpt, dragendpt);
        const ok1 = xg.isMovable(dragstartpt, dragendpt + 1);
        const ok2 = xg.isMovable(dragstartpt, dragendpt - 1);
        if      (ok0)         { endpt = dragendpt;     ok = true; } //ちょうどの目にドロップ
        else if (ok1 && !ok2) { endpt = dragendpt + 1; ok = true; } //前後が移動可能な時は進めない
        else if (ok2 && !ok1) { endpt = dragendpt - 1; ok = true; } //ex.24の目で3にドロップしたときは進めない
      } else {
        //イリーガルムーブを許可したとき
        endpt = dragendpt;
        ok = (dragstartpt > dragendpt) && !this.xgid.isBlocked(dragendpt); //掴んだマスより前でブロックポイントでなければtrue
      }
      //D&Dで動かした後クリックで動かせるようにダイスリストを調整しておく
      //known bug:ダイス組み合わせの位置に動かしたときは、次のクリックムーブが正しく動かないことがある
      for (let i = 0; i < this.dicelist.length; i++) {
        if (this.dicelist[i] == (dragstartpt - endpt)) {
          this.dicelist.splice(i, 1);
          break;
        }
      }
    }
    return [endpt, ok];
  }

  dragStopAction(position, animflag = true) {
    this.flashOffMovablePoint();
    const dragendpt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));

    const xg = this.xgid;
    let ok;
    [this.dragEndPt, ok] = this.checkDragEndPt(xg, this.dragStartPt, dragendpt);
    const hit = xg.isHitted(this.dragEndPt);

    if (ok) {
      if (hit) {
        const movestr = this.dragEndPt + "/" + this.param1;
        this.xgid = this.xgid.moveChequer2(movestr);
        const oppoplayer = BgUtil.cvtTurnGm2Bd(!this.player);
        const oppoChequer = this.board.getChequerHitted(this.dragEndPt, oppoplayer);
        const barPt = this.board.getBarPos(oppoplayer);
        if (oppoChequer && animflag) {
          oppoChequer.dom.animate(barPt, 300, () => { this.board.showBoard2(this.xgid); });
        }
      }
      const movestr = this.dragStartPt + "/" + this.dragEndPt;
      this.xgid = this.xgid.moveChequer2(movestr);
      if (!hit) {
        this.board.showBoard2(this.xgid);
      }
    } else {
      this.dragObject.animate(this.dragStartPos, 300);
    }
    this.swapChequerDraggable(this.player);
    this.donebtn.prop("disabled", (!this.xgid.moveFinished() && this.flashflg) );
    const turn = BgUtil.cvtTurnGm2Xg(this.player);
    if (this.xgid.get_boff(turn) == this.ckrnum) { this.bearoffAllAction(); }
  }

  swapChequerDraggable(player, init = false) {
    this.chequerall.removeClass("draggable");
    if (init) { return; }
    const plyr = BgUtil.cvtTurnGm2Bd(player);
    for (let i = 0; i < this.ckrnum; i++) {
      const pt = this.board.chequer[plyr][i].point;
      if (pt == this.param2 || pt == this.param3) { continue; }
      this.board.chequer[plyr][i].dom.addClass("draggable");
    }
  }

  flashOnMovablePoint(startpt) {
    if (!this.flashflg) { return; }
    let dest2 = [];
    const destpt = this.xgid.movablePoint(this.dragStartPt, this.flashflg);
    if (this.player) { dest2 = destpt; }
    else {
      for (const p of destpt) {
        const pt = (p == 0) ? 0 : this.param1 - p;
        dest2.push(pt);
      }
    }
    this.board.flashOnMovablePoint(dest2, BgUtil.cvtTurnGm2Bd(this.player));
  }

  flashOffMovablePoint() {
    this.board.flashOffMovablePoint();
  }

  pointTouchStartAction(origevt) {
    const id = origevt.currentTarget.id;
    const pt = parseInt(id.substring(2));
    const chker = this.board.getChequerOnDragging(pt, BgUtil.cvtTurnGm2Bd(this.player));
    const evttypeflg = (origevt.type === "mousedown")
    const event = (evttypeflg) ? origevt : origevt.changedTouches[0];

    if (chker) { //そのポイントにチェッカーがあればそれを動かす
      const chkerdom = chker.dom;
      if (chkerdom.hasClass("draggable")) {
        this.outerDragFlag = true;
        this.dragStartPos = {left: chkerdom[0].style.left,
                             top:  chkerdom[0].style.top };
        const offset = this.board.pieceWidth / 2; //チェッカーの真ん中をつかむ
        chkerdom.css({left: event.clientX - offset,
                      top:  event.clientY - offset});
        let delegateEvent;
        if (evttypeflg) {
          delegateEvent = new MouseEvent("mousedown", {clientX:event.clientX, clientY:event.clientY});
        } else {
          const touchobj = new Touch({identifier: 12345,
                                      target: chkerdom[0],
                                      clientX: event.clientX,
                                      clientY: event.clientY,
                                      pageX: event.pageX,
                                      pageY: event.pageY});
          delegateEvent = new TouchEvent("touchstart", {changedTouches:[touchobj]});
        }
        chkerdom[0].dispatchEvent(delegateEvent);
      }
    } else { //そのポイントにチェッカーがなければ
      this.makeBlockPointAction(pt); //そこに向かって動かせる2枚を使ってブロックポイントを作る
    }
  }

  makeBlockPointAction(pointto) {
    if (this.dicelist.length < 2) {
      return; //使えるダイスが２個以上なければ何もしない
    }

    const pointfr1 = this.player ? (pointto + this.dicelist[0]) : (pointto - this.dicelist[0]);
    const pointfr2 = this.player ? (pointto + this.dicelist[1]) : (pointto - this.dicelist[1]);

    const ptno1  = this.xgid.get_ptno (pointfr1);
    const ptcol1 = this.xgid.get_ptcol(pointfr1);
    const ptno2  = this.xgid.get_ptno (pointfr2);
    const ptcol2 = this.xgid.get_ptcol(pointfr2);
    const ptno3  = this.xgid.get_ptno (pointto);
    const ptcol3 = this.xgid.get_ptcol(pointto);
    const chkrnum = this.dicelist[0] == this.dicelist[1] ? 2 : 1; //ゾロ目のときは元ポイントに2個以上なければならない
    const ismovablefr = (ptno1 >= chkrnum && ptcol1 == BgUtil.cvtTurnGm2Xg(this.player) &&
                         ptno2 >= chkrnum && ptcol2 == BgUtil.cvtTurnGm2Xg(this.player)); //動かせるチェッカーがあるかどうか
    const ismovableto = (ptno3 == 0 || (ptno3 == 1 && ptcol3 == BgUtil.cvtTurnGm2Xg(!this.player))); //空かブロットかどうか

    if (!(ismovablefr && ismovableto)) {
      return; //動かせるチェッカーが２つない、または、動かし先が空あるいはブロットでなければ何もしない
    }

    //１つ目のチェッカーを動かす
    const chker1 = this.board.getChequerOnDragging(pointfr1, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker1);

    //２つ目のチェッカーを動かす
    const chker2 = this.board.getChequerOnDragging(pointfr2, BgUtil.cvtTurnGm2Bd(this.player));
    this.moveCheckerAction(chker2);
  }

  moveCheckerAction(checker) {
    const checkerdom = checker.dom;
    const position = { //dragStopAction()に渡すオブジェクトを作る
            left: parseInt(checkerdom[0].style.left),
            top:  parseInt(checkerdom[0].style.top)
          };
    this.dragObject = $(checker.id);
    this.dragStartPt = this.board.getDragEndPoint(position, BgUtil.cvtTurnGm2Bd(this.player));
    this.dragStopAction(position, false); //ヒット時のアニメーションをしない
  }

  pauseClockAction() {
    this.clockobj.pauseTimer(true); //ポーズボタンを押せるのはゲーム中モードのときのみ
    this.showElement(this.pausepanel, "B", this.player); //画面表示
    this.setButtonEnabled(this.pausebtn, false);
    this.setButtonEnabled(this.settingbtn, false);
  }

  restartClockAction() {
    this.clockobj.startTimer();
    this.pausepanel.hide(); //画面を消す
    this.setButtonEnabled(this.pausebtn, true);
    this.setButtonEnabled(this.settingbtn, true);
  }

  setButtonEnabled(button, enable) {
    button.prop("disabled", !enable);
  }

  saveSettingVars() {
    this.settingVars.matchlen    = $("#matchlen").val();
    this.settingVars.selminpoint = $("#selminpoint").val();
    this.settingVars.seldelay    = $("#seldelay").val();
    this.settingVars.showpip     = $("#showpip").prop("checked");
    this.settingVars.flashdest   = $("#flashdest").prop("checked");
    this.settingVars.useclock    = $("#useclock").prop("checked");
    this.settingVars.jacoby      = $("#jacoby").prop("checked");
  }

  loadSettingVars() {
    $("#matchlen")   .val(this.settingVars.matchlen);
    $("#selminpoint").val(this.settingVars.selminpoint);
    $("#seldelay")   .val(this.settingVars.seldelay);
    $("#showpip")    .prop("checked", this.settingVars.showpip);
    $("#flashdest")  .prop("checked", this.settingVars.flashdest);
    $("#useclock")   .prop("checked", this.settingVars.useclock);
    $("#jacoby")     .prop("checked", this.settingVars.jacoby);
  }

  redrawAction() {
    this.board.redraw();

    this.allpanel.each((index, elem) => {
      if ($(elem).css("display") != "none") {
        //this.showElement($(elem), 'S', this.player); //panelは中央表示
      }
    });
  }

} //end of class BgGame
