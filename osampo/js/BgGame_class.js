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
    this.xgid = new Xgid(null, this.gametype);
    this.board = new BgBoard("bgBoardApp", this.gametype);
    this.undoStack = [];
    this.animDelay = 800;
    this.settingVars = {}; //設定内容を保持するオブジェクト

    this.setDomNames();
    this.setEventHandler();
    this.setChequerDraggable();
    this.outerDragFlag = false; //駒でない部分をタップしてドラッグを始めたら true
    this.beginNewGame(); //新規ゲームを始める
  } //end of constructor()

  setDomNames() {
    //button
    this.rollbtn     = $("#rollbtn");
    this.resignbtn   = $("#resignbtn");
    this.donebtn     = $("#donebtn");
    this.undobtn     = $("#undobtn");
    this.newgamebtn  = $("#newgamebtn");
    this.cancelbtn   = $("#cancelbtn");
    this.openrollbtn = $("#openingroll");
    this.nextgamebtn = $("#nextgamebtn");
    this.settingbtn  = $("#settingbtn");
    this.allactionbtn= $("#undobtn,#donebtn,#rollbtn");

    //point
    this.point       = $(".point,.pool");

    //panel
    this.allpanel    = $(".panel,#undobtn,#donebtn,#rollbtn");
    this.splash      = $("#splash");
    this.youfirst    = $("#youfirst");
    this.gameend     = $("#gameend");
    this.hideAllPanel(); //font awesome が描画するのを待つ必要がある

    this.cannotmove  = $("#cannotmove");
    this.settings    = $("#settings");
    this.settings.css(BgUtil.getLeftTopHash(0, this.settingbtn.height()));

    //chequer
    this.chequerall  = $(".chequer");
  }

  setEventHandler() {
    const clickEventType = 'click touchstart'; //(( window.ontouchstart !== null ) ? 'click':'touchstart');
    //Button Click Event
    this.rollbtn.    on(clickEventType, (e) => { e.preventDefault(); this.rollAction(false); });
    this.donebtn.    on(clickEventType, (e) => { e.preventDefault(); this.doneAction(); });
    this.undobtn.    on(clickEventType, (e) => { e.preventDefault(); this.undoAction(); });
    this.openrollbtn.on(clickEventType, (e) => { e.preventDefault(); this.rollAction(true); });
    this.nextgamebtn.on(clickEventType, (e) => { e.preventDefault(); this.nextGameAction(); });
    this.settingbtn. on(clickEventType, (e) => { e.preventDefault(); this.showSettingPanelAction(); });
    this.resignbtn.  on(clickEventType, (e) => { e.preventDefault(); this.resignAction(); });
    this.cancelbtn.  on(clickEventType, (e) => { e.preventDefault(); this.cancelSettingPanelAction(); });
    this.newgamebtn. on(clickEventType, (e) => { e.preventDefault(); this.newGameAction(); });
    this.point.      on('touchstart mousedown', (e) => { e.preventDefault(); this.pointTouchStartAction(e); });
    $(window).       on('resize',       (e) => { e.preventDefault(); this.redrawAction(); }); 
  }

  initGameOption() {
  }

  beginNewGame() {
    const initpos = "-b-C--cC--c-B-";
    this.xgid.initialize(initpos);
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(true, true);
    this.hideAllPanel();
    this.showOpenRollPanel();
  }

  async rollAction(openroll = false) {
    this.hideAllPanel();
    this.undoStack = [];
    const dice = BgUtil.randomdice(this.dicemx, openroll);
    this.xgid.dice = dice[2];
    this.xgid.usabledice = true;
    this.board.showBoard2(this.xgid);
    await this.board.animateDice(this.animDelay);
    if (openroll) {
      this.player = (dice[0] > dice[1]);
      this.xgid.turn = BgUtil.cvtTurnGm2Xg(this.player);
      this.showYouFirstPanel(this.player);
      await BgUtil.sleep(1000);
      this.youfirst.fadeOut(1500);
    }
    this.swapChequerDraggable(this.player);
    this.pushXgidPosition();
    if (this.xgid.moveFinished()) { //ロール後全く動かせないとき
      this.showCannotMovePanel(this.player); //ダイスアニメーションを待ってダイアログを表示
      await BgUtil.sleep(1000);
      this.cannotmove.fadeOut(1500);
      await BgUtil.sleep(1500); //フェードアウトを待って
      this.doneAction(); //「動かし終わり」のボタンを勝手にクリック
      return;
    }
    this.showDoneUndoPanel(this.player);
  }

  undoAction() {
    //ムーブ前のボードを再表示
    if (this.undoStack.length == 0) { return; }
    const xgidstr = this.popXgidPosition();
    this.xgid = new Xgid(xgidstr, this.gametype);
    this.xgid.usabledice = true;
    this.donebtn.prop("disabled", !this.xgid.moveFinished() );
    this.pushXgidPosition();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(this.player);
  }

  doneAction() {
    if (this.donebtn.prop("disabled")) { return; }
    this.hideAllPanel();
    this.swapTurn();
    this.xgid.dice = "00";
    this.swapXgTurn();
    this.board.showBoard2(this.xgid);
    this.swapChequerDraggable(true, true);
    this.showRollPanel(this.player);
  }

  resignAction() {
    this.settings.slideUp("normal");
    this.settingbtn.prop("disabled", false);
    this.swapTurn();
    this.bearoffAllAction();
  }

  bearoffAllAction() {
    this.disableAllActionButton();
    this.showGameEndPanel(this.player);
  }

  showSettingPanelAction() {
    this.showElement(this.settings, true, true);
    this.settings.slideDown("normal");
    this.saveSettingVars();
    this.settingbtn.prop("disabled", true);
    this.allactionbtn.prop("disabled", true);
  }

  cancelSettingPanelAction() {
    this.settings.slideUp("normal"); //画面を消す
    this.loadSettingVars();
    this.settingbtn.prop("disabled", false);
  }

  newGameAction() {
    this.settings.slideUp("normal"); //画面を消す
    this.settingbtn.prop("disabled", false);
    this.setChequerIcon();
    this.beginNewGame();
  }

  nextGameAction() {
    this.beginNewGame();
  }

  showRollPanel(player) {
    this.rollbtn.prop("disabled", false);
    this.showElement(this.rollbtn, player);
  }

  showDoneUndoPanel(player) {
    this.undobtn.prop("disabled", false);
    this.donebtn.prop("disabled", !this.xgid.moveFinished() );
    this.showElement(this.donebtn, player);
    this.showElement(this.undobtn, player);
  }

  showOpenRollPanel() {
    this.showElement(this.splash, true, true);
  }

  showGameEndPanel(player) {
    this.showElement(this.gameend, player, true);
  }

  showYouFirstPanel(player) {
    this.showElement(this.youfirst, player, true);
  }

  showCannotMovePanel(player) {
    this.showElement(this.cannotmove, player, true);
  }

  hideAllPanel() {
    this.allpanel.hide();
  }

  disableAllActionButton() {
    this.allactionbtn.prop("disabled", true);
  }

  showElement(elem, player, pos = false) {
    const postision = this.calcElementPosition(elem, player, pos);
    elem.show().toggleClass('turn1', player).toggleClass('turn2', !player).css(postision);
  }

  calcElementPosition(elem, player, pos) {
    let xx, yy;
    if (pos) { //画面中央
      xx = 50;
      yy = 50;
    } else { //playerに依存した位置
      const tf = (player) ? "T" : "F";
      const idpos = elem.attr("id") + tf;
      const pposary = {"rollbtnT": [50, 90], "undobtnT": [30, 90], "donebtnT": [50, 90],
                       "rollbtnF": [50, 10], "undobtnF": [70, 10], "donebtnF": [50, 10]};
      const ppos =  pposary[idpos];
      xx = ppos[0];
      yy = ppos[1];
    }

    const wx = xx * this.board.getVw() - elem.outerWidth(true) / 2;
    const wy = yy * this.board.getVh() - elem.outerHeight(true) / 2;
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

  setChequerIcon() {
    const player1icon  = $("[name=player1icon]:checked").val();
    const player2icon  = $("[name=player2icon]:checked").val();
    $(".player1chequer").addClass(player1icon);
    $(".player2chequer").addClass(player2icon);
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
      dragobj = origevt.currentTarget; //dragする要素を取得し、広域変数に格納
      if (!dragobj.classList.contains("draggable")) { return; } //draggableでないオブジェクトは無視

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

      const ui = {position: { //dragStartAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 }};
      this.dragStartAction(origevt, ui);
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
      dragobj.classList.remove("dragging"); //drag中フラグを削除
      dragobj.style.zIndex = zidx;

      //イベントハンドラの削除
      document.body.removeEventListener("mousemove",  evfn_drag,    false);
      document.body.removeEventListener("mouseleave", evfn_dragend, false);
      dragobj.      removeEventListener("mouseup",    evfn_dragend, false);
      document.body.removeEventListener("touchmove",  evfn_drag,    false);
      document.body.removeEventListener("touchleave", evfn_dragend, false);
      document.body.removeEventListener("touchend",   evfn_dragend, false);

      const ui = {position: { //dragStopAction()に渡すオブジェクトを作る
                   left: dragobj.offsetLeft,
                   top:  dragobj.offsetTop
                 }};
      this.dragStopAction(origevt, ui);
    });

    //dragできるオブジェクトにdragstartイベントを設定
    for(const elm of this.chequerall) {
      elm.addEventListener("mousedown",  evfn_dragstart, false);
      elm.addEventListener("touchstart", evfn_dragstart, false);
    }
  }

  dragStartAction(event, ui) {
    this.dragObject = $(event.currentTarget); //dragStopAction()で使うがここで取り出しておかなければならない
    const id = event.currentTarget.id;
    this.dragStartPt = this.board.getDragStartPoint(id, BgUtil.cvtTurnGm2Bd(this.player));
    if (!this.outerDragFlag) { this.dragStartPos = ui.position; }
    this.outerDragFlag = false;
    this.flashOnMovablePoint(this.dragStartPt);
  }

  dragStopAction(event, ui) {
    this.flashOffMovablePoint();
    const dragendpt = this.board.getDragEndPoint(ui.position, BgUtil.cvtTurnGm2Bd(this.player));

    const xg = this.xgid;
    //ドロップされた位置が前後 1pt の範囲であれば OK とする。せっかちな操作に対応
    const ok0 = xg.isMovable(this.dragStartPt, dragendpt);
    const ok1 = xg.isMovable(this.dragStartPt, dragendpt + 1);
    const ok2 = xg.isMovable(this.dragStartPt, dragendpt - 1);
    let ok = false;

    if      (ok0)         { this.dragEndPt = dragendpt;     ok = true; }
    else if (ok1 && !ok2) { this.dragEndPt = dragendpt + 1; ok = true; } //前後が移動可能な時は進めない
    else if (ok2 && !ok1) { this.dragEndPt = dragendpt - 1; ok = true; } //ex.24の目で3にドロップしたときは進めない

    const hit = xg.isHitted(this.dragEndPt);

    if (ok) {
      if (hit) {
        const movestr = this.dragEndPt + "/" + this.param1;
        this.xgid = this.xgid.moveChequer2(movestr);
        const oppoplayer = BgUtil.cvtTurnGm2Bd(!this.player);
        const oppoChequer = this.board.getChequerHitted(this.dragEndPt, oppoplayer);
        const barPt = this.board.getBarPos(oppoplayer);
        if (oppoChequer) {
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
    this.donebtn.prop("disabled", !this.xgid.moveFinished() );
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
    let dest2 = [];
    const destpt = this.xgid.movablePoint(this.dragStartPt);
    for (const p of destpt) {
        let pt;
        if (this.player) { 
          pt = (p == 0) ? this.param2 : p;
        } else {
          pt = (p == 0) ? this.param3 : this.param1 - p;
        }
        dest2.push(pt);
    }
    this.board.flashOnMovablePoint(dest2, BgUtil.cvtTurnGm2Bd(this.player));
  }

  flashOffMovablePoint() {
    this.board.flashOffMovablePoint();
  }

  pointTouchStartAction(origevt) {
    const id = origevt.currentTarget.id;
    const pt = parseInt(id.substr(2));
    const chker = this.board.getChequerOnDragging(pt, BgUtil.cvtTurnGm2Bd(this.player));
    const evttypeflg = (origevt.type === "mousedown")
    const event = (evttypeflg) ? origevt : origevt.changedTouches[0];

    if (chker) { //chker may be undefined
      const chkerdom = chker.dom;
      if (chkerdom.hasClass("draggable")) {
        this.outerDragFlag = true;
        this.dragStartPos = {left: chkerdom[0].style.left,
                             top:  chkerdom[0].style.top };
        chkerdom.css({left: event.clientX - 30,
                      top:  event.clientY - 30});
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
    }
  }

  saveSettingVars() {
    this.settingVars.player1icon = $("[name=player1icon]:checked").val();
    this.settingVars.player2icon = $("[name=player2icon]:checked").val();
    this.settingVars.rollbtnprop = this.rollbtn.prop("disabled");
    this.settingVars.donebtnprop = this.donebtn.prop("disabled");
    this.settingVars.undobtnprop = this.undobtn.prop("disabled");
  }

  loadSettingVars() {
    $("[name=player1icon]").val([this.settingVars.player1icon]);
    $("[name=player2icon]").val([this.settingVars.player2icon]);
    this.rollbtn.prop("disabled", this.settingVars.rollbtnprop);
    this.donebtn.prop("disabled", this.settingVars.donebtnprop);
    this.undobtn.prop("disabled", this.settingVars.undobtnprop);
  }

  redrawAction() {
    this.board.redraw();

    this.allpanel.each((index, elem) => {
      if ($(elem).css("display") != "none") {
        this.showElement($(elem), this.player, $(elem).hasClass("panel")); //panelは中央表示
      }
    });
  }

} //end of class BgGame
