(function () {
  "use strict";

  const REVIEW_STORAGE_KEY = "damage-build-note-battle-review-v1";
  const MAX_REVIEWS = 200;
  const WEATHER_OPTIONS = ["なし", "はれ", "あめ", "すなあらし", "ゆき"];
  const FIELD_OPTIONS = ["なし", "エレキフィールド", "グラスフィールド", "サイコフィールド", "ミストフィールド"];
  const WALL_OPTIONS = ["なし", "リフレクター", "ひかりのかべ"];
  const OUTCOME_OPTIONS = ["未確定", "勝ち", "負け"];
  const ACTION_TYPES = ["技", "交代", "その他"];
  const STAT_KEYS = ["hp", "atk", "def", "spa", "spd", "spe"];
  const STAT_LABELS = { hp: "H", atk: "A", def: "B", spa: "C", spd: "D", spe: "S" };
  const NATURES = [
    "がんばりや", "さみしがり", "いじっぱり", "やんちゃ", "ゆうかん",
    "ずぶとい", "わんぱく", "のうてんき", "のんき", "ひかえめ",
    "おっとり", "うっかりや", "れいせい", "おだやか", "おとなしい",
    "しんちょう", "なまいき", "おくびょう", "せっかち", "ようき",
    "むじゃき", "すなお", "てれや", "きまぐれ", "まじめ",
  ];

  const app = document.getElementById("review-app");
  const toast = document.getElementById("review-toast");
  const state = {
    core: null,
    savedBuilds: [],
    pokemonNames: [],
    review: null,
    reviews: [],
    videoUrl: "",
    videoFileName: "",
  };

  init();

  async function init() {
    try {
      state.core = window.DamageBuildNoteCore;
      if (!state.core) throw new Error("ダメージ計算データを起動できませんでした。");
      await state.core.ready;
      state.savedBuilds = state.core.getSavedBuilds();
      state.pokemonNames = state.core.getPokemonNames();
      state.reviews = loadReviews();
      state.review = createEmptyReview();
      render();
    } catch (error) {
      app.innerHTML = `
        <main class="view">
          <section class="panel">
            <div class="panel-header"><h2>読み込みエラー</h2></div>
            <div class="panel-body"><p class="empty-state">${escapeHtml(error.message || "データを読み込めませんでした")}</p></div>
          </section>
        </main>
      `;
    }
  }

  function createEmptyReview() {
    const now = new Date();
    return normalizeReview({
      id: `review-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: `対戦振り返り ${formatDateTime(now)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      battleType: "single-3",
      outcome: "未確定",
      mySelection: [null, null, null],
      opponent: Array.from({ length: 6 }, () => emptyOpponent()),
      turns: [],
      source: {
        videoName: "",
        duration: 0,
        selectionAt: null,
        resultAt: null,
      },
      memo: "",
    });
  }

  function emptyOpponent() {
    return {
      name: "",
      nature: "まじめ",
      item: "",
      ability: "",
      ev: defaultEv(),
      moves: [],
      estimateSource: "未設定",
      rankingRank: null,
      rankingUpdatedAt: "",
    };
  }

  function defaultEv() {
    return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }

  function cloneEv(ev) {
    const next = defaultEv();
    STAT_KEYS.forEach((key) => { next[key] = clampNumber(ev?.[key], 0, 32, 0); });
    return next;
  }

  function cloneBuild(build) {
    if (!build || !build.name) return null;
    return {
      buildId: String(build.id || ""),
      name: String(build.name || ""),
      nickname: String(build.nickname || ""),
      nature: String(build.nature || "まじめ"),
      item: String(build.item || ""),
      ability: String(build.ability || ""),
      ev: cloneEv(build.ev),
      moves: Array.isArray(build.moves) ? build.moves.slice(0, 4).map((value) => String(value || "")) : ["", "", "", ""],
    };
  }

  function normalizeReview(raw) {
    const source = raw?.source || {};
    const selection = Array.isArray(raw?.mySelection) ? raw.mySelection : [];
    const opponent = Array.isArray(raw?.opponent) ? raw.opponent : [];
    const turns = Array.isArray(raw?.turns) ? raw.turns : [];
    return {
      id: String(raw?.id || `review-${Date.now()}`),
      title: String(raw?.title || "対戦振り返り").slice(0, 80),
      createdAt: String(raw?.createdAt || new Date().toISOString()),
      updatedAt: String(raw?.updatedAt || raw?.createdAt || new Date().toISOString()),
      battleType: "single-3",
      outcome: OUTCOME_OPTIONS.includes(raw?.outcome) ? raw.outcome : "未確定",
      mySelection: [0, 1, 2].map((index) => cloneBuild(selection[index])),
      opponent: Array.from({ length: 6 }, (_, index) => normalizeOpponent(opponent[index])),
      turns: turns.map((turn, index) => normalizeTurn(turn, index)),
      source: {
        videoName: String(source.videoName || "").slice(0, 180),
        duration: clampNumber(source.duration, 0, 60 * 60 * 6, 0),
        selectionAt: nullableNumber(source.selectionAt),
        resultAt: nullableNumber(source.resultAt),
      },
      memo: String(raw?.memo || "").slice(0, 4000),
    };
  }

  function normalizeOpponent(raw) {
    const base = emptyOpponent();
    const value = raw && typeof raw === "object" ? raw : {};
    return {
      ...base,
      name: String(value.name || "").slice(0, 60),
      nature: NATURES.includes(value.nature) ? value.nature : "まじめ",
      item: String(value.item || "").slice(0, 60),
      ability: String(value.ability || "").slice(0, 60),
      ev: cloneEv(value.ev),
      moves: Array.isArray(value.moves) ? value.moves.slice(0, 10).map((move) => String(move || "")).filter(Boolean) : [],
      estimateSource: String(value.estimateSource || "未設定").slice(0, 30),
      rankingRank: Number.isFinite(Number(value.rankingRank)) ? Number(value.rankingRank) : null,
      rankingUpdatedAt: String(value.rankingUpdatedAt || "").slice(0, 30),
    };
  }

  function normalizeTurn(raw, index) {
    const value = raw && typeof raw === "object" ? raw : {};
    return {
      id: String(value.id || `turn-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`),
      no: Math.max(1, Number(value.no) || index + 1),
      time: nullableNumber(value.time),
      myActiveId: String(value.myActiveId || ""),
      opponentActive: String(value.opponentActive || ""),
      myActionType: ACTION_TYPES.includes(value.myActionType) ? value.myActionType : "技",
      myMove: String(value.myMove || "").slice(0, 60),
      opponentActionType: ACTION_TYPES.includes(value.opponentActionType) ? value.opponentActionType : "技",
      opponentMove: String(value.opponentMove || "").slice(0, 60),
      myHpBefore: nullablePercent(value.myHpBefore),
      myHpAfter: nullablePercent(value.myHpAfter),
      opponentHpBefore: nullablePercent(value.opponentHpBefore),
      opponentHpAfter: nullablePercent(value.opponentHpAfter),
      weather: WEATHER_OPTIONS.includes(value.weather) ? value.weather : "なし",
      field: FIELD_OPTIONS.includes(value.field) ? value.field : "なし",
      reflect: WALL_OPTIONS.includes(value.reflect) ? value.reflect : "なし",
      myCritical: Boolean(value.myCritical),
      opponentCritical: Boolean(value.opponentCritical),
      note: String(value.note || "").slice(0, 1000),
    };
  }

  function render() {
    const rankingUpdatedAt = state.core?.getRankingUpdatedAt?.() || "";
    app.innerHTML = `
      <header class="topbar review-topbar">
        <div class="brand">
          <p class="rule-line">Pokemon Champions / 3vs3シングル / 動画・画像は保存しない</p>
          <h1>対戦動画振り返り</h1>
        </div>
        <div class="header-actions">
          <a class="text-button compact-button" href="index.html">戻る</a>
          <button class="text-button compact-button" type="button" data-review-action="new">新規</button>
          <button class="text-button" type="button" data-review-action="save">保存</button>
        </div>
      </header>
      <main class="view review-view">
        ${renderNotice(rankingUpdatedAt)}
        ${renderVideoPanel()}
        ${renderBasicsPanel()}
        ${renderOpponentPanel(rankingUpdatedAt)}
        ${renderTurnsPanel()}
        ${renderMemoPanel()}
        ${renderHistoryPanel()}
      </main>
      ${renderPokemonDatalist()}
    `;
  }

  function renderNotice(rankingUpdatedAt) {
    return `
      <section class="review-notice">
        <strong>試作の範囲</strong>
        <span>動画はこの画面で一時再生するだけです。保存時には対戦記録だけを残します。動画内の文字を自動認識して確定する処理は、次段階で接続する前提です。</span>
        ${rankingUpdatedAt ? `<small>推定型の基準：この端末にあるシングルランキング（更新日 ${escapeHtml(rankingUpdatedAt)}）</small>` : ""}
      </section>
    `;
  }

  function renderVideoPanel() {
    const source = state.review.source;
    const hasVideo = Boolean(state.videoUrl);
    return `
      <section class="panel review-video-panel">
        <div class="panel-header">
          <h2>録画を確認</h2>
          <span class="panel-meta">端末内のみ</span>
        </div>
        <div class="panel-body">
          <label class="review-upload-field">
            <span>録画ファイル</span>
            <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" data-review-field="video-file" />
          </label>
          ${hasVideo ? `
            <video id="review-video" class="review-video" controls playsinline preload="metadata" src="${escapeAttr(state.videoUrl)}"></video>
            <div class="review-video-meta">
              <span>${escapeHtml(source.videoName || state.videoFileName || "読み込み済み動画")}</span>
              <span>${source.duration ? formatClock(source.duration) : "長さを確認中"}</span>
            </div>
            <div class="review-video-actions">
              <button class="ghost-button small" type="button" data-review-action="mark-selection">この位置を選出画面にする</button>
              <button class="ghost-button small" type="button" data-review-action="add-turn-here">この位置から1ターン追加</button>
              <button class="ghost-button small" type="button" data-review-action="mark-result">この位置を結果画面にする</button>
              <button class="ghost-button small" type="button" data-review-action="release-video">動画を外す</button>
            </div>
            <p class="review-helper">選出 ${formatClockOrDash(source.selectionAt)} / 結果 ${formatClockOrDash(source.resultAt)}。保存時は動画ファイルを自動で外します。</p>
          ` : `
            <p class="empty-state">MP4などの録画を選ぶと、このページで再生しながら選出と各ターンを記録できます。</p>
            ${source.videoName ? `<p class="review-helper">前回保存時の動画名：${escapeHtml(source.videoName)} / ${source.duration ? formatClock(source.duration) : "長さ不明"}。ファイル本体は残していません。</p>` : ""}
          `}
        </div>
      </section>
    `;
  }

  function renderBasicsPanel() {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>対戦の基本情報</h2>
          <span class="panel-meta">自分の選出順</span>
        </div>
        <div class="panel-body">
          <div class="field-grid review-two-column">
            <label class="field">
              <span>タイトル</span>
              <input type="text" maxlength="80" data-review-field="title" value="${escapeAttr(state.review.title)}" placeholder="例：○○入り対面構築戦" />
            </label>
            <label class="field">
              <span>結果</span>
              <select data-review-field="outcome">${OUTCOME_OPTIONS.map((value) => option(value, state.review.outcome)).join("")}</select>
            </label>
          </div>
          ${state.savedBuilds.length ? `
            <div class="review-selection-grid">
              ${[0, 1, 2].map((index) => renderSelectionSlot(index)).join("")}
            </div>
          ` : `
            <div class="review-empty-action">
              <p class="empty-state">先に「育成登録」で自分のポケモンを保存すると、ここで選出順をそのまま選べます。</p>
              <a class="primary-button secondary" href="index.html">育成登録へ</a>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function renderSelectionSlot(index) {
    const selected = state.review.mySelection[index];
    const savedOptions = state.savedBuilds.map((build) => `<option value="${escapeAttr(build.id)}" ${build.id === selected?.buildId ? "selected" : ""}>${escapeHtml(buildLabel(build))}</option>`).join("");
    return `
      <label class="review-selection-slot">
        <span>${index + 1}番手</span>
        <select data-review-field="my-selection" data-index="${index}">
          <option value="">選択しない</option>
          ${savedOptions}
        </select>
        <strong>${selected ? escapeHtml(buildLabel(selected)) : "未選択"}</strong>
        ${selected ? `<small>${escapeHtml(selected.nature)} / ${escapeHtml(selected.item || "道具なし")} / ${escapeHtml(formatEv(selected.ev))}</small>` : ""}
      </label>
    `;
  }

  function renderOpponentPanel(rankingUpdatedAt) {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>相手の手持ち 6体</h2>
          <span class="panel-meta">ランキング推定 ${rankingUpdatedAt ? escapeHtml(rankingUpdatedAt) : ""}</span>
        </div>
        <div class="panel-body">
          <p class="review-helper">名前を選ぶと、この端末のシングルランキング上位の性格・努力値・道具・特性を推定型として入れます。動画で分かった内容は下で修正できます。</p>
          <div class="review-opponent-grid">
            ${state.review.opponent.map((opponent, index) => renderOpponentCard(opponent, index)).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderOpponentCard(opponent, index) {
    const estimate = opponent.name ? state.core.getRankingEstimate(opponent.name) : null;
    const topMoves = estimate?.moveUsage?.slice(0, 4) || opponent.moves.slice(0, 4);
    const rankText = opponent.rankingRank ? `使用率 #${opponent.rankingRank}` : opponent.name ? "ランキング外 / 推定なし" : "未入力";
    return `
      <article class="review-opponent-card">
        <div class="review-opponent-head">
          <strong>${index + 1}</strong>
          <span>${escapeHtml(rankText)}</span>
        </div>
        <label class="field">
          <span>ポケモン</span>
          <input list="review-pokemon-options" data-review-field="opponent-name" data-index="${index}" value="${escapeAttr(opponent.name)}" autocomplete="off" placeholder="相手の手持ち" />
        </label>
        ${opponent.name ? `
          <div class="review-estimate-line">
            <span>${escapeHtml(opponent.estimateSource || "推定")}</span>
            <span>${escapeHtml(opponent.nature)} / ${escapeHtml(opponent.item || "道具不明")} / ${escapeHtml(opponent.ability || "特性不明")}</span>
          </div>
          <div class="review-estimate-line subtle">
            <span>努力値</span><span>${escapeHtml(formatEv(opponent.ev))}</span>
          </div>
          ${topMoves.length ? `<div class="tag-list review-ranking-tags">${topMoves.map((move) => `<span class="tag">${escapeHtml(move)}</span>`).join("")}</div>` : ""}
          <div class="review-card-actions">
            <button class="ghost-button small" type="button" data-review-action="apply-ranking" data-index="${index}">上位型を入れ直す</button>
            <button class="ghost-button small" type="button" data-review-action="toggle-opponent-edit" data-index="${index}">推定を修正</button>
          </div>
          ${renderOpponentEdit(opponent, index)}
        ` : ""}
      </article>
    `;
  }

  function renderOpponentEdit(opponent, index) {
    const isOpen = Boolean(opponent.editOpen);
    if (!isOpen) return "";
    return `
      <div class="review-opponent-edit">
        <label class="field">
          <span>性格</span>
          <select data-review-field="opponent-nature" data-index="${index}">${NATURES.map((name) => option(name, opponent.nature)).join("")}</select>
        </label>
        <label class="field">
          <span>道具</span>
          <input type="text" data-review-field="opponent-item" data-index="${index}" value="${escapeAttr(opponent.item)}" placeholder="動画で確認した道具" />
        </label>
        <label class="field">
          <span>特性</span>
          <input type="text" data-review-field="opponent-ability" data-index="${index}" value="${escapeAttr(opponent.ability)}" placeholder="動画で確認した特性" />
        </label>
        <div class="review-ev-grid">
          ${STAT_KEYS.map((stat) => `
            <label><span>${STAT_LABELS[stat]}</span><input type="number" min="0" max="32" step="1" data-review-field="opponent-ev" data-index="${index}" data-stat="${stat}" value="${opponent.ev[stat]}" /></label>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderTurnsPanel() {
    const turns = state.review.turns;
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>ターンごとの行動とダメージ</h2>
          <span class="panel-meta">${turns.length}ターン</span>
        </div>
        <div class="panel-body">
          <p class="review-helper">HPは動画のゲージを見て、おおよその％を入れます。計算値は自分の保存済み育成と、相手の推定型を使った目安です。</p>
          <div class="wide-actions review-turn-actions">
            <button class="primary-button secondary" type="button" data-review-action="add-turn">ターンを追加</button>
            <button class="ghost-button" type="button" data-review-action="clear-turns" ${turns.length ? "" : "disabled"}>ターンを空にする</button>
          </div>
          <div class="review-turn-list">
            ${turns.length ? turns.map((turn, index) => renderTurnCard(turn, index)).join("") : `<p class="empty-state">動画の最初の行動から、1ターンずつ追加してください。</p>`}
          </div>
        </div>
      </section>
    `;
  }

  function renderTurnCard(turn, index) {
    const ownOptions = state.review.mySelection.filter(Boolean);
    const opponentOptions = state.review.opponent.filter((opponent) => opponent.name);
    const ownActive = ownOptions.find((build) => build.buildId === turn.myActiveId) || ownOptions[0] || null;
    const opponentActive = opponentOptions.find((opponent) => opponent.name === turn.opponentActive) || opponentOptions[0] || null;
    const myMoves = ownActive?.moves?.filter(Boolean) || [];
    const opponentMoves = opponentActive ? state.core.getMoveOptions(opponentActive.name).map((move) => move.name) : [];
    const myDamage = calculateTurnDamage(turn, "my", ownActive, opponentActive);
    const opponentDamage = calculateTurnDamage(turn, "opponent", ownActive, opponentActive);
    const myActual = damageFromHp(turn.opponentHpBefore, turn.opponentHpAfter);
    const opponentActual = damageFromHp(turn.myHpBefore, turn.myHpAfter);

    return `
      <article class="review-turn-card">
        <div class="review-turn-head">
          <div><strong>Turn ${index + 1}</strong>${turn.time != null ? `<span>${formatClock(turn.time)}</span>` : ""}</div>
          <button class="danger-button" type="button" data-review-action="delete-turn" data-id="${escapeAttr(turn.id)}">削除</button>
        </div>
        <div class="field-grid review-turn-grid">
          <label class="field">
            <span>自分の場</span>
            <select data-review-field="turn-my-active" data-id="${escapeAttr(turn.id)}">
              <option value="">選択</option>
              ${ownOptions.map((build) => `<option value="${escapeAttr(build.buildId)}" ${build.buildId === turn.myActiveId ? "selected" : ""}>${escapeHtml(buildLabel(build))}</option>`).join("")}
            </select>
          </label>
          <label class="field">
            <span>相手の場</span>
            <select data-review-field="turn-opponent-active" data-id="${escapeAttr(turn.id)}">
              <option value="">選択</option>
              ${opponentOptions.map((opponent) => `<option value="${escapeAttr(opponent.name)}" ${opponent.name === turn.opponentActive ? "selected" : ""}>${escapeHtml(opponent.name)}</option>`).join("")}
            </select>
          </label>
        </div>
        <div class="review-action-columns">
          ${renderActionBlock("自分", "my", turn, myMoves)}
          ${renderActionBlock("相手", "opponent", turn, opponentMoves)}
        </div>
        <div class="review-hp-grid">
          ${renderHpBlock("自分のHP", "my", turn.myHpBefore, turn.myHpAfter, turn.id)}
          ${renderHpBlock("相手のHP", "opponent", turn.opponentHpBefore, turn.opponentHpAfter, turn.id)}
        </div>
        <div class="review-condition-grid">
          <label class="field"><span>天候</span><select data-review-field="turn-weather" data-id="${escapeAttr(turn.id)}">${WEATHER_OPTIONS.map((value) => option(value, turn.weather)).join("")}</select></label>
          <label class="field"><span>フィールド</span><select data-review-field="turn-field" data-id="${escapeAttr(turn.id)}">${FIELD_OPTIONS.map((value) => option(value, turn.field)).join("")}</select></label>
          <label class="field"><span>壁</span><select data-review-field="turn-reflect" data-id="${escapeAttr(turn.id)}">${WALL_OPTIONS.map((value) => option(value, turn.reflect)).join("")}</select></label>
        </div>
        <div class="review-checks">
          <label><input type="checkbox" data-review-field="turn-my-critical" data-id="${escapeAttr(turn.id)}" ${turn.myCritical ? "checked" : ""} /> 自分の急所</label>
          <label><input type="checkbox" data-review-field="turn-opponent-critical" data-id="${escapeAttr(turn.id)}" ${turn.opponentCritical ? "checked" : ""} /> 相手の急所</label>
        </div>
        <div class="review-damage-grid">
          ${renderDamageCard("自分 → 相手", myDamage, myActual, opponentActive?.estimateSource === "ランキング推定")}
          ${renderDamageCard("相手 → 自分", opponentDamage, opponentActual, opponentActive?.estimateSource === "ランキング推定")}
        </div>
        <label class="field review-turn-note">
          <span>メモ</span>
          <textarea rows="2" data-review-field="turn-note" data-id="${escapeAttr(turn.id)}" placeholder="交代読み、技の見落とし、次回の選出案など">${escapeHtml(turn.note)}</textarea>
        </label>
        <datalist id="my-move-options-${escapeAttr(turn.id)}">${myMoves.map((move) => `<option value="${escapeAttr(move)}"></option>`).join("")}</datalist>
        <datalist id="opponent-move-options-${escapeAttr(turn.id)}">${opponentMoves.map((move) => `<option value="${escapeAttr(move)}"></option>`).join("")}</datalist>
      </article>
    `;
  }

  function renderActionBlock(label, side, turn, moves) {
    const actionType = side === "my" ? turn.myActionType : turn.opponentActionType;
    const move = side === "my" ? turn.myMove : turn.opponentMove;
    return `
      <section class="review-action-block">
        <h3>${label}の行動</h3>
        <label class="field">
          <span>種類</span>
          <select data-review-field="turn-${side}-action-type" data-id="${escapeAttr(turn.id)}">${ACTION_TYPES.map((value) => option(value, actionType)).join("")}</select>
        </label>
        <label class="field">
          <span>${actionType === "技" ? "技" : "内容"}</span>
          <input list="${side === "my" ? "my" : "opponent"}-move-options-${escapeAttr(turn.id)}" data-review-field="turn-${side}-move" data-id="${escapeAttr(turn.id)}" value="${escapeAttr(move)}" autocomplete="off" placeholder="${actionType === "技" ? "技を選択・入力" : "交代先や内容"}" />
        </label>
        ${moves.length ? `<small>${escapeHtml(moves.slice(0, 4).join(" / "))}</small>` : ""}
      </section>
    `;
  }

  function renderHpBlock(label, side, before, after, turnId) {
    return `
      <section class="review-hp-block">
        <h3>${label}</h3>
        <div>
          <label><span>前</span><input type="number" min="0" max="100" step="1" data-review-field="turn-${side}-hp-before" data-id="${escapeAttr(turnId)}" value="${before ?? ""}" placeholder="%" /></label>
          <label><span>後</span><input type="number" min="0" max="100" step="1" data-review-field="turn-${side}-hp-after" data-id="${escapeAttr(turnId)}" value="${after ?? ""}" placeholder="%" /></label>
        </div>
      </section>
    `;
  }

  function renderDamageCard(title, result, actual, estimated) {
    const label = result?.ok ? `${result.minPct.toFixed(1)}〜${result.maxPct.toFixed(1)}%` : "計算不可";
    const detail = result?.ok ? `${result.move?.name || "技"} / ${result.note || ""}` : (result?.reason || "技・場のポケモンを選ぶと計算します");
    const consistency = compareDamage(result, actual);
    return `
      <div class="review-damage-card">
        <span>${escapeHtml(title)}</span>
        <strong>${escapeHtml(label)}</strong>
        <small>${escapeHtml(detail)}</small>
        <div class="review-damage-actual">
          <span>動画上の減り：${actual == null ? "未入力" : `${actual.toFixed(0)}%`}</span>
          ${consistency ? `<b class="${consistency.className}">${escapeHtml(consistency.label)}</b>` : ""}
        </div>
        ${estimated ? `<em>相手側はランキング推定型</em>` : ""}
      </div>
    `;
  }

  function renderMemoPanel() {
    return `
      <section class="panel">
        <div class="panel-header"><h2>振り返りメモ</h2><span class="panel-meta">次回へ残すこと</span></div>
        <div class="panel-body">
          <label class="field">
            <span>全体メモ</span>
            <textarea rows="5" data-review-field="memo" placeholder="選出、立ち回り、技選択、相手の型で分かったことなど">${escapeHtml(state.review.memo)}</textarea>
          </label>
        </div>
      </section>
    `;
  }

  function renderHistoryPanel() {
    const stats = aggregateReviews(state.reviews);
    return `
      <section class="panel">
        <div class="panel-header"><h2>履歴と集計</h2><span class="panel-meta">${state.reviews.length}件</span></div>
        <div class="panel-body">
          <div class="review-summary-grid">
            <div><span>対戦数</span><strong>${stats.total}</strong></div>
            <div><span>勝ち</span><strong>${stats.wins}</strong></div>
            <div><span>負け</span><strong>${stats.losses}</strong></div>
            <div><span>勝率</span><strong>${stats.winRate}</strong></div>
          </div>
          ${stats.leads.length ? `
            <div class="review-aggregate-block">
              <h3>先発の選出・勝敗</h3>
              <div class="review-aggregate-list">${stats.leads.map((item) => `<div><strong>${escapeHtml(item.name)}</strong><span>${item.count}回 / ${item.wins}勝${item.losses}敗</span></div>`).join("")}</div>
            </div>
          ` : ""}
          ${stats.opponents.length ? `
            <div class="review-aggregate-block">
              <h3>相手に出たポケモン</h3>
              <div class="review-aggregate-list">${stats.opponents.map((item) => `<div><strong>${escapeHtml(item.name)}</strong><span>${item.count}戦</span></div>`).join("")}</div>
            </div>
          ` : ""}
          <div class="review-history-list">
            ${state.reviews.length ? state.reviews.map(renderHistoryCard).join("") : `<p class="empty-state">保存した対戦はまだありません。</p>`}
          </div>
        </div>
      </section>
    `;
  }

  function renderHistoryCard(review) {
    const selection = review.mySelection.filter(Boolean).map((build) => build.nickname || build.name).join(" → ") || "選出未入力";
    const opponent = review.opponent.filter((item) => item.name).map((item) => item.name).join(" / ") || "相手未入力";
    return `
      <article class="review-history-card">
        <div>
          <h3>${escapeHtml(review.title)}</h3>
          <p>${escapeHtml(formatDateTime(new Date(review.updatedAt)))} / ${escapeHtml(review.outcome)} / ${review.turns.length}ターン</p>
          <p>自分：${escapeHtml(selection)}</p>
          <p>相手：${escapeHtml(opponent)}</p>
        </div>
        <div class="review-card-actions">
          <button class="ghost-button small" type="button" data-review-action="load-history" data-id="${escapeAttr(review.id)}">開く</button>
          <button class="danger-button" type="button" data-review-action="delete-history" data-id="${escapeAttr(review.id)}">削除</button>
        </div>
      </article>
    `;
  }

  function renderPokemonDatalist() {
    return `<datalist id="review-pokemon-options">${state.pokemonNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("")}</datalist>`;
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-review-action]");
    if (!target) return;
    const action = target.dataset.reviewAction;
    if (action === "new") {
      releaseVideo();
      state.review = createEmptyReview();
      showToast("新しい振り返りを始めました");
      render();
      return;
    }
    if (action === "save") {
      saveCurrentReview();
      return;
    }
    if (action === "mark-selection") {
      const time = currentVideoTime();
      if (time == null) return showToast("動画を読み込んでください");
      state.review.source.selectionAt = time;
      state.review.updatedAt = new Date().toISOString();
      showToast("選出画面の時刻を記録しました");
      render();
      return;
    }
    if (action === "mark-result") {
      const time = currentVideoTime();
      if (time == null) return showToast("動画を読み込んでください");
      state.review.source.resultAt = time;
      state.review.updatedAt = new Date().toISOString();
      showToast("結果画面の時刻を記録しました");
      render();
      return;
    }
    if (action === "add-turn" || action === "add-turn-here") {
      addTurn(action === "add-turn-here" ? currentVideoTime() : null);
      render();
      return;
    }
    if (action === "delete-turn") {
      state.review.turns = state.review.turns.filter((turn) => turn.id !== target.dataset.id);
      renumberTurns();
      render();
      return;
    }
    if (action === "clear-turns") {
      if (!window.confirm("入力したターンをすべて空にします。よろしいですか？")) return;
      state.review.turns = [];
      render();
      return;
    }
    if (action === "apply-ranking") {
      applyRankingPreset(Number(target.dataset.index));
      render();
      return;
    }
    if (action === "toggle-opponent-edit") {
      const opponent = state.review.opponent[Number(target.dataset.index)];
      if (opponent) opponent.editOpen = !opponent.editOpen;
      render();
      return;
    }
    if (action === "release-video") {
      releaseVideo();
      showToast("動画を外しました。履歴には保存されません。");
      render();
      return;
    }
    if (action === "load-history") {
      const saved = state.reviews.find((review) => review.id === target.dataset.id);
      if (!saved) return;
      releaseVideo();
      state.review = normalizeReview(deepClone(saved));
      showToast("履歴を開きました。動画は必要な場合だけ再アップロードしてください。");
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (action === "delete-history") {
      const saved = state.reviews.find((review) => review.id === target.dataset.id);
      if (!saved || !window.confirm(`「${saved.title}」を削除します。よろしいですか？`)) return;
      state.reviews = state.reviews.filter((review) => review.id !== saved.id);
      persistReviews();
      showToast("履歴を削除しました");
      render();
    }
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.dataset?.reviewField) return;
    updateReviewField(target, false);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target.dataset?.reviewField === "video-file") {
      handleVideoFile(target.files?.[0]);
      return;
    }
    if (!target.dataset?.reviewField) return;
    updateReviewField(target, true);
  });

  function updateReviewField(target, shouldRender) {
    const field = target.dataset.reviewField;
    const index = Number(target.dataset.index);
    const turn = state.review.turns.find((item) => item.id === target.dataset.id);
    const value = target.type === "checkbox" ? target.checked : target.value;

    if (field === "title") state.review.title = String(value).slice(0, 80);
    if (field === "outcome") state.review.outcome = OUTCOME_OPTIONS.includes(value) ? value : "未確定";
    if (field === "memo") state.review.memo = String(value).slice(0, 4000);
    if (field === "my-selection") {
      const build = state.savedBuilds.find((item) => item.id === value);
      state.review.mySelection[index] = build ? cloneBuild(build) : null;
      state.review.turns.forEach((item) => {
        if (!item.myActiveId && index === 0 && build) item.myActiveId = build.buildId;
      });
    }
    if (field === "opponent-name") {
      const opponent = state.review.opponent[index];
      if (opponent) {
        opponent.name = String(value).trim();
        if (state.pokemonNames.includes(opponent.name)) applyRankingPreset(index, { keepEditOpen: true });
        else {
          Object.assign(opponent, emptyOpponent(), { name: opponent.name });
        }
      }
    }
    if (field === "opponent-nature" && state.review.opponent[index]) state.review.opponent[index].nature = NATURES.includes(value) ? value : "まじめ";
    if (field === "opponent-item" && state.review.opponent[index]) state.review.opponent[index].item = String(value).slice(0, 60);
    if (field === "opponent-ability" && state.review.opponent[index]) state.review.opponent[index].ability = String(value).slice(0, 60);
    if (field === "opponent-ev" && state.review.opponent[index]) state.review.opponent[index].ev[target.dataset.stat] = clampNumber(value, 0, 32, 0);

    if (turn) {
      if (field === "turn-my-active") turn.myActiveId = String(value);
      if (field === "turn-opponent-active") turn.opponentActive = String(value);
      if (field === "turn-my-action-type") turn.myActionType = ACTION_TYPES.includes(value) ? value : "技";
      if (field === "turn-opponent-action-type") turn.opponentActionType = ACTION_TYPES.includes(value) ? value : "技";
      if (field === "turn-my-move") turn.myMove = String(value).slice(0, 60);
      if (field === "turn-opponent-move") turn.opponentMove = String(value).slice(0, 60);
      if (field === "turn-my-hp-before") turn.myHpBefore = nullablePercent(value);
      if (field === "turn-my-hp-after") turn.myHpAfter = nullablePercent(value);
      if (field === "turn-opponent-hp-before") turn.opponentHpBefore = nullablePercent(value);
      if (field === "turn-opponent-hp-after") turn.opponentHpAfter = nullablePercent(value);
      if (field === "turn-weather") turn.weather = WEATHER_OPTIONS.includes(value) ? value : "なし";
      if (field === "turn-field") turn.field = FIELD_OPTIONS.includes(value) ? value : "なし";
      if (field === "turn-reflect") turn.reflect = WALL_OPTIONS.includes(value) ? value : "なし";
      if (field === "turn-my-critical") turn.myCritical = Boolean(value);
      if (field === "turn-opponent-critical") turn.opponentCritical = Boolean(value);
      if (field === "turn-note") turn.note = String(value).slice(0, 1000);
    }

    state.review.updatedAt = new Date().toISOString();
    if (shouldRender) render();
  }

  function handleVideoFile(file) {
    if (!file) return;
    releaseVideo();
    state.videoUrl = URL.createObjectURL(file);
    state.videoFileName = file.name;
    state.review.source.videoName = file.name;
    state.review.source.duration = 0;
    state.review.source.selectionAt = null;
    state.review.source.resultAt = null;
    state.review.updatedAt = new Date().toISOString();
    render();
    const video = document.getElementById("review-video");
    if (!video) return;
    video.addEventListener("loadedmetadata", () => {
      state.review.source.duration = Number.isFinite(video.duration) ? video.duration : 0;
      state.review.updatedAt = new Date().toISOString();
      const meta = document.querySelector(".review-video-meta span:last-child");
      if (meta) meta.textContent = state.review.source.duration ? formatClock(state.review.source.duration) : "長さ不明";
    }, { once: true });
  }

  function releaseVideo() {
    if (state.videoUrl) URL.revokeObjectURL(state.videoUrl);
    state.videoUrl = "";
    state.videoFileName = "";
  }

  function currentVideoTime() {
    const video = document.getElementById("review-video");
    if (!video || !Number.isFinite(video.currentTime)) return null;
    return Number(video.currentTime.toFixed(1));
  }

  function addTurn(time) {
    const own = state.review.mySelection.filter(Boolean)[0] || null;
    const opponent = state.review.opponent.find((item) => item.name) || null;
    state.review.turns.push(normalizeTurn({
      id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      no: state.review.turns.length + 1,
      time,
      myActiveId: own?.buildId || "",
      opponentActive: opponent?.name || "",
      myActionType: "技",
      opponentActionType: "技",
    }, state.review.turns.length));
    state.review.updatedAt = new Date().toISOString();
  }

  function renumberTurns() {
    state.review.turns.forEach((turn, index) => { turn.no = index + 1; });
    state.review.updatedAt = new Date().toISOString();
  }

  function applyRankingPreset(index, options = {}) {
    const opponent = state.review.opponent[index];
    if (!opponent?.name) return;
    const estimate = state.core.getRankingEstimate(opponent.name);
    if (!estimate?.found) {
      opponent.estimateSource = "ランキング外";
      opponent.rankingRank = null;
      opponent.rankingUpdatedAt = "";
      return;
    }
    const editOpen = options.keepEditOpen ? opponent.editOpen : false;
    Object.assign(opponent, {
      nature: estimate.nature || "まじめ",
      item: estimate.item || "",
      ability: estimate.ability || "",
      ev: cloneEv(estimate.ev),
      moves: Array.isArray(estimate.moves) ? estimate.moves.slice(0, 10) : [],
      estimateSource: "ランキング推定",
      rankingRank: estimate.rank,
      rankingUpdatedAt: estimate.updatedAt || "",
      editOpen,
    });
  }

  function calculateTurnDamage(turn, side, ownActive, opponentActive) {
    if (!ownActive || !opponentActive) return { ok: false, reason: "場のポケモンを選択してください" };
    const isMySide = side === "my";
    const actionType = isMySide ? turn.myActionType : turn.opponentActionType;
    const move = isMySide ? turn.myMove : turn.opponentMove;
    if (actionType !== "技") return { ok: false, reason: "技以外の行動です" };
    return state.core.calculateMove({
      attacker: isMySide ? ownActive : opponentActive,
      defender: isMySide ? opponentActive : ownActive,
      move,
      conditions: {
        weather: turn.weather,
        field: turn.field,
        reflect: turn.reflect,
        criticalHit: isMySide ? turn.myCritical : turn.opponentCritical,
      },
    });
  }

  function damageFromHp(before, after) {
    if (before == null || after == null) return null;
    const damage = Number(before) - Number(after);
    return damage >= 0 && damage <= 100 ? damage : null;
  }

  function compareDamage(result, actual) {
    if (!result?.ok || actual == null) return null;
    const tolerance = 3;
    if (actual >= result.minPct - tolerance && actual <= result.maxPct + tolerance) return { label: "概ね一致", className: "match" };
    if (actual < result.minPct - tolerance) return { label: "動画上は小さめ", className: "low" };
    return { label: "動画上は大きめ", className: "high" };
  }

  function saveCurrentReview() {
    state.review.updatedAt = new Date().toISOString();
    const snapshot = normalizeReview(deepClone(state.review));
    const existingIndex = state.reviews.findIndex((review) => review.id === snapshot.id);
    if (existingIndex >= 0) state.reviews.splice(existingIndex, 1, snapshot);
    else state.reviews.unshift(snapshot);
    state.reviews = state.reviews.slice(0, MAX_REVIEWS);
    persistReviews();
    releaseVideo();
    showToast("動画を残さず、対戦記録を保存しました");
    render();
  }

  function loadReviews() {
    try {
      const parsed = JSON.parse(localStorage.getItem(REVIEW_STORAGE_KEY) || "[]");
      return (Array.isArray(parsed) ? parsed : []).map(normalizeReview).slice(0, MAX_REVIEWS);
    } catch {
      return [];
    }
  }

  function persistReviews() {
    localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(state.reviews.map((review) => normalizeReview(review))));
  }

  function aggregateReviews(reviews) {
    const decided = reviews.filter((review) => review.outcome === "勝ち" || review.outcome === "負け");
    const wins = decided.filter((review) => review.outcome === "勝ち").length;
    const losses = decided.filter((review) => review.outcome === "負け").length;
    const leads = new Map();
    const opponents = new Map();
    reviews.forEach((review) => {
      const lead = review.mySelection[0];
      if (lead?.name) {
        const key = lead.name;
        const item = leads.get(key) || { name: key, count: 0, wins: 0, losses: 0 };
        item.count += 1;
        if (review.outcome === "勝ち") item.wins += 1;
        if (review.outcome === "負け") item.losses += 1;
        leads.set(key, item);
      }
      review.opponent.filter((item) => item.name).forEach((item) => {
        const row = opponents.get(item.name) || { name: item.name, count: 0 };
        row.count += 1;
        opponents.set(item.name, row);
      });
    });
    return {
      total: reviews.length,
      wins,
      losses,
      winRate: decided.length ? `${((wins / decided.length) * 100).toFixed(1)}%` : "—",
      leads: [...leads.values()].sort((a, b) => b.count - a.count || b.wins - a.wins).slice(0, 5),
      opponents: [...opponents.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja")).slice(0, 8),
    };
  }

  function option(label, selected, value = label) {
    return `<option value="${escapeAttr(value)}" ${String(value) === String(selected) ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function buildLabel(build) {
    return build.nickname ? `${build.nickname}（${build.name}）` : build.name;
  }

  function formatEv(ev) {
    return STAT_KEYS.map((key) => `${STAT_LABELS[key]}${clampNumber(ev?.[key], 0, 32, 0)}`).join("-");
  }

  function formatDateTime(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "日時不明";
    return new Intl.DateTimeFormat("ja-JP", { dateStyle: "short", timeStyle: "short" }).format(date);
  }

  function formatClock(seconds) {
    if (!Number.isFinite(Number(seconds))) return "—";
    const total = Math.max(0, Math.floor(Number(seconds)));
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const secs = total % 60;
    return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  function formatClockOrDash(value) {
    return value == null ? "—" : formatClock(value);
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(max, Math.max(min, Math.round(number))) : fallback;
  }

  function nullableNumber(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function nullablePercent(value) {
    if (value === "" || value == null) return null;
    const number = Number(value);
    return Number.isFinite(number) ? Math.min(100, Math.max(0, Math.round(number))) : null;
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2000);
  }
})();
