(function () {
  "use strict";

  const DATA_DIR = "data#U203b#U4f7f#U3046#U5834#U5408#U540d#U524d#U5909#U66f4#U7981#U6b62";
  const LEVEL = 50;
  const IV = 31;
  const POINT_TOTAL = 66;
  const POINT_MAX = 32;
  const STORAGE_KEY = "damage-build-note-v1";
  const APP_NAME = "Damage Build Note";
  const SEASON_ALL = "all";

  const STAT_KEYS = [
    { key: "hp", label: "HP", csv: "HP" },
    { key: "atk", label: "攻撃", csv: "攻撃" },
    { key: "def", label: "防御", csv: "防御" },
    { key: "spa", label: "特攻", csv: "特攻" },
    { key: "spd", label: "特防", csv: "特防" },
    { key: "spe", label: "素早", csv: "素早" },
  ];

  const TYPE_CLASS = {
    ノーマル: "normal",
    ほのお: "fire",
    みず: "water",
    でんき: "electric",
    くさ: "grass",
    こおり: "ice",
    かくとう: "fighting",
    どく: "poison",
    じめん: "ground",
    ひこう: "flying",
    エスパー: "psychic",
    むし: "bug",
    いわ: "rock",
    ゴースト: "ghost",
    ドラゴン: "dragon",
    あく: "dark",
    はがね: "steel",
    フェアリー: "fairy",
  };

  const TYPE_CHART = {
    ノーマル: { いわ: 0.5, ゴースト: 0, はがね: 0.5 },
    ほのお: { ほのお: 0.5, みず: 0.5, くさ: 2, こおり: 2, むし: 2, いわ: 0.5, ドラゴン: 0.5, はがね: 2 },
    みず: { ほのお: 2, みず: 0.5, くさ: 0.5, じめん: 2, いわ: 2, ドラゴン: 0.5 },
    でんき: { みず: 2, でんき: 0.5, くさ: 0.5, じめん: 0, ひこう: 2, ドラゴン: 0.5 },
    くさ: { ほのお: 0.5, みず: 2, くさ: 0.5, どく: 0.5, じめん: 2, ひこう: 0.5, むし: 0.5, いわ: 2, ドラゴン: 0.5, はがね: 0.5 },
    こおり: { ほのお: 0.5, みず: 0.5, くさ: 2, こおり: 0.5, じめん: 2, ひこう: 2, ドラゴン: 2, はがね: 0.5 },
    かくとう: { ノーマル: 2, こおり: 2, どく: 0.5, ひこう: 0.5, エスパー: 0.5, むし: 0.5, いわ: 2, ゴースト: 0, あく: 2, はがね: 2, フェアリー: 0.5 },
    どく: { くさ: 2, どく: 0.5, じめん: 0.5, いわ: 0.5, ゴースト: 0.5, はがね: 0, フェアリー: 2 },
    じめん: { ほのお: 2, でんき: 2, くさ: 0.5, どく: 2, ひこう: 0, むし: 0.5, いわ: 2, はがね: 2 },
    ひこう: { でんき: 0.5, くさ: 2, かくとう: 2, むし: 2, いわ: 0.5, はがね: 0.5 },
    エスパー: { かくとう: 2, どく: 2, エスパー: 0.5, あく: 0, はがね: 0.5 },
    むし: { ほのお: 0.5, くさ: 2, かくとう: 0.5, どく: 0.5, ひこう: 0.5, エスパー: 2, ゴースト: 0.5, あく: 2, はがね: 0.5, フェアリー: 0.5 },
    いわ: { ほのお: 2, こおり: 2, かくとう: 0.5, じめん: 0.5, ひこう: 2, むし: 2, はがね: 0.5 },
    ゴースト: { ノーマル: 0, エスパー: 2, ゴースト: 2, あく: 0.5 },
    ドラゴン: { ドラゴン: 2, はがね: 0.5, フェアリー: 0 },
    あく: { かくとう: 0.5, エスパー: 2, ゴースト: 2, あく: 0.5, フェアリー: 0.5 },
    はがね: { ほのお: 0.5, みず: 0.5, でんき: 0.5, こおり: 2, いわ: 2, はがね: 0.5, フェアリー: 2 },
    フェアリー: { ほのお: 0.5, かくとう: 2, どく: 0.5, ドラゴン: 2, あく: 2, はがね: 0.5 },
  };

  const NATURES = [
    ["がんばりや", null, null],
    ["さみしがり", "atk", "def"],
    ["いじっぱり", "atk", "spa"],
    ["やんちゃ", "atk", "spd"],
    ["ゆうかん", "atk", "spe"],
    ["ずぶとい", "def", "atk"],
    ["わんぱく", "def", "spa"],
    ["のうてんき", "def", "spd"],
    ["のんき", "def", "spe"],
    ["ひかえめ", "spa", "atk"],
    ["おっとり", "spa", "def"],
    ["うっかりや", "spa", "spd"],
    ["れいせい", "spa", "spe"],
    ["おだやか", "spd", "atk"],
    ["おとなしい", "spd", "def"],
    ["しんちょう", "spd", "spa"],
    ["なまいき", "spd", "spe"],
    ["おくびょう", "spe", "atk"],
    ["せっかち", "spe", "def"],
    ["ようき", "spe", "spa"],
    ["むじゃき", "spe", "spd"],
    ["すなお", null, null],
    ["てれや", null, null],
    ["きまぐれ", null, null],
    ["まじめ", null, null],
  ].map(([name, up, down]) => ({ name, up, down }));

  const state = {
    activeView: "build",
    pokemon: [],
    moves: [],
    tools: [],
    mega: [],
    seasonKeys: [],
    seasonFilter: SEASON_ALL,
    ranking: null,
    pokemonByName: new Map(),
    moveByName: new Map(),
    moveByKey: new Map(),
    megaByBase: new Map(),
    baseByMega: new Map(),
    movesByPokemon: new Map(),
    rankingByPokemon: new Map(),
    build: null,
    calc: null,
    saved: [],
  };

  const defaultEv = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const physicalEv = () => ({ hp: 0, atk: 32, def: 0, spa: 0, spd: 2, spe: 32 });
  const bulkyEv = () => ({ hp: 32, atk: 0, def: 32, spa: 0, spd: 2, spe: 0 });

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let deferredInstallPrompt = null;

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
  });

  window.addEventListener("appinstalled", () => {
    deferredInstallPrompt = null;
    showToast("ホーム画面に追加しました");
  });

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        showToast("オフライン保存の準備に失敗しました");
      });
    });
  }

  init();

  async function init() {
    try {
      const [pokemonCsv, moveCsv, toolCsv, megaCsv, rankingJson] = await Promise.all([
        fetchText(`${DATA_DIR}/pokemon.csv`),
        fetchText(`${DATA_DIR}/pokemon_moves.csv`),
        fetchText(`${DATA_DIR}/tool.csv`),
        fetchText(`${DATA_DIR}/mega.csv`),
        fetchJson(`${DATA_DIR}/season_ranking_single_s2.json`).catch(() => null),
      ]);

      const pokemonRows = parseCsv(pokemonCsv);
      state.seasonKeys = extractSeasonKeys(pokemonRows);
      state.seasonFilter = state.seasonKeys[state.seasonKeys.length - 1] || SEASON_ALL;
      state.pokemon = pokemonRows.map(normalizePokemon).filter((row) => row.name);
      state.moves = parseCsv(moveCsv).map(normalizeMove).filter((row) => row.pokemon && row.name);
      state.tools = parseCsv(toolCsv).filter((row) => row["名前"]);
      state.mega = parseCsv(megaCsv).map(normalizeMega).filter((row) => row.baseName && row.megaName);
      state.ranking = rankingJson;

      state.pokemon.forEach((pokemon) => state.pokemonByName.set(pokemon.name, pokemon));
      state.moves.forEach((move) => {
        if (!state.moveByName.has(move.name)) state.moveByName.set(move.name, move);
        const key = moveKey(move.name);
        if (!state.moveByKey.has(key)) state.moveByKey.set(key, move);
      });
      groupMega();
      groupMoves();
      groupRanking();
      restoreSaved();
      createInitialState();
      render();
    } catch (error) {
      app.innerHTML = `<main class="view"><section class="panel"><div class="panel-header"><h2>読み込みエラー</h2></div><div class="panel-body"><p class="empty-state">${escapeHtml(error.message)}</p></div></section></main>`;
    }
  }

  async function fetchText(url) {
    const response = await fetch(encodeURI(url));
    if (!response.ok) throw new Error(`${url} を読み込めませんでした`);
    return response.text();
  }

  async function fetchJson(url) {
    const response = await fetch(encodeURI(url));
    if (!response.ok) throw new Error(`${url} を読み込めませんでした`);
    return response.json();
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let cell = "";
    let quoted = false;

    for (let i = 0; i < text.length; i += 1) {
      const char = text[i];
      const next = text[i + 1];
      if (char === '"' && quoted && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = !quoted;
      } else if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
      } else if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") i += 1;
        row.push(cell);
        if (row.some((value) => value !== "")) rows.push(row);
        row = [];
        cell = "";
      } else {
        cell += char;
      }
    }

    if (cell || row.length) {
      row.push(cell);
      rows.push(row);
    }

    const headers = (rows.shift() || []).map((header) => header.replace(/^\uFEFF/, ""));
    return rows.map((values) => {
      const entry = {};
      headers.forEach((header, index) => {
        entry[header] = values[index] || "";
      });
      return entry;
    });
  }

  function normalizePokemon(row) {
    const seasons = {};
    Object.keys(row).forEach((key) => {
      if (/^S\d+$/i.test(key)) seasons[key.toUpperCase()] = row[key] === "TRUE";
    });
    return {
      no: row["No"],
      name: row["名前"],
      type1: row["タイプ1"],
      type2: row["タイプ2"],
      ability1: row["とくせい1"],
      ability2: row["とくせい2"],
      hiddenAbility: row["かくれとくせい"],
      weight: number(row["おもさ"], 0),
      stats: {
        hp: number(row["HP"]),
        atk: number(row["攻撃"]),
        def: number(row["防御"]),
        spa: number(row["特攻"]),
        spd: number(row["特防"]),
        spe: number(row["素早"]),
      },
      seasons,
    };
  }

  function normalizeMega(row) {
    return {
      no: row["図鑑No"],
      megaName: row["ポケモン名"],
      type1: row["タイプ1"],
      type2: row["タイプ2"],
      baseName: row["元ポケモン名"],
    };
  }

  function extractSeasonKeys(rows) {
    const keys = new Set();
    rows.forEach((row) => {
      Object.keys(row).forEach((key) => {
        if (/^S\d+$/i.test(key)) keys.add(key.toUpperCase());
      });
    });
    return [...keys].sort((a, b) => number(a.slice(1), 0) - number(b.slice(1), 0));
  }

  function groupMega() {
    state.megaByBase = new Map();
    state.baseByMega = new Map();
    state.mega.forEach((entry) => {
      if (!state.megaByBase.has(entry.baseName)) state.megaByBase.set(entry.baseName, []);
      state.megaByBase.get(entry.baseName).push(entry);
      state.baseByMega.set(entry.megaName, entry.baseName);
    });
    state.megaByBase.forEach((entries) => {
      entries.sort((a, b) => a.megaName.localeCompare(b.megaName, "ja"));
    });
  }

  function normalizeMove(row) {
    return {
      pokemon: row["ポケモン名"],
      name: row["技名前"],
      type: row["タイプ"],
      category: row["分類"],
      powerText: row["威力"],
      power: number(row["威力"], null),
      accuracy: row["命中"],
      pp: row["PP"],
      hits: row["技のヒット数"] || "1",
      description: row["技の説明"] || "",
      candidate: row["候補"] === "TRUE",
    };
  }

  function groupMoves() {
    const grouped = new Map();
    state.moves.forEach((move) => {
      if (!grouped.has(move.pokemon)) grouped.set(move.pokemon, []);
      const bucket = grouped.get(move.pokemon);
      if (!bucket.some((item) => moveKey(item.name) === moveKey(move.name))) bucket.push(move);
    });
    grouped.forEach((bucket) => {
      bucket.sort((a, b) => Number(b.candidate) - Number(a.candidate) || a.name.localeCompare(b.name, "ja"));
    });
    state.movesByPokemon = grouped;
  }

  function groupRanking() {
    const rows = state.ranking && Array.isArray(state.ranking.rows) ? state.ranking.rows : [];
    rows.forEach((row) => state.rankingByPokemon.set(row.name, row));
  }

  function restoreSaved() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      state.saved = Array.isArray(parsed) ? parsed : [];
    } catch {
      state.saved = [];
    }
  }

  function persistSaved() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved.slice(0, 24)));
  }

  function createInitialState() {
    const preferredAttacker = firstSelectable(["ガブリアス", "リザードン", "フシギバナ"]) || firstSelectablePokemon().name;
    const preferredDefender = firstSelectable(["ブリジュラス", "カメックス", "フシギバナ"]) || firstSelectablePokemon().name || preferredAttacker;
    const attackerMoves = suggestMoves(preferredAttacker);

    state.build = {
      name: preferredAttacker,
      nickname: "",
      nature: "ようき",
      item: "こだわりハチマキ",
      ability: "",
      ev: physicalEv(),
      moves: attackerMoves,
      updatedAt: Date.now(),
    };

    state.calc = {
      attackerName: preferredAttacker,
      attackerNature: "ようき",
      attackerItem: "こだわりハチマキ",
      attackerEv: cloneEv(state.build.ev),
      defenderName: preferredDefender,
      defenderNature: "ずぶとい",
      defenderItem: "",
      defenderEv: bulkyEv(),
      moves: attackerMoves.slice(),
      weather: "なし",
      reflect: "なし",
    };
  }

  function firstExisting(names) {
    return names.find((name) => state.pokemonByName.has(name));
  }

  function firstSelectable(names) {
    return names.find((name) => state.pokemonByName.has(name) && isPokemonSelectable(name));
  }

  function firstSelectablePokemon() {
    return getSelectablePokemon()[0] || state.pokemon[0];
  }

  function getSelectablePokemon() {
    return state.pokemon
      .filter((pokemon) => isPokemonSelectable(pokemon.name))
      .sort((a, b) => rankingIndex(a.name) - rankingIndex(b.name) || number(a.no, 9999) - number(b.no, 9999) || a.name.localeCompare(b.name, "ja"));
  }

  function isPokemonSelectable(name) {
    const pokemon = state.pokemonByName.get(name);
    if (!pokemon) return false;
    if (state.seasonFilter === SEASON_ALL) return true;
    return pokemon.seasons[state.seasonFilter] === true;
  }

  function rankingIndex(name) {
    const direct = state.rankingByPokemon.get(name);
    if (direct) return direct.rank || 99999;
    const baseName = state.baseByMega.get(name);
    const base = baseName ? state.rankingByPokemon.get(baseName) : null;
    return base?.rank || 99999;
  }

  function render() {
    app.innerHTML = `
      <header class="topbar">
        <div class="brand">
          <p class="rule-line">Lv.50 / IV31固定 / 66pt・1項目32pt</p>
          <h1>${APP_NAME}</h1>
        </div>
        <div class="header-actions">
          <button class="icon-button" type="button" data-action="sync-calc" aria-label="育成をダメージ計算へ同期">${iconSync()}</button>
          <button class="text-button compact-button" type="button" data-action="install-app">追加</button>
          <button class="text-button" type="button" data-action="save">保存</button>
        </div>
      </header>
      <nav class="tabs" role="tablist">
        ${renderTab("build", "育成登録")}
        ${renderTab("calc", "ダメージ計算")}
        ${renderTab("team", "チーム")}
      </nav>
      ${renderSeasonFilter()}
      ${renderActiveView()}
      ${renderPokemonDatalist()}
    `;
  }

  function renderTab(key, label) {
    return `<button class="tab-button" type="button" role="tab" data-tab="${key}" aria-selected="${state.activeView === key}">${label}</button>`;
  }

  function renderActiveView() {
    if (state.activeView === "calc") return renderCalcView();
    if (state.activeView === "team") return renderTeamView();
    return renderBuildView();
  }

  function renderSeasonFilter() {
    const selectableCount = getSelectablePokemon().length;
    return `
      <div class="filter-strip">
        <label for="season-filter">対象</label>
        <select id="season-filter" data-field="season-filter">
          ${option("全体", state.seasonFilter, SEASON_ALL)}
          ${state.seasonKeys.map((key) => option(key, state.seasonFilter, key)).join("")}
        </select>
        <span>${selectableCount}体 / ランキング順</span>
      </div>
    `;
  }

  function renderBuildView() {
    const pokemon = getPokemon(state.build.name);
    const stats = calcStats(pokemon, state.build.ev, state.build.nature);
    const results = calcAllMoves({
      attackerName: state.build.name,
      attackerNature: state.build.nature,
      attackerEv: state.build.ev,
      attackerItem: state.build.item,
      defenderName: state.calc.defenderName,
      defenderNature: state.calc.defenderNature,
      defenderEv: state.calc.defenderEv,
      defenderItem: state.calc.defenderItem,
      moves: state.build.moves,
      weather: state.calc.weather,
      reflect: state.calc.reflect,
    });

    return `
      <main class="view two-column">
        <div class="view">
          ${renderBasicPanel("build")}
          <section class="panel">
            <div class="panel-header">
              <h2>ステータス</h2>
              <span class="panel-meta" data-point-remaining="build">残り ${POINT_TOTAL - totalPoints(state.build.ev)} / ${POINT_TOTAL}</span>
            </div>
            <div class="panel-body">
              ${renderPointSummary("build", state.build.ev)}
              ${renderStatRows("build", state.build.ev, stats, state.build.nature)}
            </div>
          </section>
          ${renderMovesPanel("build", state.build.name, state.build.moves, results)}
        </div>
        <div class="view">
          ${renderPreviewPanel(results)}
          ${renderTargetPanel()}
        </div>
      </main>
    `;
  }

  function renderCalcView() {
    const results = calcAllMoves(state.calc);
    return `
      <main class="view">
        <section class="panel">
          <div class="panel-header">
            <h2>ダメージ計算</h2>
            <span class="panel-meta">4技同時計算</span>
          </div>
          <div class="panel-body">
            <div class="summary-grid">
              ${renderSummaryBox("攻撃側", state.calc.attackerName, state.calc.attackerNature, state.calc.attackerItem, state.calc.attackerEv)}
              <div class="vs-box">VS</div>
              ${renderSummaryBox("防御側", state.calc.defenderName, state.calc.defenderNature, state.calc.defenderItem, state.calc.defenderEv)}
            </div>
            <div class="quick-actions">
              <button class="ghost-button" type="button" data-action="sync-calc">育成から読み込み</button>
              <button class="ghost-button" type="button" data-action="swap-sides">攻守を入替</button>
            </div>
          </div>
        </section>
        <div class="calc-grid">
          <div class="view">
            ${renderBasicPanel("calc-attacker")}
            <section class="panel compact">
              <div class="panel-header"><h3>攻撃側ステータス</h3><span class="panel-meta" data-point-remaining="calc-attacker">残り ${POINT_TOTAL - totalPoints(state.calc.attackerEv)} / ${POINT_TOTAL}</span></div>
              <div class="panel-body">
                ${renderPointSummary("calc-attacker", state.calc.attackerEv)}
                ${renderStatRows("calc-attacker", state.calc.attackerEv, calcStats(getPokemon(state.calc.attackerName), state.calc.attackerEv, state.calc.attackerNature), state.calc.attackerNature)}
              </div>
            </section>
          </div>
          <div class="view">
            ${renderBasicPanel("calc-defender")}
            <section class="panel compact">
              <div class="panel-header"><h3>防御側ステータス</h3><span class="panel-meta" data-point-remaining="calc-defender">残り ${POINT_TOTAL - totalPoints(state.calc.defenderEv)} / ${POINT_TOTAL}</span></div>
              <div class="panel-body">
                ${renderPointSummary("calc-defender", state.calc.defenderEv)}
                ${renderStatRows("calc-defender", state.calc.defenderEv, calcStats(getPokemon(state.calc.defenderName), state.calc.defenderEv, state.calc.defenderNature), state.calc.defenderNature)}
              </div>
            </section>
          </div>
        </div>
        ${renderMovesPanel("calc", state.calc.attackerName, state.calc.moves, results)}
        <section class="panel">
          <div class="panel-header">
            <h2>条件</h2>
            <span class="panel-meta">簡易補正</span>
          </div>
          <div class="panel-body field-grid">
            <div class="field">
              <label for="weather">天候</label>
              <select id="weather" data-field="weather" class="plain-select">
                ${option("なし", state.calc.weather)}
                ${option("はれ", state.calc.weather)}
                ${option("あめ", state.calc.weather)}
              </select>
            </div>
            <div class="field">
              <label for="reflect">壁</label>
              <select id="reflect" data-field="reflect" class="plain-select">
                ${option("なし", state.calc.reflect)}
                ${option("リフレクター", state.calc.reflect)}
                ${option("ひかりのかべ", state.calc.reflect)}
              </select>
            </div>
          </div>
        </section>
        <div class="wide-actions">
          <button class="primary-button" type="button" data-action="apply-calc">攻撃側を育成へ反映</button>
          <button class="primary-button secondary" type="button" data-action="save">保存</button>
        </div>
      </main>
    `;
  }

  function renderTeamView() {
    const cards = state.saved.length
      ? state.saved
          .map((build) => {
            const moveTags = build.moves.filter(Boolean).map((move) => `<span class="tag">${escapeHtml(move)}</span>`).join("");
            return `
              <article class="team-card">
                <div class="team-card-header">
                  <div>
                    <h3>${escapeHtml(build.nickname || build.name)}</h3>
                    <p>${escapeHtml(build.name)} / ${escapeHtml(build.nature)} / ${formatEv(build.ev)}</p>
                  </div>
                  <button class="danger-button" type="button" data-action="delete-build" data-id="${build.id}">削除</button>
                </div>
                <div class="tag-list">${moveTags}</div>
                <div class="quick-actions">
                  <button class="ghost-button" type="button" data-action="load-build" data-id="${build.id}">開く</button>
                  <button class="ghost-button" type="button" data-action="load-build-calc" data-id="${build.id}">計算へ</button>
                </div>
              </article>
            `;
          })
          .join("")
      : `<p class="empty-state">保存した育成はまだありません。</p>`;

    return `
      <main class="view">
        <section class="panel">
          <div class="panel-header">
            <h2>チーム</h2>
            <span class="panel-meta">${state.saved.length}件</span>
          </div>
          <div class="panel-body">
            <div class="wide-actions">
              <button class="primary-button secondary" type="button" data-action="save">現在の育成を保存</button>
              <button class="ghost-button" type="button" data-action="new-build">新規作成</button>
            </div>
            <div class="team-list">${cards}</div>
          </div>
        </section>
      </main>
    `;
  }

  function renderBasicPanel(mode) {
    const source = getModeSource(mode);
    const pokemon = getPokemon(source.name);
    const abilities = getAbilityOptions(source.name);
    const itemOptions = ["", ...state.tools.slice(0, 80).map((tool) => tool["名前"])];
    const title = mode === "calc-defender" ? "防御側" : mode === "calc-attacker" ? "攻撃側" : "基本情報";
    const nameField = mode === "build" ? "build-name" : mode === "calc-attacker" ? "calc-attacker-name" : "calc-defender-name";
    const natureField = mode === "build" ? "build-nature" : mode === "calc-attacker" ? "calc-attacker-nature" : "calc-defender-nature";
    const itemField = mode === "build" ? "build-item" : mode === "calc-attacker" ? "calc-attacker-item" : "calc-defender-item";
    const abilityField = mode === "build" ? "build-ability" : "";

    return `
      <section class="panel">
        <div class="panel-header">
          <h2>${title}</h2>
          <span class="panel-meta">${renderTypePills(pokemon)}</span>
        </div>
        <div class="panel-body field-grid">
          <div class="field">
            <label for="${nameField}">ポケモン</label>
            <input id="${nameField}" list="pokemon-options" data-field="${nameField}" value="${escapeAttr(source.name)}" autocomplete="off" />
            ${renderMegaActions(mode, source.name)}
          </div>
          <div class="field">
            <label for="${natureField}">性格</label>
            <select id="${natureField}" data-field="${natureField}">
              ${NATURES.map((nature) => `<option value="${nature.name}" ${nature.name === source.nature ? "selected" : ""}>${natureLabel(nature)}</option>`).join("")}
            </select>
          </div>
          ${
            mode === "build"
              ? `<div class="field">
                  <label for="nickname">ニックネーム</label>
                  <input id="nickname" data-field="nickname" value="${escapeAttr(state.build.nickname)}" placeholder="${escapeAttr(source.name)}" />
                </div>`
              : ""
          }
          ${
            mode === "build"
              ? `<div class="field">
                  <label for="${abilityField}">特性</label>
                  <select id="${abilityField}" data-field="${abilityField}">
                    ${["", ...abilities].map((ability) => option(ability || "未指定", state.build.ability || "未指定", ability)).join("")}
                  </select>
                </div>`
              : ""
          }
          <div class="field">
            <label for="${itemField}">道具</label>
            <select id="${itemField}" data-field="${itemField}">
              ${itemOptions.map((item) => option(item || "未指定", source.item || "未指定", item)).join("")}
            </select>
          </div>
        </div>
      </section>
    `;
  }

  function renderPointSummary(mode, ev) {
    const used = totalPoints(ev);
    const width = Math.min(100, Math.round((used / POINT_TOTAL) * 100));
    return `
      <div class="point-summary" data-point-summary="${mode}">
        <span><strong data-point-used>${used}</strong> / ${POINT_TOTAL}</span>
        <div class="point-bar" aria-hidden="true"><span data-point-bar style="width:${width}%"></span></div>
        <span>上限 ${POINT_MAX}</span>
      </div>
    `;
  }

  function renderStatRows(mode, ev, stats, natureName) {
    const nature = getNature(natureName);
    return `
      <div class="stats-list">
        ${STAT_KEYS.map((stat) => {
          const value = ev[stat.key] || 0;
          const sign = nature.up === stat.key ? "↑" : nature.down === stat.key ? "↓" : "";
          return `
            <div class="stat-row" data-mode="${mode}" data-stat="${stat.key}">
              <div class="stat-label">${stat.label}</div>
              <div class="stat-value">${stats[stat.key]}${sign ? `<small>${sign}</small>` : ""}</div>
              <button class="mini-button" type="button" data-action="point-minus" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}を下げる">−</button>
              <input type="range" min="0" max="${POINT_MAX}" value="${value}" data-action="point-range" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}ポイント" />
              <button class="mini-button" type="button" data-action="point-plus" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}を上げる">＋</button>
              <input class="stat-number" type="number" inputmode="numeric" min="0" max="${POINT_MAX}" value="${value}" data-action="point-number" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}ポイント数" />
              <div class="stat-quick-buttons" aria-label="${stat.label}のクイック設定">
                <button class="mini-button quick-point-button" type="button" data-action="point-set" data-value="0" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}を0にする">0</button>
                <button class="mini-button quick-point-button" type="button" data-action="point-set" data-value="32" data-mode="${mode}" data-stat="${stat.key}" aria-label="${stat.label}を32にする">32</button>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  }

  function renderMovesPanel(mode, pokemonName, moves, results) {
    const available = getMoves(pokemonName);
    const title = mode === "calc" ? "技と計算結果" : "技 (4/4)";
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>${title}</h2>
          <span class="panel-meta">CSV ${available.length}候補</span>
        </div>
        <div class="panel-body">
          <div class="moves-list">
            ${[0, 1, 2, 3].map((slot) => renderMoveSlot(mode, slot, moves[slot], available, results[slot])).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderMoveSlot(mode, slot, selected, available, result) {
    const move = findMoveInList(available, selected) || findAnyMove(selected);
    const selectedKey = moveKey(selected);
    return `
      <div class="move-row">
        <span class="slot-index">${slot + 1}</span>
        <div class="move-main">
          <select class="move-select" data-field="move" data-mode="${mode}" data-slot="${slot}">
            <option value="">技を選択</option>
            ${available.map((candidate) => `<option value="${escapeAttr(candidate.name)}" ${moveKey(candidate.name) === selectedKey ? "selected" : ""}>${escapeHtml(candidate.name)}${candidate.candidate ? " *" : ""}</option>`).join("")}
          </select>
          ${move ? renderMoveMeta(move) : ""}
        </div>
        <div>
          <div class="${result && result.ok ? "damage-value" : "damage-value damage-empty"}">${resultLabel(result)}</div>
          <div class="damage-note">${resultNote(result)}</div>
        </div>
      </div>
    `;
  }

  function renderMoveMeta(move) {
    return `
      <div class="move-detail">
        ${typePill(move.type)}
        <span>${escapeHtml(move.category)}</span>
        <span>威力 ${displayPower(move)}</span>
        ${move.accuracy ? `<span>命中 ${escapeHtml(move.accuracy)}</span>` : ""}
      </div>
    `;
  }

  function renderPreviewPanel(results) {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>ダメージ計算プレビュー</h2>
          <span class="panel-meta">${escapeHtml(state.calc.defenderName)}</span>
        </div>
        <div class="panel-body">
          <div class="damage-list">
            ${results.map((result, index) => renderDamageRow(index, result)).join("")}
          </div>
          <div class="quick-actions">
            <button class="primary-button secondary" type="button" data-action="sync-calc">計算へ送る</button>
            <button class="primary-button" type="button" data-action="apply-calc">計算値を反映</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderDamageRow(index, result) {
    const move = result?.move;
    return `
      <div class="damage-row">
        <span class="slot-index">${index + 1}</span>
        <div class="move-main">
          <div class="move-line">
            <span class="move-name">${escapeHtml(move?.name || "未選択")}</span>
            ${move ? typePill(move.type) : ""}
          </div>
          <div class="move-detail">${resultNote(result) || "計算対象外"}</div>
        </div>
        <div class="${result && result.ok ? "damage-value" : "damage-value damage-empty"}">${resultLabel(result)}</div>
      </div>
    `;
  }

  function renderTargetPanel() {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>防御側</h2>
          <span class="panel-meta">${renderTypePills(getPokemon(state.calc.defenderName))}</span>
        </div>
        <div class="panel-body field-grid">
          <div class="field">
            <label for="target-name">相手</label>
            <input id="target-name" list="pokemon-options" data-field="calc-defender-name" value="${escapeAttr(state.calc.defenderName)}" autocomplete="off" />
            ${renderMegaActions("calc-defender", state.calc.defenderName)}
          </div>
          <div class="field">
            <label for="target-nature">性格</label>
            <select id="target-nature" data-field="calc-defender-nature">
              ${NATURES.map((nature) => `<option value="${nature.name}" ${nature.name === state.calc.defenderNature ? "selected" : ""}>${natureLabel(nature)}</option>`).join("")}
            </select>
          </div>
        </div>
      </section>
    `;
  }

  function renderSummaryBox(title, pokemonName, nature, item, ev) {
    const pokemon = getPokemon(pokemonName);
    return `
      <div class="summary-box">
        <h3>${title}</h3>
        <dl>
          <dt>名前</dt><dd>${escapeHtml(pokemonName)}</dd>
          <dt>タイプ</dt><dd>${escapeHtml([pokemon.type1, pokemon.type2].filter(Boolean).join(" / "))}</dd>
          <dt>性格</dt><dd>${escapeHtml(nature)}</dd>
          <dt>道具</dt><dd>${escapeHtml(item || "未指定")}</dd>
          <dt>pt</dt><dd>${formatEv(ev)}</dd>
        </dl>
      </div>
    `;
  }

  function renderPokemonDatalist() {
    return `
      <datalist id="pokemon-options">
        ${getSelectablePokemon().map((pokemon) => `<option value="${escapeAttr(pokemon.name)}"></option>`).join("")}
      </datalist>
    `;
  }

  function renderMegaActions(mode, name) {
    const baseName = state.baseByMega.get(name);
    if (baseName) {
      return `<div class="mega-actions"><button class="ghost-button small" type="button" data-action="switch-pokemon" data-mode="${mode}" data-name="${escapeAttr(baseName)}">通常に戻す</button></div>`;
    }

    const megaEntries = (state.megaByBase.get(name) || []).filter((entry) => state.pokemonByName.has(entry.megaName) && isPokemonSelectable(entry.megaName));
    if (!megaEntries.length) return "";

    return `
      <div class="mega-actions">
        ${megaEntries.map((entry) => `<button class="ghost-button small" type="button" data-action="switch-pokemon" data-mode="${mode}" data-name="${escapeAttr(entry.megaName)}">${megaButtonLabel(entry.megaName)}</button>`).join("")}
      </div>
    `;
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-tab], [data-action]");
    if (!target) return;

    const tab = target.dataset.tab;
    if (tab) {
      state.activeView = tab;
      render();
      return;
    }

    const action = target.dataset.action;
    if (action === "point-plus" || action === "point-minus") {
      const delta = action === "point-plus" ? 1 : -1;
      setPoint(target.dataset.mode, target.dataset.stat, getEvByMode(target.dataset.mode)[target.dataset.stat] + delta);
      return;
    }
    if (action === "point-set") {
      setPoint(target.dataset.mode, target.dataset.stat, number(target.dataset.value, 0));
      return;
    }
    if (action === "save") saveCurrentBuild();
    if (action === "sync-calc") syncBuildToCalc();
    if (action === "apply-calc") applyCalcToBuild();
    if (action === "swap-sides") swapSides();
    if (action === "new-build") newBuild();
    if (action === "load-build") loadBuild(target.dataset.id, false);
    if (action === "load-build-calc") loadBuild(target.dataset.id, true);
    if (action === "delete-build") deleteBuild(target.dataset.id);
    if (action === "switch-pokemon") updatePokemon(target.dataset.mode, target.dataset.name);
    if (action === "install-app") installApp();
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!target.dataset) return;
    if (target.dataset.action === "point-range" || target.dataset.action === "point-number") {
      setPoint(target.dataset.mode, target.dataset.stat, number(target.value, 0), { renderNow: false });
    }
    if (target.dataset.field === "nickname") {
      state.build.nickname = target.value;
    }
  });

  document.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!target.dataset) return;
    const field = target.dataset.field;
    if (field === "build-name") updatePokemon("build", target.value);
    if (field === "calc-attacker-name") updatePokemon("calc-attacker", target.value);
    if (field === "calc-defender-name") updatePokemon("calc-defender", target.value);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.dataset) return;
    if (target.dataset.action === "point-range" || target.dataset.action === "point-number") {
      setPoint(target.dataset.mode, target.dataset.stat, number(target.value, 0));
      return;
    }

    const field = target.dataset.field;

    if (field === "build-name") updatePokemon("build", target.value);
    if (field === "calc-attacker-name") updatePokemon("calc-attacker", target.value);
    if (field === "calc-defender-name") updatePokemon("calc-defender", target.value);
    if (field === "build-nature") state.build.nature = target.value;
    if (field === "calc-attacker-nature") state.calc.attackerNature = target.value;
    if (field === "calc-defender-nature") state.calc.defenderNature = target.value;
    if (field === "build-item") state.build.item = target.value;
    if (field === "calc-attacker-item") state.calc.attackerItem = target.value;
    if (field === "calc-defender-item") state.calc.defenderItem = target.value;
    if (field === "build-ability") state.build.ability = target.value;
    if (field === "weather") state.calc.weather = target.value;
    if (field === "reflect") state.calc.reflect = target.value;
    if (field === "season-filter") updateSeasonFilter(target.value);
    if (field === "move") {
      const moves = target.dataset.mode === "calc" ? state.calc.moves : state.build.moves;
      moves[Number(target.dataset.slot)] = target.value;
    }
    render();
  });

  function getModeSource(mode) {
    if (mode === "calc-attacker") {
      return { name: state.calc.attackerName, nature: state.calc.attackerNature, item: state.calc.attackerItem };
    }
    if (mode === "calc-defender") {
      return { name: state.calc.defenderName, nature: state.calc.defenderNature, item: state.calc.defenderItem };
    }
    return { name: state.build.name, nature: state.build.nature, item: state.build.item };
  }

  function getEvByMode(mode) {
    if (mode === "calc-attacker") return state.calc.attackerEv;
    if (mode === "calc-defender") return state.calc.defenderEv;
    return state.build.ev;
  }

  function setPoint(mode, stat, requested, options = {}) {
    const ev = getEvByMode(mode);
    const current = ev[stat] || 0;
    const without = totalPoints(ev) - current;
    const next = clamp(Math.round(requested), 0, Math.min(POINT_MAX, POINT_TOTAL - without));
    ev[stat] = next;
    if (options.renderNow === false) {
      syncPointInputs(mode, stat);
      return;
    }
    render();
  }

  function syncPointInputs(mode, stat) {
    const ev = getEvByMode(mode);
    const value = ev[stat] || 0;
    document.querySelectorAll(`[data-action="point-range"][data-mode="${mode}"][data-stat="${stat}"], [data-action="point-number"][data-mode="${mode}"][data-stat="${stat}"]`).forEach((input) => {
      input.value = value;
    });
    const used = totalPoints(ev);
    const width = Math.min(100, Math.round((used / POINT_TOTAL) * 100));
    document.querySelectorAll(`[data-point-summary="${mode}"]`).forEach((summary) => {
      const usedNode = summary.querySelector("[data-point-used]");
      const barNode = summary.querySelector("[data-point-bar]");
      if (usedNode) usedNode.textContent = used;
      if (barNode) barNode.style.width = `${width}%`;
    });
    document.querySelectorAll(`[data-point-remaining="${mode}"]`).forEach((node) => {
      node.textContent = `残り ${POINT_TOTAL - used} / ${POINT_TOTAL}`;
    });
  }

  function updatePokemon(mode, name) {
    if (!state.pokemonByName.has(name)) {
      showToast("該当するポケモンが見つかりません");
      render();
      return;
    }
    if (!isPokemonSelectable(name)) {
      showToast(`${state.seasonFilter}では対象外です`);
      render();
      return;
    }
    if (mode === "build") {
      state.build.name = name;
      state.build.moves = suggestMoves(name);
      state.build.ability = "";
    } else if (mode === "calc-attacker") {
      state.calc.attackerName = name;
      state.calc.moves = suggestMoves(name);
    } else {
      state.calc.defenderName = name;
    }
    render();
  }

  function syncBuildToCalc() {
    state.calc.attackerName = state.build.name;
    state.calc.attackerNature = state.build.nature;
    state.calc.attackerItem = state.build.item;
    state.calc.attackerEv = cloneEv(state.build.ev);
    state.calc.moves = state.build.moves.slice(0, 4);
    state.activeView = "calc";
    showToast("育成をダメージ計算へ送りました");
    render();
  }

  function applyCalcToBuild() {
    state.build.name = state.calc.attackerName;
    state.build.nature = state.calc.attackerNature;
    state.build.item = state.calc.attackerItem;
    state.build.ev = cloneEv(state.calc.attackerEv);
    state.build.moves = state.calc.moves.slice(0, 4);
    state.build.updatedAt = Date.now();
    state.activeView = "build";
    showToast("計算値を育成に反映しました");
    render();
  }

  function swapSides() {
    const oldAttacker = {
      name: state.calc.attackerName,
      nature: state.calc.attackerNature,
      item: state.calc.attackerItem,
      ev: cloneEv(state.calc.attackerEv),
    };
    state.calc.attackerName = state.calc.defenderName;
    state.calc.attackerNature = state.calc.defenderNature;
    state.calc.attackerItem = state.calc.defenderItem;
    state.calc.attackerEv = cloneEv(state.calc.defenderEv);
    state.calc.defenderName = oldAttacker.name;
    state.calc.defenderNature = oldAttacker.nature;
    state.calc.defenderItem = oldAttacker.item;
    state.calc.defenderEv = cloneEv(oldAttacker.ev);
    state.calc.moves = suggestMoves(state.calc.attackerName);
    showToast("攻守を入れ替えました");
    render();
  }

  function newBuild() {
    const name = firstSelectable(["ガブリアス", "リザードン", "フシギバナ"]) || firstSelectablePokemon().name;
    state.build = {
      name,
      nickname: "",
      nature: "まじめ",
      item: "",
      ability: "",
      ev: defaultEv(),
      moves: suggestMoves(name),
      updatedAt: Date.now(),
    };
    state.activeView = "build";
    render();
  }

  function saveCurrentBuild() {
    const id = `${state.build.name}-${Date.now()}`;
    const snapshot = {
      id,
      name: state.build.name,
      nickname: state.build.nickname,
      nature: state.build.nature,
      item: state.build.item,
      ability: state.build.ability,
      ev: cloneEv(state.build.ev),
      moves: state.build.moves.slice(0, 4),
      updatedAt: Date.now(),
    };
    state.saved = [snapshot, ...state.saved].slice(0, 24);
    persistSaved();
    showToast("育成を保存しました");
    render();
  }

  function loadBuild(id, toCalc) {
    const saved = state.saved.find((item) => item.id === id);
    if (!saved) return;
    if (toCalc) {
      state.calc.attackerName = saved.name;
      state.calc.attackerNature = saved.nature;
      state.calc.attackerItem = saved.item;
      state.calc.attackerEv = cloneEv(saved.ev);
      state.calc.moves = saved.moves.slice(0, 4);
      state.activeView = "calc";
    } else {
      state.build = {
        name: saved.name,
        nickname: saved.nickname,
        nature: saved.nature,
        item: saved.item,
        ability: saved.ability,
        ev: cloneEv(saved.ev),
        moves: saved.moves.slice(0, 4),
        updatedAt: Date.now(),
      };
      state.activeView = "build";
    }
    render();
  }

  function deleteBuild(id) {
    state.saved = state.saved.filter((item) => item.id !== id);
    persistSaved();
    render();
  }

  async function installApp() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === "accepted") showToast("ホーム画面に追加しました");
      deferredInstallPrompt = null;
      return;
    }
    showToast("ブラウザの共有からホーム画面に追加できます");
  }

  function updateSeasonFilter(value) {
    state.seasonFilter = value || SEASON_ALL;
    ensureSelectableState();
    showToast(`${state.seasonFilter === SEASON_ALL ? "全体" : state.seasonFilter}に切り替えました`);
  }

  function ensureSelectableState() {
    const fallback = firstSelectablePokemon();
    if (!fallback) return;
    if (!isPokemonSelectable(state.build.name)) {
      state.build.name = fallback.name;
      state.build.moves = suggestMoves(fallback.name);
      state.build.ability = "";
    }
    if (!isPokemonSelectable(state.calc.attackerName)) {
      state.calc.attackerName = fallback.name;
      state.calc.moves = suggestMoves(fallback.name);
    }
    if (!isPokemonSelectable(state.calc.defenderName)) {
      state.calc.defenderName = firstSelectable(["ブリジュラス", fallback.name]) || fallback.name;
    }
  }

  function suggestMoves(pokemonName) {
    const moves = getMoves(pokemonName);
    const rank = getRankingForPokemon(pokemonName);
    const rankedNames = getRankedMoveNames(rank);
    const candidates = [
      ...rankedNames.map((name) => findMoveInList(moves, name)).filter(Boolean),
      ...moves.filter((move) => move.candidate),
      ...moves.filter((move) => move.category !== "変化"),
      ...moves,
    ];
    return unique(candidates.map((move) => move.name)).slice(0, 4);
  }

  function calcAllMoves(config) {
    return [0, 1, 2, 3].map((slot) => {
      const move = findMoveInList(getMoves(config.attackerName), config.moves[slot]) || findAnyMove(config.moves[slot]);
      return calcMoveDamage(config, move);
    });
  }

  function calcMoveDamage(config, move) {
    if (!move) return { ok: false, move: null, reason: "未選択" };
    const attacker = getPokemon(config.attackerName);
    const defender = getPokemon(config.defenderName);
    const attackerStats = calcStats(attacker, config.attackerEv, config.attackerNature);
    const defenderStats = calcStats(defender, config.defenderEv, config.defenderNature);
    const power = resolvePower(move, attacker, defender, attackerStats, defenderStats);

    if (move.category === "変化" || !power) {
      return { ok: false, move, reason: "変化技 / 可変条件外" };
    }

    const physical = move.category === "物理";
    let attackStat = physical ? attackerStats.atk : attackerStats.spa;
    let defenseStat = physical ? defenderStats.def : defenderStats.spd;

    if (move.name === "ボディプレス") attackStat = attackerStats.def;
    if (move.name === "イカサマ") attackStat = defenderStats.atk;
    if (["サイコショック", "サイコブレイク", "しんぴのつるぎ"].includes(move.name)) defenseStat = defenderStats.def;

    const itemModifier = itemDamageModifier(config.attackerItem, move, physical);
    const weatherModifier = weatherDamageModifier(config.weather, move.type);
    const wallModifier = wallDamageModifier(config.reflect, move.category);
    const stab = [attacker.type1, attacker.type2].includes(move.type) ? 1.5 : 1;
    const type = effectiveness(move.type, defender);
    const hits = resolveHits(move.hits);
    const base = Math.floor(Math.floor((((Math.floor((2 * LEVEL) / 5) + 2) * power * attackStat) / defenseStat) / 50) + 2);

    const values = [];
    for (let random = 85; random <= 100; random += 1) {
      const damage = Math.floor(base * stab * type * itemModifier * weatherModifier * wallModifier * (random / 100)) * hits;
      values.push(Math.max(1, damage));
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const hp = defenderStats.hp;
    return {
      ok: true,
      move,
      min,
      max,
      minPct: (min / hp) * 100,
      maxPct: (max / hp) * 100,
      hits,
      power,
      type,
      note: koNote(min, max, hp, type, hits),
    };
  }

  function calcStats(pokemon, ev, natureName) {
    const nature = getNature(natureName);
    const stats = {};
    STAT_KEYS.forEach((stat) => {
      const base = pokemon.stats[stat.key];
      const effort = effortToLegacyEv(ev[stat.key] || 0);
      if (stat.key === "hp") {
        stats[stat.key] = Math.floor(((2 * base + IV + Math.floor(effort / 4)) * LEVEL) / 100) + LEVEL + 10;
      } else {
        const raw = Math.floor(((2 * base + IV + Math.floor(effort / 4)) * LEVEL) / 100) + 5;
        const natureMod = nature.up === stat.key ? 1.1 : nature.down === stat.key ? 0.9 : 1;
        stats[stat.key] = Math.floor(raw * natureMod);
      }
    });
    return stats;
  }

  function effortToLegacyEv(points) {
    return Math.round((clamp(points, 0, POINT_MAX) / POINT_MAX) * 252);
  }

  function resolvePower(move, attacker, defender, attackerStats, defenderStats) {
    if (move.power) return move.power;
    if (["くさむすび", "けたぐり"].includes(move.name)) return weightPower(defender.weight);
    if (["ヒートスタンプ", "ヘビーボンバー"].includes(move.name)) return heavyPower(attacker.weight, defender.weight);
    if (move.name === "ジャイロボール") return Math.min(150, Math.max(1, Math.floor((25 * defenderStats.spe) / Math.max(1, attackerStats.spe)) + 1));
    if (move.name === "エレキボール") return electroBallPower(attackerStats.spe, defenderStats.spe);
    return 0;
  }

  function weightPower(weight) {
    if (weight >= 200) return 120;
    if (weight >= 100) return 100;
    if (weight >= 50) return 80;
    if (weight >= 25) return 60;
    if (weight >= 10) return 40;
    return 20;
  }

  function heavyPower(attackerWeight, defenderWeight) {
    const ratio = attackerWeight / Math.max(1, defenderWeight);
    if (ratio >= 5) return 120;
    if (ratio >= 4) return 100;
    if (ratio >= 3) return 80;
    if (ratio >= 2) return 60;
    return 40;
  }

  function electroBallPower(attackerSpeed, defenderSpeed) {
    const ratio = attackerSpeed / Math.max(1, defenderSpeed);
    if (ratio >= 4) return 150;
    if (ratio >= 3) return 120;
    if (ratio >= 2) return 80;
    if (ratio >= 1) return 60;
    return 40;
  }

  function resolveHits(text) {
    if (!text || text === "1") return 1;
    const match = String(text).match(/\d+/);
    return match ? number(match[0], 1) : 1;
  }

  function effectiveness(moveType, defender) {
    const chart = TYPE_CHART[moveType] || {};
    return [defender.type1, defender.type2].filter(Boolean).reduce((value, type) => value * (chart[type] ?? 1), 1);
  }

  function itemDamageModifier(item, move, physical) {
    if (!item) return 1;
    if (item === "こだわりハチマキ" && physical) return 1.5;
    if (item === "こだわりメガネ" && !physical) return 1.5;
    if (item === "いのちのたま") return 1.3;
    if (item === "たつじんのおび") return 1.2;
    const typeBoost = {
      もくたん: "ほのお",
      しんぴのしずく: "みず",
      じしゃく: "でんき",
      きせきのタネ: "くさ",
      とけないこおり: "こおり",
      くろおび: "かくとう",
      どくバリ: "どく",
      やわらかいすな: "じめん",
      するどいくちばし: "ひこう",
      まがったスプーン: "エスパー",
      ぎんのこな: "むし",
      かたいいし: "いわ",
      のろいのおふだ: "ゴースト",
      りゅうのキバ: "ドラゴン",
      くろいメガネ: "あく",
      メタルコート: "はがね",
      ようせいのハネ: "フェアリー",
    };
    return typeBoost[item] === move.type ? 1.2 : 1;
  }

  function weatherDamageModifier(weather, type) {
    if (weather === "はれ" && type === "ほのお") return 1.5;
    if (weather === "はれ" && type === "みず") return 0.5;
    if (weather === "あめ" && type === "みず") return 1.5;
    if (weather === "あめ" && type === "ほのお") return 0.5;
    return 1;
  }

  function wallDamageModifier(wall, category) {
    if (wall === "リフレクター" && category === "物理") return 0.5;
    if (wall === "ひかりのかべ" && category === "特殊") return 0.5;
    return 1;
  }

  function koNote(min, max, hp, type, hits) {
    if (type === 0) return "無効";
    const minHits = Math.max(1, Math.ceil(hp / Math.max(1, max)));
    const maxHits = Math.max(1, Math.ceil(hp / Math.max(1, min)));
    const range = minHits === maxHits ? `${minHits}発` : `${minHits}-${maxHits}発`;
    const typeText = type > 1 ? "抜群" : type < 1 ? "半減" : "等倍";
    return `${range} / ${typeText}${hits > 1 ? ` / ${hits}hit` : ""}`;
  }

  function resultLabel(result) {
    if (!result || !result.ok) return "—";
    return `${result.minPct.toFixed(1)} ~ ${result.maxPct.toFixed(1)}%`;
  }

  function resultNote(result) {
    if (!result) return "";
    if (!result.ok) return result.reason || "";
    return `${result.note} / ${result.min}-${result.max}`;
  }

  function displayPower(move) {
    if (move.power) return move.power;
    if (["くさむすび", "けたぐり", "ヒートスタンプ", "ヘビーボンバー", "ジャイロボール", "エレキボール"].includes(move.name)) return "可変";
    return "—";
  }

  function getPokemon(name) {
    return state.pokemonByName.get(name) || state.pokemon[0];
  }

  function getMoves(name) {
    const collected = [];
    const addMove = (move) => {
      if (!move) return;
      if (!collected.some((item) => moveKey(item.name) === moveKey(move.name))) collected.push(move);
    };
    const addMoveList = (moves) => (moves || []).forEach(addMove);

    addMoveList(state.movesByPokemon.get(name));

    const baseName = state.baseByMega.get(name);
    if (baseName) addMoveList(state.movesByPokemon.get(baseName));

    const rank = getRankingForPokemon(name);
    const rankedNames = getRankedMoveNames(rank);
    rankedNames.forEach((moveName) => {
      addMove(findMoveInList(collected, moveName) || findAnyMove(moveName));
    });

    const rankOrder = new Map(rankedNames.map((moveName, index) => [moveKey(moveName), index]));
    return collected.sort((a, b) => {
      const rankA = rankOrder.has(moveKey(a.name)) ? rankOrder.get(moveKey(a.name)) : 9999;
      const rankB = rankOrder.has(moveKey(b.name)) ? rankOrder.get(moveKey(b.name)) : 9999;
      return rankA - rankB || Number(b.candidate) - Number(a.candidate) || Number(b.category !== "変化") - Number(a.category !== "変化") || a.name.localeCompare(b.name, "ja");
    });
  }

  function getRankingForPokemon(name) {
    return state.rankingByPokemon.get(name) || state.rankingByPokemon.get(state.baseByMega.get(name)) || null;
  }

  function findAnyMove(name) {
    if (!name) return null;
    return state.moveByName.get(name) || state.moveByKey.get(moveKey(name)) || null;
  }

  function findMoveInList(moves, name) {
    if (!name) return null;
    const key = moveKey(name);
    return (moves || []).find((move) => moveKey(move.name) === key) || null;
  }

  function getRankedMoveNames(rank) {
    return rank?.moves?.map((value) => stripUsageText(value)).filter(Boolean) || [];
  }

  function getAbilityOptions(pokemonName) {
    const pokemon = getPokemon(pokemonName);
    const baseAbilities = [pokemon.ability1, pokemon.ability2, pokemon.hiddenAbility].filter(Boolean);
    if (state.baseByMega.has(pokemonName)) return unique(baseAbilities);
    const rank = getRankingForPokemon(pokemonName);
    const rankingAbilities = rank?.abilities?.map((value) => stripUsageText(value)).filter(Boolean) || [];
    return unique([...rankingAbilities, ...baseAbilities]);
  }

  function stripUsageText(value) {
    return String(value || "")
      .replace(/\s*[（(][^）)]*[）)]\s*$/, "")
      .trim();
  }

  function moveKey(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .toLowerCase();
  }

  function getNature(name) {
    return NATURES.find((nature) => nature.name === name) || NATURES[0];
  }

  function natureLabel(nature) {
    if (!nature.up) return nature.name;
    return `${nature.name} (${statLabel(nature.up)}↑ ${statLabel(nature.down)}↓)`;
  }

  function statLabel(key) {
    return STAT_KEYS.find((stat) => stat.key === key)?.label || key;
  }

  function typePill(type) {
    if (!type) return "";
    return `<span class="pill type-${TYPE_CLASS[type] || "normal"}">${escapeHtml(type)}</span>`;
  }

  function renderTypePills(pokemon) {
    return [pokemon.type1, pokemon.type2].filter(Boolean).map(typePill).join("");
  }

  function megaButtonLabel(name) {
    const suffix = name.match(/[XY]$/);
    return suffix ? `メガ${suffix[0]}` : "メガ進化";
  }

  function option(label, selected, value = label) {
    return `<option value="${escapeAttr(value)}" ${value === selected || label === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function formatEv(ev) {
    return STAT_KEYS.map((stat) => ev[stat.key] || 0).join("-");
  }

  function totalPoints(ev) {
    return STAT_KEYS.reduce((sum, stat) => sum + number(ev[stat.key], 0), 0);
  }

  function cloneEv(ev) {
    return { hp: ev.hp || 0, atk: ev.atk || 0, def: ev.def || 0, spa: ev.spa || 0, spd: ev.spd || 0, spe: ev.spe || 0 };
  }

  function unique(values) {
    return [...new Set(values.filter(Boolean))];
  }

  function number(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function iconSync() {
    return `
      <svg width="21" height="21" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12a9 9 0 0 1-14.8 6.9" />
        <path d="M3 12A9 9 0 0 1 17.8 5.1" />
        <path d="M7 19H3v-4" />
        <path d="M17 5h4v4" />
      </svg>
    `;
  }
})();
