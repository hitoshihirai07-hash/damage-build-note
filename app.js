(function () {
  "use strict";

  const DATA_DIR = "data";
  const LEVEL = 50;
  const IV = 31;
  const POINT_TOTAL = 66;
  const POINT_MAX = 32;
  const STORAGE_KEY = "damage-build-note-v1";
  const MAX_SAVED_BUILDS = 60;
  const EXPORT_CODE_PREFIX = "DBN1:";
  const APP_NAME = "Damage Build Note";
  const SEASON_ALL = "all";
  const IS_BATTLE_REVIEW_PAGE = document.documentElement?.dataset?.page === "battle-review";

  const STAT_KEYS = [
    { key: "hp", label: "HP", csv: "HP" },
    { key: "atk", label: "攻撃", csv: "攻撃" },
    { key: "def", label: "防御", csv: "防御" },
    { key: "spa", label: "特攻", csv: "特攻" },
    { key: "spd", label: "特防", csv: "特防" },
    { key: "spe", label: "素早", csv: "素早" },
  ];

  const RANK_KEYS = STAT_KEYS.filter((stat) => stat.key !== "hp");
  const WEATHER_OPTIONS = ["なし", "はれ", "あめ", "すなあらし", "ゆき"];
  const FIELD_OPTIONS = ["なし", "エレキフィールド", "グラスフィールド", "サイコフィールド", "ミストフィールド"];
  const STATUS_OPTIONS = ["なし", "やけど", "どく", "まひ", "ねむり", "こおり"];
  const HP_CONDITION_OPTIONS = ["通常", "満タン", "1/2以下", "1/3以下"];
  const FAINTED_OPTIONS = [0, 1, 2, 3, 4, 5];
  const RIVALRY_OPTIONS = ["なし", "同性", "異性"];
  const METRONOME_COUNT_OPTIONS = [1, 2, 3, 4, 5, 6];
  const defaultRank = () => ({ atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });

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
    calcSection: "simple",
    pokemon: [],
    moves: [],
    tools: [],
    characteristics: [],
    mega: [],
    seasonKeys: [],
    seasonFilter: SEASON_ALL,
    ranking: null,
    pokemonByName: new Map(),
    moveByName: new Map(),
    moveByKey: new Map(),
    abilityByName: new Map(),
    megaByBase: new Map(),
    baseByMega: new Map(),
    movesByPokemon: new Map(),
    rankingByPokemon: new Map(),
    build: null,
    calc: null,
    dexName: "",
    saved: [],
    teamExportCode: "",
    teamImportCode: "",
    teamImportMode: "merge",
    teamDamageMode: "offense",
  };

  const defaultEv = () => ({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 });
  const physicalEv = () => ({ hp: 0, atk: 32, def: 0, spa: 0, spd: 2, spe: 32 });
  const bulkyEv = () => ({ hp: 32, atk: 0, def: 32, spa: 0, spd: 2, spe: 0 });

  const app = document.getElementById("app");
  const toast = document.getElementById("toast");
  let deferredInstallPrompt = null;

  if (!IS_BATTLE_REVIEW_PAGE) {
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
  } else {
    window.DamageBuildNoteCore = createBattleReviewCore();
  }

  async function init() {
    try {
      await loadCoreData();
      createInitialState();
      render();
    } catch (error) {
      app.innerHTML = `<main class="view"><section class="panel"><div class="panel-header"><h2>読み込みエラー</h2></div><div class="panel-body"><p class="empty-state">${escapeHtml(error.message)}</p></div></section></main>`;
    }
  }

  async function loadCoreData() {
    const [pokemonCsv, moveCsv, toolCsv, characteristicsCsv, megaCsv, rankingJson] = await Promise.all([
      fetchText(`${DATA_DIR}/pokemon.csv`),
      fetchText(`${DATA_DIR}/pokemon_moves.csv`),
      fetchText(`${DATA_DIR}/tool.csv`),
      fetchText(`${DATA_DIR}/characteristics.csv`),
      fetchText(`${DATA_DIR}/mega.csv`),
      Promise.all([
        fetchJson(`${DATA_DIR}/season_ranking.json`).catch(() => null),
        fetchJson(`${DATA_DIR}/season_ranking_single_s3.json`).catch(() => null),
        fetchJson(`${DATA_DIR}/season_ranking_single_s2.json`).catch(() => null),
      ]),
    ]);

    const pokemonRows = parseCsv(pokemonCsv);
    state.seasonKeys = extractSeasonKeys(pokemonRows);
    state.seasonFilter = state.seasonKeys[state.seasonKeys.length - 1] || SEASON_ALL;
    state.pokemon = pokemonRows.map(normalizePokemon).filter((row) => row.name);
    state.moves = parseCsv(moveCsv).map(normalizeMove).filter((row) => row.pokemon && row.name);
    state.tools = parseCsv(toolCsv).filter((row) => row["名前"]);
    state.characteristics = parseCsv(characteristicsCsv).filter((row) => row["特性"]);
    state.mega = parseCsv(megaCsv).map(normalizeMega).filter((row) => row.baseName && row.megaName);
    state.ranking = selectLatestRanking(rankingJson);

    state.pokemonByName.clear();
    state.moveByName.clear();
    state.moveByKey.clear();
    state.abilityByName.clear();
    state.characteristics.forEach((ability) => state.abilityByName.set(ability["特性"], ability));
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
  }

  function createBattleReviewCore() {
    const ready = loadCoreData();
    return {
      ready,
      getSavedBuilds: () => state.saved.map((build) => cloneReviewBuild(build)),
      getSeasonKeys: () => state.seasonKeys.slice(),
      getPokemonNames: (season = SEASON_ALL) => state.pokemon
        .filter((pokemon) => season === SEASON_ALL || pokemon.seasons[season] === true)
        .map((pokemon) => pokemon.name)
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "ja")),
      getMoveOptions: (name) => getMoves(name).map((move) => ({ name: move.name, type: move.type, category: move.category, power: move.power, accuracy: move.accuracy })),
      getRankingEstimate: (name) => rankingEstimateForReview(name),
      getRankingUpdatedAt: () => state.ranking?.updatedAt || "",
      calculateMove: (input) => calculateReviewMove(input),
    };
  }

  function cloneReviewBuild(build) {
    return {
      id: String(build.id || ""),
      name: String(build.name || ""),
      nickname: String(build.nickname || ""),
      nature: String(build.nature || "まじめ"),
      item: String(build.item || ""),
      ability: String(build.ability || defaultAbility(build.name)),
      ev: cloneEv(build.ev),
      moves: (build.moves || []).slice(0, 4),
      note: String(build.note || ""),
      updatedAt: number(build.updatedAt, Date.now()),
    };
  }

  function rankingEstimateForReview(name) {
    const rank = getRankingForPokemon(name);
    const parsedNature = parseRankNature(rank) || "まじめ";
    const parsedEv = parseRankSpread(rank) || defaultEv();
    const moveUsage = (rank?.moves || []).slice(0, 10);
    const itemUsage = (rank?.items || []).slice(0, 5);
    const abilityUsage = (rank?.abilities || []).slice(0, 5);
    return {
      found: Boolean(rank),
      rank: number(rank?.rank, 0) || null,
      updatedAt: rank?.updatedAt || state.ranking?.updatedAt || "",
      nature: parsedNature,
      ev: cloneEv(parsedEv),
      item: stripUsageText(itemUsage[0] || ""),
      ability: stripUsageText(abilityUsage[0] || "") || defaultAbility(name),
      moves: getRankedMoveNames(rank).slice(0, 4),
      moveUsage,
      itemUsage,
      abilityUsage,
      natureUsage: (rank?.natures || []).slice(0, 5),
      spreadUsage: (rank?.spreads || []).slice(0, 5),
    };
  }

  function calculateReviewMove(input = {}) {
    const attacker = input.attacker || {};
    const defender = input.defender || {};
    const moveName = String(input.move || "").trim();
    if (!state.pokemonByName.has(attacker.name) || !state.pokemonByName.has(defender.name)) {
      return { ok: false, reason: "攻撃側または防御側のポケモンを選んでください" };
    }
    if (!moveName) return { ok: false, reason: "技を選んでください" };
    const move = findMoveInList(getMoves(attacker.name), moveName) || findAnyMove(moveName);
    if (!move) return { ok: false, reason: "技データが見つかりません" };
    const conditions = input.conditions || {};
    const config = {
      attackerName: attacker.name,
      attackerNature: attacker.nature || "まじめ",
      attackerItem: attacker.item || "",
      attackerAbility: attacker.ability || defaultAbility(attacker.name),
      attackerEv: cloneEv(attacker.ev || defaultEv()),
      attackerRank: cloneRank(attacker.rank || defaultRank()),
      defenderName: defender.name,
      defenderNature: defender.nature || "まじめ",
      defenderItem: defender.item || "",
      defenderAbility: defender.ability || defaultAbility(defender.name),
      defenderEv: cloneEv(defender.ev || defaultEv()),
      defenderRank: cloneRank(defender.rank || defaultRank()),
      moves: [move.name],
      moveHits: [conditions.moveHits || "", "", "", ""],
      weather: conditions.weather || "なし",
      field: conditions.field || "なし",
      reflect: conditions.reflect || "なし",
      attackerStatus: conditions.attackerStatus || "なし",
      defenderStatus: conditions.defenderStatus || "なし",
      attackerHpCondition: conditions.attackerHpCondition || "通常",
      defenderHpCondition: conditions.defenderHpCondition || "通常",
      allyFainted: number(conditions.allyFainted, 0),
      criticalHit: Boolean(conditions.criticalHit),
      attackerMovedLast: Boolean(conditions.attackerMovedLast),
      targetSwitched: Boolean(conditions.targetSwitched),
      flashFireBoost: Boolean(conditions.flashFireBoost),
      chargedBoost: Boolean(conditions.chargedBoost),
      plusMinusActive: Boolean(conditions.plusMinusActive),
      unburdenActive: Boolean(conditions.unburdenActive),
      slowStartActive: Boolean(conditions.slowStartActive),
      eelBoostActive: Boolean(conditions.eelBoostActive),
      rivalry: conditions.rivalry || "なし",
      metronomeCount: number(conditions.metronomeCount, 1),
      defenderHazards: defaultHazards(),
    };
    return calcMoveDamage(config, move, 0);
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

  function selectLatestRanking(rankings) {
    const list = (Array.isArray(rankings) ? rankings : [rankings]).filter((rank) => rank && Array.isArray(rank.rows));
    if (!list.length) return null;
    return list.sort((a, b) => rankingDateValue(b.updatedAt) - rankingDateValue(a.updatedAt))[0];
  }

  function rankingDateValue(value) {
    const normalized = String(value || "").replace(/[./]/g, "-");
    const time = Date.parse(normalized);
    return Number.isFinite(time) ? time : 0;
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
    state.rankingByPokemon = new Map();
    const rows = state.ranking && Array.isArray(state.ranking.rows) ? state.ranking.rows : [];
    rows.forEach((row) => {
      if (row.name) state.rankingByPokemon.set(row.name, row);
      if (row.siteName) state.rankingByPokemon.set(row.siteName, row);
    });
  }

  function restoreSaved() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      state.saved = normalizeSavedList(parsed);
    } catch {
      state.saved = [];
    }
  }

  function persistSaved() {
    state.saved = normalizeSavedList(state.saved).slice(0, MAX_SAVED_BUILDS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.saved));
  }

  function createInitialState() {
    const fallbackPokemon = firstSelectablePokemon();
    if (!fallbackPokemon || !fallbackPokemon.name) {
      throw new Error("ポケモンデータを読み込めませんでした。データファイルを確認してください。");
    }
    const preferredAttacker = firstSelectable(["ガブリアス", "リザードン", "フシギバナ"]) || fallbackPokemon.name;
    const preferredDefender = firstSelectable(["ブリジュラス", "カメックス", "フシギバナ"]) || fallbackPokemon.name || preferredAttacker;
    const attackerMoves = suggestMoves(preferredAttacker);

    state.build = {
      name: preferredAttacker,
      nickname: "",
      nature: "ようき",
      item: "",
      ability: defaultAbility(preferredAttacker),
      ev: physicalEv(),
      moves: attackerMoves,
      moveHits: ["", "", "", ""],
      updatedAt: Date.now(),
    };

    state.calc = {
      attackerName: preferredAttacker,
      attackerNature: "ようき",
      attackerItem: "",
      attackerAbility: defaultAbility(preferredAttacker),
      attackerEv: cloneEv(state.build.ev),
      attackerRank: defaultRank(),
      defenderName: preferredDefender,
      defenderNature: "ずぶとい",
      defenderItem: "",
      defenderAbility: defaultAbility(preferredDefender),
      defenderEv: bulkyEv(),
      defenderRank: defaultRank(),
      moves: attackerMoves.slice(),
      moveHits: ["", "", "", ""],
      weather: "なし",
      field: "なし",
      reflect: "なし",
      attackerStatus: "なし",
      defenderStatus: "なし",
      attackerHpCondition: "通常",
      defenderHpCondition: "通常",
      allyFainted: 0,
      criticalHit: false,
      attackerMovedLast: false,
      targetSwitched: false,
      flashFireBoost: false,
      chargedBoost: false,
      plusMinusActive: false,
      unburdenActive: false,
      slowStartActive: false,
      eelBoostActive: false,
      rivalry: "なし",
      metronomeCount: 1,
      comboFirst: 0,
      comboSecond: 1,
      defenderHazards: defaultHazards(),
    };
    state.dexName = preferredAttacker;
    applyPokemonPreset("build", state.build.name, { keepMoves: false });
    applyPokemonPreset("calc-attacker", state.calc.attackerName, { keepMoves: false });
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
        ${renderTab("dex", "図鑑")}
        ${renderTab("team", "チーム")}
        ${renderBattleReviewTab()}
      </nav>
      ${renderSeasonFilter()}
      ${renderActiveView()}
      ${renderPokemonDatalist()}
    `;
  }

  function renderTab(key, label) {
    return `<button class="tab-button" type="button" role="tab" data-tab="${key}" aria-selected="${state.activeView === key}">${label}</button>`;
  }

  function renderBattleReviewTab() {
    return `<button class="tab-button battle-review-tab" type="button" data-action="open-battle-review" aria-label="対戦記録を開く">対戦記録</button>`;
  }

  function renderActiveView() {
    if (state.activeView === "calc") return renderCalcView();
    if (state.activeView === "dex") return renderDexView();
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
      attackerAbility: state.build.ability,
      attackerRank: defaultRank(),
      defenderName: state.calc.defenderName,
      defenderNature: state.calc.defenderNature,
      defenderEv: state.calc.defenderEv,
      defenderItem: state.calc.defenderItem,
      defenderAbility: state.calc.defenderAbility,
      defenderRank: state.calc.defenderRank,
      moves: state.build.moves,
      moveHits: state.build.moveHits || ["", "", "", ""],
      weather: state.calc.weather,
      field: state.calc.field,
      reflect: state.calc.reflect,
      attackerStatus: state.calc.attackerStatus,
      defenderStatus: state.calc.defenderStatus,
      attackerHpCondition: state.calc.attackerHpCondition,
      defenderHpCondition: state.calc.defenderHpCondition,
      allyFainted: state.calc.allyFainted,
      criticalHit: state.calc.criticalHit,
      attackerMovedLast: state.calc.attackerMovedLast,
      targetSwitched: state.calc.targetSwitched,
      flashFireBoost: state.calc.flashFireBoost,
      chargedBoost: state.calc.chargedBoost,
      plusMinusActive: state.calc.plusMinusActive,
      unburdenActive: state.calc.unburdenActive,
      slowStartActive: state.calc.slowStartActive,
      rivalry: state.calc.rivalry,
      metronomeCount: state.calc.metronomeCount,
      defenderHazards: cloneHazards(state.calc.defenderHazards),
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
      <main class="view calc-view">
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
        ${renderCalcResultDock(results)}
        ${renderCalcSubTabs()}
        ${renderCalcSection(results)}
        <div class="wide-actions">
          <button class="primary-button" type="button" data-action="apply-calc">攻撃側を育成へ反映</button>
          <button class="primary-button secondary" type="button" data-action="save">保存</button>
        </div>
      </main>
    `;
  }

  function renderCalcResultDock(results) {
    return `
      <section class="panel calc-result-dock">
        <div class="panel-header compact-header">
          <h2>計算結果</h2>
          <span class="panel-meta">上に固定 / タップで技へ</span>
        </div>
        <div class="panel-body compact-result-body">
          <div class="result-strip">
            ${[0, 1, 2, 3].map((slot) => renderCalcResultChip(slot, results[slot])).join("")}
          </div>
          ${renderComboSummary(results)}
        </div>
      </section>
    `;
  }

  function renderCalcResultChip(slot, result) {
    const move = result?.move;
    const name = move?.name || "未選択";
    return `
      <button class="result-chip" type="button" data-action="calc-section" data-section="moves">
        <span class="result-chip-title">${slot + 1}. ${escapeHtml(name)}</span>
        <strong class="${result && result.ok ? "" : "damage-empty"}">${resultLabel(result)}</strong>
        <small>${escapeHtml(resultNote(result) || "技を選択")}</small>
      </button>
    `;
  }

  function renderComboSummary(results) {
    const combo = calcComboDamage(results);
    return `
      <div class="combo-summary compact-combo">
        <div>
          <strong>2技合わせ</strong>
          <span>${escapeHtml(combo.label)}</span>
        </div>
        <small>${escapeHtml(combo.note)}</small>
      </div>
    `;
  }

  function renderCalcSubTabs() {
    const tabs = [
      ["simple", "簡易判定"],
      ["moves", "技・結果"],
      ["attacker", "攻撃側"],
      ["defender", "防御側"],
      ["condition", "条件"],
    ];
    return `
      <nav class="calc-subtabs" aria-label="ダメージ計算の切り替え">
        ${tabs.map(([key, label]) => renderCalcSubTab(key, label)).join("")}
      </nav>
    `;
  }

  function renderCalcSubTab(key, label) {
    const active = (state.calcSection || "moves") === key;
    return `<button class="calc-subtab-button" type="button" data-action="calc-section" data-section="${key}" aria-selected="${active}">${label}</button>`;
  }

  function renderCalcSection(results) {
    const section = state.calcSection || "moves";
    if (section === "attacker") {
      return `
        <div class="view calc-section-panel">
          ${renderBasicPanel("calc-attacker")}
          <section class="panel compact">
            <div class="panel-header"><h3>攻撃側ステータス</h3><span class="panel-meta" data-point-remaining="calc-attacker">残り ${POINT_TOTAL - totalPoints(state.calc.attackerEv)} / ${POINT_TOTAL}</span></div>
            <div class="panel-body">
              ${renderPointSummary("calc-attacker", state.calc.attackerEv)}
              ${renderStatRows("calc-attacker", state.calc.attackerEv, calcStats(getPokemon(state.calc.attackerName), state.calc.attackerEv, state.calc.attackerNature), state.calc.attackerNature)}
            </div>
          </section>
          ${renderRankPanel("calc-attacker", "攻撃側ランク")}
        </div>
      `;
    }
    if (section === "defender") {
      return `
        <div class="view calc-section-panel">
          ${renderBasicPanel("calc-defender")}
          <section class="panel compact">
            <div class="panel-header"><h3>防御側ステータス</h3><span class="panel-meta" data-point-remaining="calc-defender">残り ${POINT_TOTAL - totalPoints(state.calc.defenderEv)} / ${POINT_TOTAL}</span></div>
            <div class="panel-body">
              ${renderPointSummary("calc-defender", state.calc.defenderEv)}
              ${renderStatRows("calc-defender", state.calc.defenderEv, calcStats(getPokemon(state.calc.defenderName), state.calc.defenderEv, state.calc.defenderNature), state.calc.defenderNature)}
            </div>
          </section>
          ${renderRankPanel("calc-defender", "防御側ランク")}
          ${renderHazardPanel()}
        </div>
      `;
    }
    if (section === "condition") return renderConditionPanel();
    if (section === "simple") return renderSimpleCalcPanel();
    return renderMovesPanel("calc", state.calc.attackerName, state.calc.moves, results);
  }

  function renderSimpleCalcPanel() {
    const available = getMoves(state.calc.attackerName);
    const selectedMove = findMoveInList(available, state.calc.moves?.[0]) || findAnyMove(state.calc.moves?.[0]) || available.find((move) => move.category !== "変化") || available[0] || null;
    const selectedKey = moveKey(selectedMove?.name || state.calc.moves?.[0] || "");
    const report = selectedMove ? calcSimpleRangeReport(selectedMove) : null;

    return `
      <div class="view simple-calc-view">
        <section class="panel simple-calc-panel">
          <div class="panel-header">
            <h2>簡易ダメージ判定</h2>
            <span class="panel-meta">ポケモン・技・相手だけ</span>
          </div>
          <div class="panel-body">
            <div class="simple-calc-fields">
              <div class="field">
                <label for="simple-attacker-name">攻撃側</label>
                <input id="simple-attacker-name" list="pokemon-options" data-field="calc-attacker-name" value="${escapeAttr(state.calc.attackerName)}" autocomplete="off" />
                ${renderMegaActions("calc-attacker", state.calc.attackerName)}
              </div>
              <div class="field simple-move-field">
                <label for="simple-move-search">技</label>
                <input id="simple-move-search" class="move-search" list="simple-move-options" data-field="move-search" data-mode="calc" data-slot="0" value="${escapeAttr(selectedMove?.name || state.calc.moves?.[0] || "")}" placeholder="技名を検索" autocomplete="off" />
                <datalist id="simple-move-options">
                  ${available.map((candidate) => `<option value="${escapeAttr(candidate.name)}">${escapeHtml(candidate.name)}${candidate.candidate ? " *" : ""}</option>`).join("")}
                </datalist>
                <div class="move-select-wrap">
                  <span class="move-select-caption">候補</span>
                  <select class="move-select" data-field="move" data-mode="calc" data-slot="0">
                    <option value="">技を選択</option>
                    ${available.map((candidate) => `<option value="${escapeAttr(candidate.name)}" ${moveKey(candidate.name) === selectedKey ? "selected" : ""}>${escapeHtml(candidate.name)}${candidate.candidate ? " *" : ""}</option>`).join("")}
                  </select>
                </div>
                ${selectedMove ? renderMoveMeta(selectedMove) : ""}
              </div>
              <div class="field">
                <label for="simple-defender-name">防御側</label>
                <input id="simple-defender-name" list="pokemon-options" data-field="calc-defender-name" value="${escapeAttr(state.calc.defenderName)}" autocomplete="off" />
                ${renderMegaActions("calc-defender", state.calc.defenderName)}
              </div>
            </div>
            <p class="simple-calc-help">入力はこの3つだけ。努力値・性格・持ち物は、現実的な最小/最大の候補を自動で並べます。</p>
          </div>
        </section>
        ${renderSimpleRangeResults(report)}
      </div>
    `;
  }

  function renderSimpleRangeResults(report) {
    if (!report) {
      return `
        <section class="panel">
          <div class="panel-body"><p class="empty-state">攻撃側・技・防御側を選ぶと、簡易判定を表示します。</p></div>
        </section>
      `;
    }

    return `
      <section class="panel simple-result-panel">
        <div class="panel-header">
          <h2>判定結果</h2>
          <span class="panel-meta">Lv.50 / IV31 / ランクなし</span>
        </div>
        <div class="panel-body">
          <div class="simple-result-summary">
            <strong>${escapeHtml(report.move.name)}</strong>
            <span>${typePill(report.move.type)} ${escapeHtml(report.move.category)} / ${escapeHtml(report.defenderName)}想定</span>
          </div>
          <div class="simple-result-groups">
            ${report.groups.map(renderSimpleResultGroup).join("")}
          </div>
          <p class="simple-result-note">相手の型が不明な時に、倒せる可能性と最低ラインをざっくり見るための表示です。特性は候補の中でダメージが大きくなる組み合わせを自動採用します。</p>
        </div>
      </section>
    `;
  }

  function renderSimpleResultGroup(group) {
    return `
      <article class="simple-result-group">
        <div class="simple-result-group-head">
          <h3>${escapeHtml(group.label)}</h3>
          <small>${escapeHtml(group.note)}</small>
        </div>
        <div class="simple-result-list">
          ${group.rows.map(renderSimpleResultRow).join("")}
        </div>
      </article>
    `;
  }

  function renderSimpleResultRow(row) {
    const result = row.result;
    return `
      <div class="simple-result-row ${result?.ok ? "" : "is-empty"}">
        <div class="simple-result-label">
          <strong>${escapeHtml(row.label)}</strong>
          <span>${escapeHtml(row.hint)}</span>
        </div>
        <div class="simple-result-damage">
          <strong>${resultLabel(result)}</strong>
          <small>${escapeHtml(simpleResultNote(row))}</small>
        </div>
      </div>
    `;
  }

  function calcSimpleRangeReport(move) {
    const scenarios = simpleRangeScenarios(move);
    const groups = [
      { label: "通常火力", item: "", note: "持ち物なし" },
      { label: "火力強化あり", item: simpleBoostItemForMove(move), note: "いのちのたま想定" },
    ];

    return {
      move,
      attackerName: state.calc.attackerName,
      defenderName: state.calc.defenderName,
      groups: groups.map((group) => ({
        ...group,
        rows: scenarios.map((scenario) => ({
          ...scenario,
          result: calcSimpleScenario(move, scenario, group.item),
        })),
      })),
    };
  }

  function simpleRangeScenarios(move) {
    const attackStat = simpleAttackStatKey(move);
    const defenseStat = simpleDefenseStatKey(move);
    return [
      { key: "max-max", label: "自分最大 × 相手最大", hint: "耐久振りにも届くか", attackerEv: simpleAttackerEv(attackStat, true), attackerNature: positiveNatureForStat(attackStat), defenderEv: simpleDefenderEv(defenseStat, true), defenderNature: positiveNatureForStat(defenseStat) },
      { key: "max-min", label: "自分最大 × 相手最小", hint: "最高ダメージ", attackerEv: simpleAttackerEv(attackStat, true), attackerNature: positiveNatureForStat(attackStat), defenderEv: simpleDefenderEv(defenseStat, false), defenderNature: "まじめ" },
      { key: "min-min", label: "自分最小 × 相手最小", hint: "無振り同士の目安", attackerEv: simpleAttackerEv(attackStat, false), attackerNature: "まじめ", defenderEv: simpleDefenderEv(defenseStat, false), defenderNature: "まじめ" },
      { key: "min-max", label: "自分最小 × 相手最大", hint: "最低ライン", attackerEv: simpleAttackerEv(attackStat, false), attackerNature: "まじめ", defenderEv: simpleDefenderEv(defenseStat, true), defenderNature: positiveNatureForStat(defenseStat) },
    ];
  }

  function calcSimpleScenario(move, scenario, item) {
    const baseConfig = {
      attackerName: state.calc.attackerName,
      attackerNature: scenario.attackerNature,
      attackerItem: item || "",
      attackerAbility: "",
      attackerEv: cloneEv(scenario.attackerEv),
      attackerRank: defaultRank(),
      defenderName: state.calc.defenderName,
      defenderNature: scenario.defenderNature,
      defenderItem: "",
      defenderAbility: "",
      defenderEv: cloneEv(scenario.defenderEv),
      defenderRank: defaultRank(),
      moves: [move.name],
      moveHits: ["", "", "", ""],
      weather: "なし",
      field: "なし",
      reflect: "なし",
      attackerStatus: "なし",
      defenderStatus: "なし",
      attackerHpCondition: "通常",
      defenderHpCondition: "通常",
      allyFainted: 0,
      criticalHit: false,
      attackerMovedLast: false,
      targetSwitched: false,
      flashFireBoost: false,
      chargedBoost: false,
      plusMinusActive: false,
      unburdenActive: false,
      slowStartActive: false,
      eelBoostActive: false,
      rivalry: "なし",
      metronomeCount: 1,
      defenderHazards: defaultHazards(),
    };
    return calcHighestDamageAbilityResult(baseConfig, move);
  }

  function calcHighestDamageAbilityResult(config, move) {
    const attackerAbilities = unique([...(getAbilityOptions(config.attackerName) || []), defaultAbility(config.attackerName), ""]).filter((value, index, list) => list.indexOf(value) === index);
    const defenderAbilities = unique([...(getAbilityOptions(config.defenderName) || []), defaultAbility(config.defenderName), ""]).filter((value, index, list) => list.indexOf(value) === index);
    let best = null;

    attackerAbilities.forEach((attackerAbility) => {
      defenderAbilities.forEach((defenderAbility) => {
        const result = calcMoveDamage({ ...config, attackerAbility, defenderAbility }, move, 0);
        const score = result?.ok ? result.max : -1;
        if (!best || score > best.score) {
          best = { score, result: { ...result, simpleAttackerAbility: attackerAbility, simpleDefenderAbility: defenderAbility } };
        }
      });
    });

    return best?.result || calcMoveDamage(config, move, 0);
  }

  function simpleAttackStatKey(move) {
    if (move.name === "ボディプレス") return "def";
    return move.category === "特殊" ? "spa" : "atk";
  }

  function simpleDefenseStatKey(move) {
    if (["サイコショック", "サイコブレイク", "しんぴのつるぎ"].includes(move.name)) return "def";
    return move.category === "特殊" ? "spd" : "def";
  }

  function simpleAttackerEv(stat, isMax) {
    const ev = defaultEv();
    if (isMax && ev[stat] !== undefined) ev[stat] = POINT_MAX;
    return ev;
  }

  function simpleDefenderEv(stat, isMax) {
    const ev = defaultEv();
    if (isMax) {
      ev.hp = POINT_MAX;
      if (ev[stat] !== undefined) ev[stat] = POINT_MAX;
    }
    return ev;
  }

  function positiveNatureForStat(stat) {
    return { atk: "いじっぱり", def: "ずぶとい", spa: "ひかえめ", spd: "おだやか", spe: "ようき" }[stat] || "まじめ";
  }

  function simpleBoostItemForMove(move) {
    return move?.category === "変化" ? "" : "いのちのたま";
  }

  function simpleResultNote(row) {
    const result = row.result;
    if (!result) return "";
    if (!result.ok) return result.reason || "計算対象外";
    const abilityNote = [result.simpleAttackerAbility, result.simpleDefenderAbility ? `相手:${result.simpleDefenderAbility}` : ""].filter(Boolean).join(" / ");
    const damageText = result.entryDamage > 0 ? `技${result.moveMin}-${result.moveMax}+設置${result.entryDamage}` : `${result.min}-${result.max}`;
    return [result.note, damageText, abilityNote ? `特性 ${abilityNote}` : ""].filter(Boolean).join(" / ");
  }

  function renderConditionPanel() {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>条件</h2>
          <span class="panel-meta">天候・壁・状態など</span>
        </div>
        <div class="panel-body field-grid">
          <div class="field">
            <label for="weather">天候</label>
            <select id="weather" data-field="weather" class="plain-select">
              ${WEATHER_OPTIONS.map((value) => option(value, state.calc.weather)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="field-condition">フィールド</label>
            <select id="field-condition" data-field="field-condition" class="plain-select">
              ${FIELD_OPTIONS.map((value) => option(value, state.calc.field)).join("")}
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
          <div class="field">
            <label for="attacker-status">攻撃側状態</label>
            <select id="attacker-status" data-field="attacker-status" class="plain-select">
              ${STATUS_OPTIONS.map((value) => option(value, state.calc.attackerStatus)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="defender-status">防御側状態</label>
            <select id="defender-status" data-field="defender-status" class="plain-select">
              ${STATUS_OPTIONS.map((value) => option(value, state.calc.defenderStatus)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="attacker-hp-condition">攻撃側HP条件</label>
            <select id="attacker-hp-condition" data-field="attacker-hp-condition" class="plain-select">
              ${HP_CONDITION_OPTIONS.map((value) => option(value, state.calc.attackerHpCondition)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="defender-hp-condition">防御側HP条件</label>
            <select id="defender-hp-condition" data-field="defender-hp-condition" class="plain-select">
              ${HP_CONDITION_OPTIONS.map((value) => option(value, state.calc.defenderHpCondition)).join("")}
            </select>
          </div>
          <div class="field">
            <label for="ally-fainted">ひんしの味方</label>
            <select id="ally-fainted" data-field="ally-fainted" class="plain-select">
              ${FAINTED_OPTIONS.map((value) => option(`${value}体`, String(state.calc.allyFainted), String(value))).join("")}
            </select>
          </div>
          <div class="field">
            <label for="rivalry-condition">とうそうしん</label>
            <select id="rivalry-condition" data-field="rivalry-condition" class="plain-select">
              ${RIVALRY_OPTIONS.map((value) => option(value, state.calc.rivalry || "なし")).join("")}
            </select>
          </div>
          <div class="field">
            <label for="metronome-count">メトロノーム</label>
            <select id="metronome-count" data-field="metronome-count" class="plain-select">
              ${METRONOME_COUNT_OPTIONS.map((value) => option(value === 1 ? "1回目" : `${value}回目`, String(state.calc.metronomeCount || 1), String(value))).join("")}
            </select>
          </div>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="critical-hit" ${state.calc.criticalHit ? "checked" : ""} />
            <span><strong>急所</strong><small>急所補正とスナイパーを反映</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="attacker-moved-last" ${state.calc.attackerMovedLast ? "checked" : ""} />
            <span><strong>後攻扱い</strong><small>アナライズを反映</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="target-switched" ${state.calc.targetSwitched ? "checked" : ""} />
            <span><strong>相手交代</strong><small>はりこみを反映</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="flash-fire-boost" ${state.calc.flashFireBoost ? "checked" : ""} />
            <span><strong>もらいび発動済み</strong><small>ほのお技1.5倍</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="charged-boost" ${state.calc.chargedBoost ? "checked" : ""} />
            <span><strong>じゅうでん状態</strong><small>でんきにかえる等の次のでんき技2倍</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="plus-minus-active" ${state.calc.plusMinusActive ? "checked" : ""} />
            <span><strong>プラス/マイナス発動</strong><small>特攻1.5倍</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="unburden-active" ${state.calc.unburdenActive ? "checked" : ""} />
            <span><strong>かるわざ発動</strong><small>素早さ2倍</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="slow-start-active" ${state.calc.slowStartActive ? "checked" : ""} />
            <span><strong>スロースタート中</strong><small>攻撃・素早さ1/2</small></span>
          </label>
          <label class="check-card condition-check">
            <input type="checkbox" data-field="eel-boost-active" ${state.calc.eelBoostActive ? "checked" : ""} />
            <span><strong>うなぎのぼり発動済み</strong><small>最高能力のランク+1</small></span>
          </label>
        </div>
      </section>
    `;
  }

  function renderDexView() {
    const selected = state.pokemonByName.has(state.dexName) && isPokemonSelectable(state.dexName)
      ? state.dexName
      : firstSelectablePokemon()?.name;
    state.dexName = selected || "";
    return `
      <main class="view dex-view">
        <section class="panel">
          <div class="panel-header">
            <h2>ポケモン図鑑</h2>
            <span class="panel-meta">種族値・特性・技</span>
          </div>
          <div class="panel-body field-grid">
            <div class="field">
              <label for="dex-name">ポケモン検索</label>
              <input id="dex-name" list="pokemon-options" data-field="dex-name" value="${escapeAttr(state.dexName)}" autocomplete="off" />
            </div>
            <div class="dex-guide">メガ進化があるポケモンは通常形態の下にメガ後の種族値を表示します。技一覧は共通で1回だけ表示します。</div>
          </div>
        </section>
        ${renderDexFamilyCard(selected)}
      </main>
    `;
  }

  function renderDexFamilyCard(selectedName) {
    const baseName = state.baseByMega.get(selectedName) || selectedName;
    const basePokemon = getPokemon(baseName);
    const megaNames = (state.megaByBase.get(baseName) || [])
      .map((entry) => entry.megaName)
      .filter((name) => state.pokemonByName.has(name) && isPokemonSelectable(name));
    const forms = unique([baseName, ...megaNames]).filter((name) => state.pokemonByName.has(name) && isPokemonSelectable(name));
    const rank = getRankingForPokemon(selectedName) || getRankingForPokemon(baseName);
    const rankedNames = new Set(getRankedMoveNames(rank).map(moveKey));
    const moves = getMoves(selectedName || baseName);
    const relation = megaNames.length ? `メガ進化：${megaNames.join(" / ")}` : "メガ進化なし";
    return `
      <article class="panel dex-card">
        <div class="panel-header">
          <h2>${escapeHtml(baseName)}</h2>
          <span class="panel-meta">No.${escapeHtml(basePokemon.no || "-")} / ${escapeHtml(relation)}</span>
        </div>
        <div class="panel-body dex-family-body">
          <section class="dex-section dex-stat-section">
            <div class="dex-section-title">
              <h3>種族値・能力値目安</h3>
              <p>Lv.50 / 個体値31 / 努力値32ポイント＝252相当で表示しています。</p>
            </div>
            <div class="dex-form-list">
              ${forms.map((name, index) => renderDexFormStats(name, index === 0 ? "通常形態" : "メガ後")).join("")}
            </div>
          </section>
          <section class="dex-section">
            <h3>特性</h3>
            <div class="dex-ability-form-list">
              ${forms.map((name) => renderDexAbilityGroup(name)).join("")}
            </div>
          </section>
          <section class="dex-section">
            <div class="dex-section-title">
              <h3>覚える技</h3>
              <p>通常形態とメガ後で覚える技は同じ扱いのため、共通一覧として表示します。</p>
            </div>
            <div class="dex-move-list">
              ${moves.length ? moves.map((move) => renderDexMoveTag(move, rankedNames)).join("") : `<p class="empty-state">技データなし</p>`}
            </div>
          </section>
        </div>
      </article>
    `;
  }

  function renderDexFormStats(name, formLabel) {
    const pokemon = getPokemon(name);
    const stats = pokemon.stats || {};
    return `
      <article class="dex-form-card">
        <div class="dex-form-header">
          <div>
            <h4>${escapeHtml(formLabel)}：${escapeHtml(name)}</h4>
            <div class="dex-types">${renderTypePills(pokemon)}</div>
          </div>
          <div class="dex-actions">
            <button class="ghost-button small" type="button" data-action="apply-dex" data-target="build" data-name="${escapeAttr(name)}">育成へ</button>
            <button class="ghost-button small" type="button" data-action="apply-dex" data-target="attacker" data-name="${escapeAttr(name)}">攻撃側へ</button>
            <button class="ghost-button small" type="button" data-action="apply-dex" data-target="defender" data-name="${escapeAttr(name)}">防御側へ</button>
          </div>
        </div>
        <div class="dex-stats">
          ${STAT_KEYS.map((stat) => renderDexStatCell(pokemon, stat, stats[stat.key])).join("")}
        </div>
      </article>
    `;
  }

  function renderDexStatCell(pokemon, stat, baseValue) {
    const value = Number.isFinite(number(baseValue, NaN)) ? number(baseValue, 0) : null;
    const guide = value == null ? [] : getStatBenchmarks(pokemon, stat);
    return `
      <div>
        <span>${stat.label}</span>
        <strong>${value == null ? "-" : value}</strong>
        ${guide.length ? `<small>${guide.map((item) => `${escapeHtml(item.label)} ${item.value}`).join(" / ")}</small>` : ""}
      </div>
    `;
  }

  function getStatBenchmarks(pokemon, stat) {
    const base = number(pokemon.stats?.[stat.key], NaN);
    if (!Number.isFinite(base)) return [];
    if (stat.key === "hp") {
      return [
        { label: "無振り", value: calcLv50Stat(base, stat.key, 0, 1) },
        { label: "H32", value: calcLv50Stat(base, stat.key, POINT_MAX, 1) },
      ];
    }
    if (stat.key === "spe") {
      return [
        { label: "最速", value: calcLv50Stat(base, stat.key, POINT_MAX, 1.1) },
        { label: "準速", value: calcLv50Stat(base, stat.key, POINT_MAX, 1) },
        { label: "無振り", value: calcLv50Stat(base, stat.key, 0, 1) },
        { label: "下降0", value: calcLv50Stat(base, stat.key, 0, 0.9) },
      ];
    }
    return [
      { label: `${statShortLabel(stat.key)}32↑`, value: calcLv50Stat(base, stat.key, POINT_MAX, 1.1) },
      { label: `${statShortLabel(stat.key)}32`, value: calcLv50Stat(base, stat.key, POINT_MAX, 1) },
      { label: "無振り", value: calcLv50Stat(base, stat.key, 0, 1) },
      { label: "下降0", value: calcLv50Stat(base, stat.key, 0, 0.9) },
    ];
  }

  function statShortLabel(key) {
    return ({ atk: "A", def: "B", spa: "C", spd: "D", spe: "S" })[key] || "";
  }

  function calcLv50Stat(base, key, points, natureMod) {
    const effort = effortToLegacyEv(points);
    if (key === "hp") return Math.floor(((2 * base + IV + Math.floor(effort / 4)) * LEVEL) / 100) + LEVEL + 10;
    const raw = Math.floor(((2 * base + IV + Math.floor(effort / 4)) * LEVEL) / 100) + 5;
    return Math.floor(raw * natureMod);
  }

  function renderDexAbilityGroup(name) {
    const abilities = getAbilityOptions(name);
    return `
      <div class="dex-ability-group">
        <h4>${escapeHtml(name)}</h4>
        <div class="ability-list">
          ${abilities.length ? abilities.map((ability) => renderAbilityDexItem(ability)).join("") : `<p class="empty-state">特性データなし</p>`}
        </div>
      </div>
    `;
  }

  function renderAbilityDexItem(abilityName) {
    const detail = state.abilityByName.get(abilityName)?.["効果"] || "";
    return `<details class="ability-item"><summary>${escapeHtml(abilityName)}</summary>${detail ? `<p>${escapeHtml(detail)}</p>` : `<p>効果データなし</p>`}</details>`;
  }

  function renderDexMoveTag(move, rankedNames) {
    const ranked = rankedNames.has(moveKey(move.name));
    return `
      <div class="dex-move ${move.candidate || ranked ? "recommended" : ""}">
        <strong>${escapeHtml(move.name)}${ranked ? " ★" : move.candidate ? " *" : ""}</strong>
        <span>${typePill(move.type)} ${escapeHtml(move.category)} / 威力 ${displayPower(move)}${move.accuracy ? ` / 命中 ${escapeHtml(move.accuracy)}` : ""}</span>
      </div>
    `;
  }

  function renderTeamView() {
    return `
      <main class="view team-view">
        ${renderTeamSavePanel()}
        ${renderBattleReviewPanel()}
        ${renderTeamTransferPanel()}
        ${renderTeamDamagePanel()}
      </main>
    `;
  }

  function renderBattleReviewPanel() {
    return `
      <section class="panel battle-review-link-panel">
        <div class="panel-header">
          <h2>対戦記録</h2>
          <span class="panel-meta">3vs3シングル</span>
        </div>
        <div class="panel-body">
          <p class="empty-state">自分の選出3体、相手の手持ち6体・初手・選出、勝敗を簡単に残します。動画・画像・ターンごとの行動は扱いません。</p>
          <button class="primary-button secondary" type="button" data-action="open-battle-review">対戦記録を開く</button>
        </div>
      </section>
    `;
  }

  function renderTeamSavePanel() {
    const cards = state.saved.length
      ? state.saved.map((build, index) => renderTeamCard(build, index)).join("")
      : `<p class="empty-state">保存した育成はまだありません。</p>`;

    return `
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
    `;
  }

  function renderTeamCard(build, index) {
    const moveTags = build.moves.filter(Boolean).map((move) => `<span class="tag">${escapeHtml(move)}</span>`).join("");
    return `
      <article class="team-card">
        <div class="team-card-header">
          <div>
            <h3>${escapeHtml(build.nickname || build.name)}</h3>
            <p>${escapeHtml(build.name)} / ${escapeHtml(build.nature)} / ${escapeHtml(build.item || "道具なし")} / ${formatEv(build.ev)}</p>
          </div>
          <button class="danger-button" type="button" data-action="delete-build" data-id="${escapeAttr(build.id)}">削除</button>
        </div>
        <div class="tag-list">${moveTags || `<span class="tag">技未登録</span>`}</div>
        <div class="team-card-actions">
          <button class="ghost-button small" type="button" data-action="move-build-up" data-id="${escapeAttr(build.id)}" ${index === 0 ? "disabled" : ""}>上へ</button>
          <button class="ghost-button small" type="button" data-action="move-build-down" data-id="${escapeAttr(build.id)}" ${index >= state.saved.length - 1 ? "disabled" : ""}>下へ</button>
          <button class="ghost-button small" type="button" data-action="load-build" data-id="${escapeAttr(build.id)}">開く</button>
          <button class="ghost-button small" type="button" data-action="load-build-calc" data-id="${escapeAttr(build.id)}">攻撃側へ</button>
          <button class="ghost-button small" type="button" data-action="load-build-defender" data-id="${escapeAttr(build.id)}">防御側へ</button>
        </div>
        <label class="team-note-field">
          <span>メモ</span>
          <textarea rows="2" data-field="team-note" data-id="${escapeAttr(build.id)}" placeholder="役割、選出時の注意、調整理由など">${escapeHtml(build.note || "")}</textarea>
        </label>
      </article>
    `;
  }

  function renderTeamTransferPanel() {
    return `
      <section class="panel transfer-panel">
        <div class="panel-header">
          <h2>保存・読み込み</h2>
          <span class="panel-meta">ログインなし</span>
        </div>
        <div class="panel-body transfer-body">
          <p class="empty-state">スマホでは「保存コードを作成」→「コピー/共有」→別端末で貼り付けて読み込み、が一番扱いやすいです。</p>
          <div class="wide-actions transfer-actions">
            <button class="primary-button" type="button" data-action="generate-export-code">保存コードを作成</button>
            <button class="ghost-button" type="button" data-action="copy-export-code">コピー</button>
            <button class="ghost-button" type="button" data-action="share-export-code">共有</button>
          </div>
          <label class="team-code-field">
            <span>保存コード</span>
            <textarea rows="4" readonly data-field="team-export-code" placeholder="保存コードを作成するとここに表示されます">${escapeHtml(state.teamExportCode)}</textarea>
          </label>
          <div class="field import-mode-field">
            <label for="team-import-mode">読み込み方法</label>
            <select id="team-import-mode" data-field="team-import-mode" class="plain-select">
              ${option("追加する", state.teamImportMode, "merge")}
              ${option("上書きする", state.teamImportMode, "replace")}
            </select>
          </div>
          <label class="team-code-field">
            <span>読み込みコード</span>
            <textarea rows="4" data-field="team-import-code" placeholder="別端末でコピーした保存コードを貼り付け">${escapeHtml(state.teamImportCode)}</textarea>
          </label>
          <div class="wide-actions">
            <button class="primary-button secondary" type="button" data-action="import-saved-code">貼り付けたコードを読み込み</button>
            <button class="ghost-button" type="button" data-action="clear-transfer-code">入力欄を空にする</button>
          </div>
        </div>
      </section>
    `;
  }

  function renderTeamDamagePanel() {
    const mode = state.teamDamageMode === "defense" ? "defense" : "offense";
    const title = mode === "defense" ? "チーム耐久確認" : "チーム火力確認";
    const meta = mode === "defense"
      ? `攻撃側：${escapeHtml(state.calc.attackerName)} ${renderTypePills(getPokemon(state.calc.attackerName))}`
      : `防御側：${escapeHtml(state.calc.defenderName)} ${renderTypePills(getPokemon(state.calc.defenderName))}`;
    const body = mode === "defense" ? renderTeamDefenseContent() : renderTeamOffenseContent();
    return `
      <section class="panel team-damage-panel">
        <div class="panel-header team-damage-panel-header">
          <h2>${title}</h2>
          <span class="panel-meta">${meta}</span>
        </div>
        <div class="panel-body team-damage-panel-body">
          <div class="team-damage-tabs" role="tablist" aria-label="チーム確認切替">
            <button class="team-damage-tab" type="button" role="tab" aria-selected="${mode === "offense"}" data-action="team-damage-mode" data-mode="offense">火力</button>
            <button class="team-damage-tab" type="button" role="tab" aria-selected="${mode === "defense"}" data-action="team-damage-mode" data-mode="defense">耐久</button>
          </div>
          ${body}
        </div>
      </section>
    `;
  }

  function renderTeamOffenseContent() {
    const rows = state.saved.length
      ? state.saved.map((build) => renderTeamDamageCard(build)).join("")
      : `<p class="empty-state">保存した育成があると、チーム全体で現在の防御側にどれくらい入るか確認できます。</p>`;
    return `
      <p class="empty-state">ダメージ計算タブの防御側・条件・設置技を使って、保存済み育成の4技と2技合わせをまとめて確認します。</p>
      <div class="team-damage-list">${rows}</div>
    `;
  }

  function renderTeamDefenseContent() {
    const rows = state.saved.length
      ? state.saved.map((build) => renderTeamDefenseCard(build)).join("")
      : `<p class="empty-state">保存した育成があると、現在の攻撃側からチーム全体がどれくらい受けるか確認できます。</p>`;
    return `
      <p class="empty-state">ダメージ計算タブの攻撃側・4技・条件を使って、保存済み育成を防御側にした時の被ダメージをまとめて確認します。</p>
      <div class="team-damage-list">${rows}</div>
    `;
  }

  function renderTeamDamageCard(build) {
    const results = calcAllMoves(teamDamageConfig(build));
    const best = bestSingleDamage(results);
    const combo = calcBestTwoMoveDamage(results);
    const moveRows = results.map((result, index) => renderTeamDamageMove(index, result)).join("");
    return `
      <article class="team-damage-card">
        <div class="team-damage-head">
          <div>
            <h3>${escapeHtml(build.nickname || build.name)}</h3>
            <p>${escapeHtml(build.nature)} / ${escapeHtml(build.item || "道具なし")} / ${escapeHtml(build.ability || defaultAbility(build.name))}</p>
          </div>
          <button class="ghost-button small" type="button" data-action="load-build-calc" data-id="${escapeAttr(build.id)}">計算へ</button>
        </div>
        <div class="team-damage-summary">
          <div><strong>最大</strong><span>${best ? `${escapeHtml(best.move?.name || "-")}：${escapeHtml(resultLabel(best))}` : "—"}</span></div>
          <div><strong>2技</strong><span>${escapeHtml(combo.label)}</span></div>
        </div>
        <small class="team-damage-note">${escapeHtml(combo.note)}</small>
        <div class="team-damage-moves">${moveRows}</div>
      </article>
    `;
  }

  function renderTeamDefenseCard(build) {
    const results = calcAllMoves(teamDefenseConfig(build));
    const worst = bestSingleDamage(results);
    const combo = calcBestTwoMoveDamage(results);
    const moveRows = results.map((result, index) => renderTeamDamageMove(index, result)).join("");
    const danger = teamDefenseDanger(worst, combo);
    return `
      <article class="team-damage-card team-defense-card ${escapeAttr(danger.className)}">
        <div class="team-damage-head">
          <div>
            <h3>${escapeHtml(build.nickname || build.name)}</h3>
            <p>${escapeHtml(build.name)} / ${escapeHtml(build.nature)} / ${escapeHtml(build.item || "道具なし")} / ${escapeHtml(build.ability || defaultAbility(build.name))}</p>
          </div>
          <button class="ghost-button small" type="button" data-action="load-build-defender" data-id="${escapeAttr(build.id)}">防御側へ</button>
        </div>
        <div class="team-damage-summary team-defense-summary">
          <div><strong>最大被ダメ</strong><span>${worst ? `${escapeHtml(worst.move?.name || "-")}：${escapeHtml(resultLabel(worst))}` : "—"}</span></div>
          <div><strong>2技被ダメ</strong><span>${escapeHtml(combo.label)}</span></div>
          <div><strong>耐久目安</strong><span>${escapeHtml(danger.label)}</span></div>
        </div>
        <small class="team-damage-note">${escapeHtml(combo.note)}</small>
        <div class="team-damage-moves">${moveRows}</div>
      </article>
    `;
  }

  function renderTeamDamageMove(index, result) {
    const name = result?.move?.name || `${index + 1}. 未選択`;
    const label = result?.ok ? resultLabel(result) : (result?.reason || "—");
    return `<div class="team-damage-move"><span>${index + 1}. ${escapeHtml(name)}</span><strong>${escapeHtml(label)}</strong></div>`;
  }

  function renderBasicPanel(mode) {
    const source = getModeSource(mode);
    const pokemon = getPokemon(source.name);
    const abilities = getAbilityOptions(source.name);
    const itemOptions = ["", ...state.tools.map((tool) => tool["名前"])];
    const title = mode === "calc-defender" ? "防御側" : mode === "calc-attacker" ? "攻撃側" : "基本情報";
    const nameField = mode === "build" ? "build-name" : mode === "calc-attacker" ? "calc-attacker-name" : "calc-defender-name";
    const natureField = mode === "build" ? "build-nature" : mode === "calc-attacker" ? "calc-attacker-nature" : "calc-defender-nature";
    const itemField = mode === "build" ? "build-item" : mode === "calc-attacker" ? "calc-attacker-item" : "calc-defender-item";
    const abilityField = mode === "build" ? "build-ability" : mode === "calc-attacker" ? "calc-attacker-ability" : "calc-defender-ability";

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
          <div class="field">
            <label for="${abilityField}">特性</label>
            <select id="${abilityField}" data-field="${abilityField}">
              ${["", ...abilities].map((ability) => option(ability || "未指定", source.ability || "未指定", ability)).join("")}
            </select>
          </div>
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

  function renderRankPanel(mode, title) {
    const ranks = getRankByMode(mode);
    return `
      <section class="panel compact rank-panel">
        <div class="panel-header"><h3>${title}</h3><span class="panel-meta">-6〜+6</span></div>
        <div class="panel-body rank-grid">
          ${RANK_KEYS.map((stat) => `
            <div class="field rank-field">
              <label for="${mode}-rank-${stat.key}">${stat.label}</label>
              <select id="${mode}-rank-${stat.key}" data-field="rank" data-mode="${mode}" data-stat="${stat.key}" class="plain-select">
                ${[-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6].map((value) => option(value > 0 ? `+${value}` : String(value), String(ranks[stat.key] || 0), String(value))).join("")}
              </select>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderHazardPanel() {
    const hazards = state.calc.defenderHazards || defaultHazards();
    const defender = getPokemon(state.calc.defenderName);
    const defenderStats = calcStats(defender, state.calc.defenderEv, state.calc.defenderNature);
    const preview = calcEntryHazards(defender, defenderStats.hp, state.calc.defenderAbility || defaultAbility(state.calc.defenderName), state.calc.defenderItem, hazards);
    return `
      <section class="panel compact hazard-panel">
        <div class="panel-header"><h3>防御側の設置技</h3><span class="panel-meta">交代時ダメージを込みで計算</span></div>
        <div class="panel-body">
          <label class="check-card">
            <input type="checkbox" data-field="defender-hazard-stealth-rock" ${hazards.stealthRock ? "checked" : ""} />
            <span><strong>ステルスロック</strong><small>いわ相性で最大HPの1/8を増減</small></span>
          </label>
          <div class="field">
            <label for="defender-hazard-spikes">まきびし</label>
            <select id="defender-hazard-spikes" class="plain-select" data-field="defender-hazard-spikes">
              ${[0, 1, 2, 3].map((value) => option(value === 0 ? "なし" : `${value}回`, String(hazards.spikes || 0), String(value))).join("")}
            </select>
          </div>
          <p class="hazard-preview">現在の設置ダメージ：${preview.damage} / ${preview.pct.toFixed(1)}%${preview.notes.length ? `（${escapeHtml(preview.notes.join("・"))}）` : ""}</p>
        </div>
      </section>
    `;
  }

  function renderMovesPanel(mode, pokemonName, moves, results) {
    const available = getMoves(pokemonName);
    const title = mode === "calc" ? "技と計算結果" : "技 (4/4)";
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>${title}</h2>
          <span class="panel-meta">${available.length}候補</span>
        </div>
        <div class="panel-body">
          ${mode === "calc" ? renderMoveComboPanel(results) : ""}
          <div class="moves-list">
            ${[0, 1, 2, 3].map((slot) => renderMoveSlot(mode, slot, moves[slot], available, results[slot])).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderMoveComboPanel(results) {
    const combo = calcComboDamage(results);
    return `
      <div class="combo-panel">
        <div class="combo-controls">
          <div class="field">
            <label for="combo-first">1つ目の技</label>
            <select id="combo-first" class="plain-select" data-field="combo-first">
              ${[0, 1, 2, 3].map((slot) => option(`${slot + 1}. ${state.calc.moves[slot] || "未選択"}`, String(state.calc.comboFirst ?? 0), String(slot))).join("")}
            </select>
          </div>
          <div class="field">
            <label for="combo-second">2つ目の技</label>
            <select id="combo-second" class="plain-select" data-field="combo-second">
              ${[0, 1, 2, 3].map((slot) => option(`${slot + 1}. ${state.calc.moves[slot] || "未選択"}`, String(state.calc.comboSecond ?? 1), String(slot))).join("")}
            </select>
          </div>
        </div>
        <div class="combo-result">
          <strong>${escapeHtml(combo.label)}</strong>
          <span>${escapeHtml(combo.note)}</span>
        </div>
      </div>
    `;
  }

  function renderMoveSlot(mode, slot, selected, available, result) {
    const move = findMoveInList(available, selected) || findAnyMove(selected);
    const selectedKey = moveKey(selected);
    const listId = `${mode}-move-options-${slot}`;
    return `
      <div class="move-row">
        <span class="slot-index">${slot + 1}</span>
        <div class="move-main">
          <label class="sr-only" for="${mode}-move-search-${slot}">技${slot + 1}を検索</label>
          <input id="${mode}-move-search-${slot}" class="move-search" list="${listId}" data-field="move-search" data-mode="${mode}" data-slot="${slot}" value="${escapeAttr(selected || "")}" placeholder="技名を検索して選択" autocomplete="off" />
          <datalist id="${listId}">
            ${available.map((candidate) => `<option value="${escapeAttr(candidate.name)}">${escapeHtml(candidate.name)}${candidate.candidate ? " *" : ""}</option>`).join("")}
          </datalist>
          <div class="move-select-wrap">
            <span class="move-select-caption">候補</span>
            <select class="move-select" data-field="move" data-mode="${mode}" data-slot="${slot}">
              <option value="">技を選択</option>
              ${available.map((candidate) => `<option value="${escapeAttr(candidate.name)}" ${moveKey(candidate.name) === selectedKey ? "selected" : ""}>${escapeHtml(candidate.name)}${candidate.candidate ? " *" : ""}</option>`).join("")}
            </select>
          </div>
          ${move ? renderMoveMeta(move) : ""}
          ${move ? renderHitSelector(mode, slot, move) : ""}
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

  function renderHitSelector(mode, slot, move) {
    const options = hitOptionsForMove(move);
    if (options.length <= 1) return "";
    const selected = getMoveHitByMode(mode, slot) || String(options[0]);
    return `
      <div class="hit-select-wrap">
        <label for="${mode}-hit-${slot}">連続回数</label>
        <select id="${mode}-hit-${slot}" class="plain-select hit-select" data-field="move-hit" data-mode="${mode}" data-slot="${slot}">
          ${options.map((hit) => option(`${hit}回`, selected, String(hit))).join("")}
        </select>
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

  if (!IS_BATTLE_REVIEW_PAGE) {
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
    if (action === "calc-section") {
      state.calcSection = target.dataset.section || "moves";
      render();
      return;
    }
    if (action === "team-damage-mode") {
      state.teamDamageMode = target.dataset.mode === "defense" ? "defense" : "offense";
      render();
      return;
    }
    if (action === "save") saveCurrentBuild();
    if (action === "sync-calc") syncBuildToCalc();
    if (action === "apply-calc") applyCalcToBuild();
    if (action === "swap-sides") swapSides();
    if (action === "new-build") newBuild();
    if (action === "load-build") loadBuild(target.dataset.id, false);
    if (action === "load-build-calc") loadBuild(target.dataset.id, true);
    if (action === "load-build-defender") applySavedToCalcDefender(target.dataset.id);
    if (action === "move-build-up") moveSavedBuild(target.dataset.id, -1);
    if (action === "move-build-down") moveSavedBuild(target.dataset.id, 1);
    if (action === "delete-build") deleteBuild(target.dataset.id);
    if (action === "generate-export-code") generateExportCode();
    if (action === "copy-export-code") copyExportCode();
    if (action === "share-export-code") shareExportCode();
    if (action === "import-saved-code") importSavedCode();
    if (action === "clear-transfer-code") clearTransferCode();
    if (action === "switch-pokemon") updatePokemon(target.dataset.mode, target.dataset.name);
    if (action === "apply-dex") applyDexPokemon(target.dataset.target, target.dataset.name);
    if (action === "install-app") installApp();
    if (action === "open-battle-review") {
      window.location.href = "battle-review.html";
      return;
    }
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
    if (target.dataset.field === "team-note") {
      updateSavedNote(target.dataset.id, target.value);
    }
    if (target.dataset.field === "team-import-code") {
      state.teamImportCode = target.value;
    }
  });

  document.addEventListener("focusout", (event) => {
    const target = event.target;
    if (!target.dataset) return;
    const field = target.dataset.field;
    if (field === "move-search") {
      commitMoveSearch(target);
      return;
    }
    if (field === "build-name") updatePokemon("build", target.value);
    if (field === "calc-attacker-name") updatePokemon("calc-attacker", target.value);
    if (field === "calc-defender-name") updatePokemon("calc-defender", target.value);
    if (field === "dex-name") updateDexPokemon(target.value);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!target.dataset) return;
    if (target.dataset.action === "point-range" || target.dataset.action === "point-number") {
      setPoint(target.dataset.mode, target.dataset.stat, number(target.value, 0));
      return;
    }

    const field = target.dataset.field;

    if (field === "move-search") {
      commitMoveSearch(target);
      return;
    }
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
    if (field === "calc-attacker-ability") state.calc.attackerAbility = target.value;
    if (field === "calc-defender-ability") state.calc.defenderAbility = target.value;
    if (field === "weather") state.calc.weather = target.value;
    if (field === "field-condition") state.calc.field = target.value;
    if (field === "reflect") state.calc.reflect = target.value;
    if (field === "attacker-status") state.calc.attackerStatus = target.value;
    if (field === "defender-status") state.calc.defenderStatus = target.value;
    if (field === "attacker-hp-condition") state.calc.attackerHpCondition = target.value;
    if (field === "defender-hp-condition") state.calc.defenderHpCondition = target.value;
    if (field === "ally-fainted") state.calc.allyFainted = number(target.value, 0);
    if (field === "critical-hit") state.calc.criticalHit = target.checked;
    if (field === "attacker-moved-last") state.calc.attackerMovedLast = target.checked;
    if (field === "target-switched") state.calc.targetSwitched = target.checked;
    if (field === "flash-fire-boost") state.calc.flashFireBoost = target.checked;
    if (field === "charged-boost") state.calc.chargedBoost = target.checked;
    if (field === "plus-minus-active") state.calc.plusMinusActive = target.checked;
    if (field === "unburden-active") state.calc.unburdenActive = target.checked;
    if (field === "slow-start-active") state.calc.slowStartActive = target.checked;
    if (field === "eel-boost-active") state.calc.eelBoostActive = target.checked;
    if (field === "rivalry-condition") state.calc.rivalry = target.value;
    if (field === "metronome-count") state.calc.metronomeCount = number(target.value, 1);
    if (field === "combo-first") state.calc.comboFirst = number(target.value, 0);
    if (field === "combo-second") state.calc.comboSecond = number(target.value, 1);
    if (field === "team-import-mode") state.teamImportMode = target.value;
    if (field === "team-import-code") state.teamImportCode = target.value;
    if (field === "defender-hazard-stealth-rock") state.calc.defenderHazards.stealthRock = target.checked;
    if (field === "defender-hazard-spikes") state.calc.defenderHazards.spikes = number(target.value, 0);
    if (field === "rank") { setRank(target.dataset.mode, target.dataset.stat, target.value); return; }
    if (field === "move-hit") {
      const hits = getMoveHitsByMode(target.dataset.mode);
      hits[Number(target.dataset.slot)] = target.value;
    }
    if (field === "season-filter") updateSeasonFilter(target.value);
    if (field === "move") {
      const moves = target.dataset.mode === "calc" ? state.calc.moves : state.build.moves;
      const slot = Number(target.dataset.slot);
      moves[slot] = target.value;
      getMoveHitsByMode(target.dataset.mode)[slot] = "";
    }
    render();
  });
  }

  function commitMoveSearch(target) {
    const mode = target.dataset.mode;
    const slot = Number(target.dataset.slot);
    const value = (target.value || "").trim();
    const pokemonName = mode === "calc" ? state.calc.attackerName : state.build.name;
    const available = getMoves(pokemonName);
    const moves = mode === "calc" ? state.calc.moves : state.build.moves;
    if (!value) {
      moves[slot] = "";
      getMoveHitsByMode(mode)[slot] = "";
      render();
      return;
    }
    const exact = findMoveInList(available, value) || findAnyMove(value);
    const normalized = moveKey(value);
    const partial = available.filter((move) => moveKey(move.name).includes(normalized));
    const picked = exact || (partial.length === 1 ? partial[0] : null);
    if (!picked) {
      showToast("候補から技を選択してください");
      render();
      return;
    }
    moves[slot] = picked.name;
    getMoveHitsByMode(mode)[slot] = "";
    render();
  }

  function getModeSource(mode) {
    if (mode === "calc-attacker") {
      return { name: state.calc.attackerName, nature: state.calc.attackerNature, item: state.calc.attackerItem, ability: state.calc.attackerAbility };
    }
    if (mode === "calc-defender") {
      return { name: state.calc.defenderName, nature: state.calc.defenderNature, item: state.calc.defenderItem, ability: state.calc.defenderAbility };
    }
    return { name: state.build.name, nature: state.build.nature, item: state.build.item, ability: state.build.ability };
  }

  function getEvByMode(mode) {
    if (mode === "calc-attacker") return state.calc.attackerEv;
    if (mode === "calc-defender") return state.calc.defenderEv;
    return state.build.ev;
  }

  function getRankByMode(mode) {
    if (mode === "calc-attacker") return state.calc.attackerRank || (state.calc.attackerRank = defaultRank());
    if (mode === "calc-defender") return state.calc.defenderRank || (state.calc.defenderRank = defaultRank());
    return defaultRank();
  }

  function getMoveHitsByMode(mode) {
    if (mode === "calc") return state.calc.moveHits || (state.calc.moveHits = ["", "", "", ""]);
    return state.build.moveHits || (state.build.moveHits = ["", "", "", ""]);
  }

  function getMoveHitByMode(mode, slot) {
    return getMoveHitsByMode(mode)[Number(slot)] || "";
  }

  function setRank(mode, stat, value) {
    const ranks = getRankByMode(mode);
    ranks[stat] = clamp(number(value, 0), -6, 6);
    render();
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
      state.build.moveHits = ["", "", "", ""];
      state.build.ability = defaultAbility(name);
    } else if (mode === "calc-attacker") {
      state.calc.attackerName = name;
      state.calc.attackerAbility = defaultAbility(name);
      state.calc.moves = suggestMoves(name);
      state.calc.moveHits = ["", "", "", ""];
    } else {
      state.calc.defenderName = name;
      state.calc.defenderAbility = defaultAbility(name);
    }
    applyPokemonPreset(mode, name, { keepMoves: false });
    render();
  }

  function updateDexPokemon(name) {
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
    state.dexName = name;
    render();
  }

  function applyDexPokemon(target, name) {
    if (!state.pokemonByName.has(name) || !isPokemonSelectable(name)) {
      showToast("対象のポケモンを反映できません");
      render();
      return;
    }
    if (target === "attacker") {
      state.activeView = "calc";
      state.calcSection = "attacker";
      updatePokemon("calc-attacker", name);
      return;
    }
    if (target === "defender") {
      state.activeView = "calc";
      state.calcSection = "defender";
      updatePokemon("calc-defender", name);
      return;
    }
    state.activeView = "build";
    updatePokemon("build", name);
  }

  function syncBuildToCalc() {
    state.calc.attackerName = state.build.name;
    state.calc.attackerNature = state.build.nature;
    state.calc.attackerItem = state.build.item;
    state.calc.attackerAbility = state.build.ability || defaultAbility(state.build.name);
    state.calc.attackerEv = cloneEv(state.build.ev);
    state.calc.moves = state.build.moves.slice(0, 4);
    state.calc.moveHits = (state.build.moveHits || ["", "", "", ""]).slice(0, 4);
    state.activeView = "calc";
    state.calcSection = "moves";
    showToast("育成をダメージ計算へ送りました");
    render();
  }

  function applyCalcToBuild() {
    state.build.name = state.calc.attackerName;
    state.build.nature = state.calc.attackerNature;
    state.build.item = state.calc.attackerItem;
    state.build.ability = state.calc.attackerAbility || defaultAbility(state.calc.attackerName);
    state.build.ev = cloneEv(state.calc.attackerEv);
    state.build.moves = state.calc.moves.slice(0, 4);
    state.build.moveHits = (state.calc.moveHits || ["", "", "", ""]).slice(0, 4);
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
      ability: state.calc.attackerAbility,
      ev: cloneEv(state.calc.attackerEv),
      rank: cloneRank(state.calc.attackerRank),
    };
    state.calc.attackerName = state.calc.defenderName;
    state.calc.attackerNature = state.calc.defenderNature;
    state.calc.attackerItem = state.calc.defenderItem;
    state.calc.attackerAbility = state.calc.defenderAbility || defaultAbility(state.calc.defenderName);
    state.calc.attackerEv = cloneEv(state.calc.defenderEv);
    state.calc.attackerRank = cloneRank(state.calc.defenderRank);
    state.calc.defenderName = oldAttacker.name;
    state.calc.defenderNature = oldAttacker.nature;
    state.calc.defenderItem = oldAttacker.item;
    state.calc.defenderAbility = oldAttacker.ability || defaultAbility(oldAttacker.name);
    state.calc.defenderEv = cloneEv(oldAttacker.ev);
    state.calc.defenderRank = cloneRank(oldAttacker.rank);
    state.calc.moves = suggestMoves(state.calc.attackerName);
    state.calc.moveHits = ["", "", "", ""];
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
      ability: defaultAbility(name),
      ev: defaultEv(),
      moves: suggestMoves(name),
      moveHits: ["", "", "", ""],
      updatedAt: Date.now(),
    };
    applyPokemonPreset("build", name, { keepMoves: false });
    state.activeView = "build";
    render();
  }

  function saveCurrentBuild() {
    const id = `${state.build.name}-${Date.now()}`;
    const snapshot = normalizeSavedBuild({
      id,
      name: state.build.name,
      nickname: state.build.nickname,
      nature: state.build.nature,
      item: state.build.item,
      ability: state.build.ability,
      ev: cloneEv(state.build.ev),
      moves: state.build.moves.slice(0, 4),
      moveHits: (state.build.moveHits || ["", "", "", ""]).slice(0, 4),
      note: "",
      updatedAt: Date.now(),
    }, 0);
    if (!snapshot) {
      showToast("保存できませんでした");
      return;
    }
    state.saved = [snapshot, ...state.saved].slice(0, MAX_SAVED_BUILDS);
    state.teamExportCode = "";
    persistSaved();
    showToast("育成を保存しました");
    render();
  }

  function loadBuild(id, toCalc) {
    const saved = state.saved.find((item) => item.id === id);
    if (!saved) return;
    if (toCalc) {
      applySavedToCalcAttacker(saved);
    } else {
      state.build = {
        name: saved.name,
        nickname: saved.nickname,
        nature: saved.nature,
        item: saved.item,
        ability: saved.ability,
        ev: cloneEv(saved.ev),
        moves: saved.moves.slice(0, 4),
        moveHits: (saved.moveHits || ["", "", "", ""]).slice(0, 4),
        updatedAt: Date.now(),
      };
      state.activeView = "build";
    }
    render();
  }

  function applySavedToCalcAttacker(saved) {
    state.calc.attackerName = saved.name;
    state.calc.attackerNature = saved.nature;
    state.calc.attackerItem = saved.item;
    state.calc.attackerAbility = saved.ability || defaultAbility(saved.name);
    state.calc.attackerEv = cloneEv(saved.ev);
    state.calc.moves = saved.moves.slice(0, 4);
    state.calc.moveHits = (saved.moveHits || ["", "", "", ""]).slice(0, 4);
    state.activeView = "calc";
    state.calcSection = "moves";
  }

  function applySavedToCalcDefender(id) {
    const saved = state.saved.find((item) => item.id === id);
    if (!saved) return;
    state.calc.defenderName = saved.name;
    state.calc.defenderNature = saved.nature;
    state.calc.defenderItem = saved.item;
    state.calc.defenderAbility = saved.ability || defaultAbility(saved.name);
    state.calc.defenderEv = cloneEv(saved.ev);
    state.activeView = "calc";
    state.calcSection = "defender";
    render();
  }

  function deleteBuild(id) {
    state.saved = state.saved.filter((item) => item.id !== id);
    state.teamExportCode = "";
    persistSaved();
    render();
  }

  function moveSavedBuild(id, delta) {
    const index = state.saved.findIndex((item) => item.id === id);
    const next = index + delta;
    if (index < 0 || next < 0 || next >= state.saved.length) return;
    const copy = state.saved.slice();
    const [item] = copy.splice(index, 1);
    copy.splice(next, 0, item);
    state.saved = copy;
    state.teamExportCode = "";
    persistSaved();
    render();
  }

  function updateSavedNote(id, note) {
    const saved = state.saved.find((item) => item.id === id);
    if (!saved) return;
    saved.note = String(note || "").slice(0, 300);
    state.teamExportCode = "";
    persistSaved();
  }


  function buildExportPayload() {
    return {
      type: "damage-build-note-saved-builds",
      version: 1,
      exportedAt: new Date().toISOString(),
      count: state.saved.length,
      builds: state.saved.map((build) => ({
        id: build.id,
        name: build.name,
        nickname: build.nickname || "",
        nature: build.nature || "まじめ",
        item: build.item || "",
        ability: build.ability || "",
        ev: cloneEv(build.ev),
        moves: (build.moves || []).slice(0, 4),
        moveHits: (build.moveHits || ["", "", "", ""]).slice(0, 4),
        note: build.note || "",
        updatedAt: build.updatedAt || Date.now(),
      })),
    };
  }

  function generateExportCode() {
    state.teamExportCode = encodeShareCode(buildExportPayload());
    showToast(`${state.saved.length}件の保存コードを作成しました`);
    render();
  }

  async function copyExportCode() {
    if (!state.teamExportCode) state.teamExportCode = encodeShareCode(buildExportPayload());
    try {
      await navigator.clipboard.writeText(state.teamExportCode);
      showToast("保存コードをコピーしました");
    } catch {
      showToast("コピーできない場合は保存コード欄を長押ししてコピーしてください");
    }
    render();
  }

  async function shareExportCode() {
    if (!state.teamExportCode) state.teamExportCode = encodeShareCode(buildExportPayload());
    if (navigator.share) {
      try {
        await navigator.share({ title: "Damage Build Note 保存コード", text: state.teamExportCode });
        showToast("保存コードを共有しました");
        render();
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await copyExportCode();
  }

  function importSavedCode() {
    const code = (state.teamImportCode || "").trim();
    if (!code) {
      showToast("読み込みコードを貼り付けてください");
      return;
    }
    let payload;
    try {
      payload = decodeShareCode(code);
    } catch {
      showToast("保存コードを読み込めませんでした");
      return;
    }
    const imported = normalizeSavedList(payload);
    if (!imported.length) {
      showToast("読み込める育成がありませんでした");
      return;
    }
    const before = state.saved.slice();
    try {
      state.saved = state.teamImportMode === "replace" ? imported : mergeSavedBuilds(imported, state.saved);
      state.saved = state.saved.slice(0, MAX_SAVED_BUILDS);
      state.teamExportCode = "";
      persistSaved();
      showToast(`${imported.length}件読み込みました`);
      render();
    } catch {
      state.saved = before;
      persistSaved();
      showToast("読み込みに失敗したため元に戻しました");
      render();
    }
  }

  function clearTransferCode() {
    state.teamImportCode = "";
    state.teamExportCode = "";
    render();
  }

  function encodeShareCode(payload) {
    const json = JSON.stringify(payload);
    return `${EXPORT_CODE_PREFIX}${base64EncodeUnicode(json)}`;
  }

  function decodeShareCode(value) {
    const text = String(value || "").trim();
    const raw = text.startsWith(EXPORT_CODE_PREFIX) ? base64DecodeUnicode(text.slice(EXPORT_CODE_PREFIX.length).replace(/\s+/g, "")) : text.startsWith("{") || text.startsWith("[") ? text : base64DecodeUnicode(text.replace(/\s+/g, ""));
    return JSON.parse(raw);
  }

  function base64EncodeUnicode(value) {
    return btoa(unescape(encodeURIComponent(value)));
  }

  function base64DecodeUnicode(value) {
    return decodeURIComponent(escape(atob(value)));
  }

  function mergeSavedBuilds(imported, current) {
    const merged = [];
    const seen = new Set();
    [...imported, ...current].forEach((build) => {
      const key = savedBuildKey(build);
      if (seen.has(key)) return;
      seen.add(key);
      merged.push(build);
    });
    return merged;
  }

  function normalizeSavedList(value) {
    const list = Array.isArray(value) ? value : Array.isArray(value?.builds) ? value.builds : [];
    return list.map((item, index) => normalizeSavedBuild(item, index)).filter(Boolean).slice(0, MAX_SAVED_BUILDS);
  }

  function normalizeSavedBuild(raw, index = 0) {
    if (!raw || typeof raw !== "object") return null;
    const name = String(raw.name || "").trim();
    if (!state.pokemonByName.has(name)) return null;
    const ev = normalizeEvPoints(raw.ev || defaultEv());
    const moves = (Array.isArray(raw.moves) ? raw.moves : [])
      .map((nameText) => findMoveInList(getMoves(name), nameText) || findAnyMove(nameText))
      .filter(Boolean)
      .map((move) => move.name)
      .filter((moveName, moveIndex, all) => all.findIndex((value) => moveKey(value) === moveKey(moveName)) === moveIndex)
      .slice(0, 4);
    while (moves.length < 4) moves.push("");
    const abilityOptions = getAbilityOptions(name);
    const ability = abilityOptions.includes(raw.ability) ? raw.ability : defaultAbility(name);
    const nature = NATURES.some((item) => item.name === raw.nature) ? raw.nature : (parseRankNature(getRankingForPokemon(name)) || "まじめ");
    const item = state.tools.some((tool) => tool["名前"] === raw.item) ? raw.item : "";
    const id = String(raw.id || `${name}-${Date.now()}-${index}`).slice(0, 80);
    return {
      id,
      name,
      nickname: String(raw.nickname || "").slice(0, 40),
      nature,
      item,
      ability,
      ev,
      moves,
      moveHits: (Array.isArray(raw.moveHits) ? raw.moveHits : ["", "", "", ""]).slice(0, 4),
      note: String(raw.note || "").slice(0, 300),
      updatedAt: number(raw.updatedAt, Date.now()),
    };
  }

  function normalizeEvPoints(ev) {
    const next = defaultEv();
    let remaining = POINT_TOTAL;
    STAT_KEYS.forEach((stat) => {
      const value = clamp(Math.round(number(ev?.[stat.key], 0)), 0, Math.min(POINT_MAX, remaining));
      next[stat.key] = value;
      remaining -= value;
    });
    return next;
  }

  function savedBuildKey(build) {
    return [build.id || "", build.name, build.nature, build.item, build.ability, formatEv(build.ev), ...(build.moves || [])].map((value) => moveKey(value)).join("|");
  }

  function teamDamageConfig(build) {
    return {
      attackerName: build.name,
      attackerNature: build.nature,
      attackerItem: build.item,
      attackerAbility: build.ability || defaultAbility(build.name),
      attackerEv: cloneEv(build.ev),
      attackerRank: defaultRank(),
      defenderName: state.calc.defenderName,
      defenderNature: state.calc.defenderNature,
      defenderItem: state.calc.defenderItem,
      defenderAbility: state.calc.defenderAbility,
      defenderEv: cloneEv(state.calc.defenderEv),
      defenderRank: cloneRank(state.calc.defenderRank),
      moves: (build.moves || []).slice(0, 4),
      moveHits: (build.moveHits || ["", "", "", ""]).slice(0, 4),
      weather: state.calc.weather,
      field: state.calc.field,
      reflect: state.calc.reflect,
      attackerStatus: "なし",
      defenderStatus: state.calc.defenderStatus,
      attackerHpCondition: "通常",
      defenderHpCondition: state.calc.defenderHpCondition,
      allyFainted: state.calc.allyFainted,
      criticalHit: state.calc.criticalHit,
      attackerMovedLast: state.calc.attackerMovedLast,
      targetSwitched: state.calc.targetSwitched,
      flashFireBoost: state.calc.flashFireBoost,
      chargedBoost: state.calc.chargedBoost,
      plusMinusActive: state.calc.plusMinusActive,
      unburdenActive: state.calc.unburdenActive,
      slowStartActive: state.calc.slowStartActive,
      eelBoostActive: state.calc.eelBoostActive,
      rivalry: state.calc.rivalry,
      metronomeCount: state.calc.metronomeCount,
      defenderHazards: cloneHazards(state.calc.defenderHazards),
    };
  }

  function teamDefenseConfig(build) {
    return {
      attackerName: state.calc.attackerName,
      attackerNature: state.calc.attackerNature,
      attackerItem: state.calc.attackerItem,
      attackerAbility: state.calc.attackerAbility || defaultAbility(state.calc.attackerName),
      attackerEv: cloneEv(state.calc.attackerEv),
      attackerRank: cloneRank(state.calc.attackerRank),
      defenderName: build.name,
      defenderNature: build.nature,
      defenderItem: build.item,
      defenderAbility: build.ability || defaultAbility(build.name),
      defenderEv: cloneEv(build.ev),
      defenderRank: defaultRank(),
      moves: state.calc.moves.slice(0, 4),
      moveHits: (state.calc.moveHits || ["", "", "", ""]).slice(0, 4),
      weather: state.calc.weather,
      field: state.calc.field,
      reflect: state.calc.reflect,
      attackerStatus: state.calc.attackerStatus,
      defenderStatus: state.calc.defenderStatus,
      attackerHpCondition: state.calc.attackerHpCondition,
      defenderHpCondition: state.calc.defenderHpCondition,
      allyFainted: state.calc.allyFainted,
      criticalHit: state.calc.criticalHit,
      attackerMovedLast: state.calc.attackerMovedLast,
      targetSwitched: state.calc.targetSwitched,
      flashFireBoost: state.calc.flashFireBoost,
      chargedBoost: state.calc.chargedBoost,
      plusMinusActive: state.calc.plusMinusActive,
      unburdenActive: state.calc.unburdenActive,
      slowStartActive: state.calc.slowStartActive,
      eelBoostActive: state.calc.eelBoostActive,
      rivalry: state.calc.rivalry,
      metronomeCount: state.calc.metronomeCount,
      defenderHazards: cloneHazards(state.calc.defenderHazards),
    };
  }

  function teamDefenseDanger(worst, combo) {
    const maxPct = worst?.ok ? worst.maxPct : 0;
    const comboLabel = combo?.label || "";
    if (comboLabel.includes("確定") || maxPct >= 100) return { label: "危険", className: "danger" };
    if (comboLabel.includes("乱数") || maxPct >= 75) return { label: "注意", className: "warning" };
    if (maxPct >= 50) return { label: "中程度", className: "middle" };
    if (worst?.ok) return { label: "余裕あり", className: "safe" };
    return { label: "判定なし", className: "middle" };
  }

  function bestSingleDamage(results) {
    return results.filter((result) => result?.ok).sort((a, b) => (b.maxPct || 0) - (a.maxPct || 0) || (b.minPct || 0) - (a.minPct || 0))[0] || null;
  }

  function calcBestTwoMoveDamage(results) {
    const valid = results.filter((result) => result?.ok && result.hp);
    if (valid.length < 2) return { ok: false, label: "—", note: "2つ以上の攻撃技があると表示します" };
    let best = null;
    for (let i = 0; i < valid.length; i += 1) {
      for (let j = i + 1; j < valid.length; j += 1) {
        const a = valid[i];
        const b = valid[j];
        const hp = a.hp;
        const entry = Math.max(a.entryDamage || 0, b.entryDamage || 0);
        const min = Math.min(hp, entry + a.moveMin + b.moveMin);
        const max = Math.min(hp, entry + a.moveMax + b.moveMax);
        const minPct = (min / hp) * 100;
        const maxPct = (max / hp) * 100;
        const score = maxPct * 1000 + minPct;
        if (!best || score > best.score) {
          const koText = min >= hp ? "確定" : max >= hp ? "乱数" : "不可";
          best = {
            ok: true,
            score,
            label: `${minPct.toFixed(1)} ~ ${maxPct.toFixed(1)}% / ${koText}`,
            note: `${a.move?.name || "技1"} + ${b.move?.name || "技2"}${entry > 0 ? ` / 設置${entry}込み` : ""}`,
          };
        }
      }
    }
    return best || { ok: false, label: "—", note: "2つ以上の攻撃技があると表示します" };
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
      state.build.moveHits = ["", "", "", ""];
      state.build.ability = defaultAbility(fallback.name);
      applyPokemonPreset("build", fallback.name, { keepMoves: false });
    }
    if (!isPokemonSelectable(state.calc.attackerName)) {
      state.calc.attackerName = fallback.name;
      state.calc.attackerAbility = defaultAbility(fallback.name);
      state.calc.moves = suggestMoves(fallback.name);
      state.calc.moveHits = ["", "", "", ""];
      applyPokemonPreset("calc-attacker", fallback.name, { keepMoves: false });
    }
    if (!isPokemonSelectable(state.calc.defenderName)) {
      state.calc.defenderName = firstSelectable(["ブリジュラス", fallback.name]) || fallback.name;
      state.calc.defenderAbility = defaultAbility(state.calc.defenderName);
      applyPokemonPreset("calc-defender", state.calc.defenderName, { keepMoves: false });
    }
    if (!state.dexName || !isPokemonSelectable(state.dexName)) state.dexName = fallback.name;
  }

  function suggestMoves(pokemonName) {
    const special = specialMegaPreset(pokemonName);
    if (special?.moves) return special.moves.slice(0, 4);
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
      const move = findMoveInList(getMoves(config.attackerName), config.moves?.[slot]) || findAnyMove(config.moves?.[slot]);
      return calcMoveDamage(config, move, slot);
    });
  }

  function calcMoveDamage(config, move, slot = 0) {
    if (!move) return { ok: false, move: null, reason: "未選択" };
    const cfg = normalizeCalcConfig(config);
    const attacker = getPokemon(cfg.attackerName);
    const defender = getPokemon(cfg.defenderName);
    const attackerAbility = cfg.attackerAbility || defaultAbility(cfg.attackerName);
    const defenderAbilityBase = cfg.defenderAbility || defaultAbility(cfg.defenderName);
    const ignoresDefenderAbility = ignoresTargetAbility(attackerAbility, move);
    const defenderAbility = ignoresDefenderAbility ? "" : defenderAbilityBase;
    const weather = effectiveWeather(cfg.weather, attackerAbility, defenderAbilityBase);
    const field = effectiveField(cfg.field, attackerAbility, defenderAbilityBase);
    const moveType = resolveMoveType(move, attackerAbility, weather, field, attacker, cfg.attackerItem);
    const moveForCalc = { ...move, type: moveType };
    cfg.criticalHit = Boolean(cfg.criticalHit) || isAlwaysCriticalMove(moveForCalc.name);

    if (move.category === "変化") {
      return { ok: false, move: moveForCalc, reason: "変化技" };
    }
    if (isReflectMove(move.name)) {
      return { ok: false, move: moveForCalc, reason: "反射技は相手技依存" };
    }

    const baseAttackerStats = calcStats(attacker, cfg.attackerEv, cfg.attackerNature);
    const baseDefenderStats = calcStats(defender, cfg.defenderEv, cfg.defenderNature);
    const attackerStats = applyBattleStatModifiers(baseAttackerStats, attacker, "attacker", cfg, moveForCalc, attackerAbility, defenderAbility, weather, field);
    const defenderStats = applyBattleStatModifiers(baseDefenderStats, defender, "defender", cfg, moveForCalc, defenderAbility, attackerAbility, weather, field);
    const rawPower = resolvePower(moveForCalc, attacker, defender, attackerStats, defenderStats, cfg, weather, field, attackerAbility, defenderAbility);
    const fixedDamage = fixedDamageForMove(moveForCalc);

    if (!rawPower && !fixedDamage) {
      return { ok: false, move: moveForCalc, reason: "威力なし / 条件未対応" };
    }

    const physical = move.category === "物理";
    let attackStat = physical ? attackerStats.atk : attackerStats.spa;
    let defenseStat = physical ? defenderStats.def : defenderStats.spd;

    if (move.name === "ボディプレス") attackStat = attackerStats.def;
    if (move.name === "イカサマ") attackStat = defenderStats.atk;
    if (["サイコショック", "サイコブレイク", "しんぴのつるぎ"].includes(move.name)) defenseStat = defenderStats.def;

    attackStat = applyRuinAttackModifier(attackStat, physical, defenderAbility);
    defenseStat = applyRuinDefenseModifier(defenseStat, physical, attackerAbility);

    let type = move.name === "フライングプレス"
      ? effectiveness("かくとう", defender, attackerAbility, defenderAbility) * effectiveness("ひこう", defender, attackerAbility, defenderAbility)
      : effectiveness(moveType, defender, attackerAbility, defenderAbility);
    if (defenderAbility === "ふしぎなまもり" && type > 0 && type <= 1) type = 0;
    if (defenderAbility === "テラスシェル" && cfg.defenderHpCondition === "満タン" && type > 1) type = 0.5;
    const selectedHits = resolveHits(moveForCalc, cfg.moveHits?.[slot]);
    let powers = resolvePowerList(moveForCalc, rawPower, selectedHits);
    const parentBond = attackerAbility === "おやこあい" && selectedHits === 1 && !isFixedMultiHitMove(moveForCalc);
    if (parentBond && rawPower) powers = [rawPower, Math.max(1, rawPower * 0.25)];
    const powerModifier = attackerPowerModifier(attackerAbility, moveForCalc, rawPower, type, cfg, weather, field);
    const itemModifier = itemDamageModifier(cfg.attackerItem, moveForCalc, physical, type, cfg);
    const fieldModifier = fieldDamageModifier(field, moveForCalc, defender, defenderAbility, cfg.defenderItem);
    const weatherModifier = weatherDamageModifier(weather, moveType);
    const wallModifier = wallDamageModifier(cfg.reflect, move.category, attackerAbility, defenderAbilityBase);
    const abilityFinalModifier = abilityFinalDamageModifier(attackerAbility, defenderAbility, moveForCalc, type, cfg, weather);
    const defensiveItemModifier = defensiveItemModifierForMove(cfg.defenderItem, moveForCalc, type, defenderAbility);
    const burnModifier = burnDamageModifier(cfg.attackerStatus, attackerAbility, moveForCalc, physical);
    const criticalModifier = criticalDamageModifier(cfg.criticalHit, attackerAbility);
    const stab = stabModifier(attacker, moveType, attackerAbility);
    const notes = [];

    const values = [];
    for (let random = 85; random <= 100; random += 1) {
      const total = fixedDamage
        ? (type === 0 ? 0 : fixedDamage)
        : powers.reduce((sum, power) => {
            const adjustedPower = Math.max(1, Math.floor(power * powerModifier));
            const base = Math.floor(Math.floor((((Math.floor((2 * LEVEL) / 5) + 2) * adjustedPower * Math.max(1, attackStat)) / Math.max(1, defenseStat)) / 50) + 2);
            if (type === 0) return sum;
            const damage = Math.floor(base * stab * type * itemModifier * weatherModifier * fieldModifier * wallModifier * abilityFinalModifier * defensiveItemModifier * burnModifier * criticalModifier * (random / 100));
            return sum + Math.max(1, damage);
          }, 0);
      values.push(total);
    }

    const moveMin = Math.min(...values);
    const moveMax = Math.max(...values);
    const hp = defenderStats.hp;
    const hazards = calcEntryHazards(defender, hp, defenderAbility, cfg.defenderItem, cfg.defenderHazards);
    const min = Math.min(hp, hazards.damage + moveMin);
    const max = Math.min(hp, hazards.damage + moveMax);
    if (moveType !== move.type) notes.push(`${move.type}→${moveType}`);
    if (selectedHits > 1) notes.push(`${selectedHits}hit`);
    if (parentBond) notes.push("おやこあい");
    if (cfg.criticalHit) notes.push(attackerAbility === "スナイパー" ? "急所+スナイパー" : "急所");
    if (ignoresDefenderAbility) notes.push("相手特性無視");
    if (weather !== "なし") notes.push(weather);
    if (field !== "なし") notes.push(field.replace("フィールド", "F"));
    if (hazards.damage > 0) notes.push(`設置${hazards.pct.toFixed(1)}%`);
    hazards.notes.forEach((note) => notes.push(note));

    return {
      ok: true,
      move: moveForCalc,
      min,
      max,
      moveMin,
      moveMax,
      entryDamage: hazards.damage,
      entryPct: hazards.pct,
      minPct: (min / hp) * 100,
      maxPct: (max / hp) * 100,
      hp,
      hits: selectedHits,
      power: rawPower || fixedDamage,
      fixedDamage,
      type,
      note: koNoteWithEntry(moveMin, moveMax, hp, type, notes, hazards.damage),
    };
  }

  function normalizeCalcConfig(config) {
    return {
      attackerName: config.attackerName,
      attackerNature: config.attackerNature || "まじめ",
      attackerItem: config.attackerItem || "",
      attackerAbility: config.attackerAbility || "",
      attackerEv: config.attackerEv || defaultEv(),
      attackerRank: config.attackerRank || defaultRank(),
      defenderName: config.defenderName,
      defenderNature: config.defenderNature || "まじめ",
      defenderItem: config.defenderItem || "",
      defenderAbility: config.defenderAbility || "",
      defenderEv: config.defenderEv || defaultEv(),
      defenderRank: config.defenderRank || defaultRank(),
      moves: config.moves || [],
      moveHits: config.moveHits || ["", "", "", ""],
      weather: config.weather || "なし",
      field: config.field || "なし",
      reflect: config.reflect || "なし",
      attackerStatus: config.attackerStatus || "なし",
      defenderStatus: config.defenderStatus || "なし",
      attackerHpCondition: config.attackerHpCondition || "通常",
      defenderHpCondition: config.defenderHpCondition || "通常",
      allyFainted: number(config.allyFainted, 0),
      criticalHit: Boolean(config.criticalHit),
      attackerMovedLast: Boolean(config.attackerMovedLast),
      targetSwitched: Boolean(config.targetSwitched),
      flashFireBoost: Boolean(config.flashFireBoost),
      chargedBoost: Boolean(config.chargedBoost),
      plusMinusActive: Boolean(config.plusMinusActive),
      unburdenActive: Boolean(config.unburdenActive),
      slowStartActive: Boolean(config.slowStartActive),
      eelBoostActive: Boolean(config.eelBoostActive),
      rivalry: config.rivalry || "なし",
      metronomeCount: clamp(number(config.metronomeCount, 1), 1, 6),
      comboFirst: clamp(number(config.comboFirst, 0), 0, 3),
      comboSecond: clamp(number(config.comboSecond, 1), 0, 3),
      defenderHazards: cloneHazards(config.defenderHazards),
    };
  }

  function applyBattleStatModifiers(stats, pokemon, role, cfg, move, ownAbility, otherAbility, weather, field) {
    const result = { ...stats };
    const item = role === "attacker" ? cfg.attackerItem : cfg.defenderItem;
    const status = role === "attacker" ? cfg.attackerStatus : cfg.defenderStatus;
    const ranks = role === "attacker" ? cfg.attackerRank : cfg.defenderRank;
    const ignoreDefenseRank = role === "defender" && ignoresDefenseRank(move.name);

    if (item === "でんきだま" && pokemon.name === "ピカチュウ") {
      result.atk = Math.floor(result.atk * 2);
      result.spa = Math.floor(result.spa * 2);
    }
    if (item === "こだわりスカーフ") result.spe = Math.floor(result.spe * 1.5);
    if (item === "くろいてっきゅう") result.spe = Math.floor(result.spe * 0.5);

    if (role === "attacker") {
      if (["ちからもち", "ヨガパワー"].includes(ownAbility)) result.atk = Math.floor(result.atk * 2);
      if (["はりきり", "ごりむちゅう"].includes(ownAbility)) result.atk = Math.floor(result.atk * 1.5);
      if (ownAbility === "こんじょう" && status !== "なし") result.atk = Math.floor(result.atk * 1.5);
      if (ownAbility === "ねつこうかん" && status === "やけど") result.atk = Math.floor(result.atk * 1.5);
      if (ownAbility === "サンパワー" && weather === "はれ") result.spa = Math.floor(result.spa * 1.5);
      if (ownAbility === "ハドロンエンジン" && field === "エレキフィールド") result.spa = Math.floor(result.spa * (4 / 3));
      if (ownAbility === "ひひいろのこどう" && weather === "はれ") result.atk = Math.floor(result.atk * (4 / 3));
      if (ownAbility === "フラワーギフト" && weather === "はれ") result.atk = Math.floor(result.atk * 1.5);
      if (["プラス", "マイナス"].includes(ownAbility) && cfg.plusMinusActive) result.spa = Math.floor(result.spa * 1.5);
      if (ownAbility === "スロースタート" && cfg.slowStartActive) {
        result.atk = Math.floor(result.atk * 0.5);
        result.spe = Math.floor(result.spe * 0.5);
      }
      if (ownAbility === "よわき" && isHpHalfOrLess(cfg.attackerHpCondition)) {
        result.atk = Math.floor(result.atk * 0.5);
        result.spa = Math.floor(result.spa * 0.5);
      }
    } else {
      if (ownAbility === "ふしぎなうろこ" && status !== "なし") result.def = Math.floor(result.def * 1.5);
      if (ownAbility === "くさのけがわ" && field === "グラスフィールド") result.def = Math.floor(result.def * 1.5);
      if (ownAbility === "フラワーギフト" && weather === "はれ") result.spd = Math.floor(result.spd * 1.5);
      if (ownAbility === "ファーコート") result.def = Math.floor(result.def * 2);
    }

    applyHighestStatBoost(result, ownAbility, item, weather, field);

    if (weather === "あめ" && ownAbility === "すいすい") result.spe = Math.floor(result.spe * 2);
    if (weather === "はれ" && ownAbility === "ようりょくそ") result.spe = Math.floor(result.spe * 2);
    if (weather === "すなあらし" && ownAbility === "すなかき") result.spe = Math.floor(result.spe * 2);
    if (weather === "ゆき" && ownAbility === "ゆきかき") result.spe = Math.floor(result.spe * 2);
    if (field === "エレキフィールド" && ownAbility === "サーフテール") result.spe = Math.floor(result.spe * 2);
    if (ownAbility === "はやあし" && status !== "なし") result.spe = Math.floor(result.spe * 1.5);
    if (ownAbility === "かるわざ" && cfg.unburdenActive) result.spe = Math.floor(result.spe * 2);

    const eelBoostStat = ownAbility === "うなぎのぼり" && cfg.eelBoostActive ? highestBattleStat(result) : "";

    RANK_KEYS.forEach((stat) => {
      if (ignoreDefenseRank && ["def", "spd"].includes(stat.key)) return;
      let stage = number(ranks?.[stat.key], 0);
      if (stat.key === eelBoostStat) stage += 1;
      if (ownAbility === "たんじゅん") stage *= 2;
      if (role === "attacker" && otherAbility === "てんねん" && ["atk", "spa"].includes(stat.key)) stage = 0;
      if (role === "defender" && otherAbility === "てんねん" && ["def", "spd"].includes(stat.key)) stage = 0;
      if (cfg.criticalHit && role === "attacker" && ["atk", "spa"].includes(stat.key) && stage < 0) stage = 0;
      if (cfg.criticalHit && role === "defender" && ["def", "spd"].includes(stat.key) && stage > 0) stage = 0;
      result[stat.key] = Math.max(1, Math.floor(result[stat.key] * rankModifier(stage)));
    });

    return result;
  }

  function rankModifier(stage) {
    const value = clamp(number(stage, 0), -6, 6);
    return value >= 0 ? (2 + value) / 2 : 2 / (2 - value);
  }

  function applyRuinAttackModifier(value, physical, defenderAbility) {
    if (physical && defenderAbility === "わざわいのおふだ") return Math.floor(value * 0.75);
    if (!physical && defenderAbility === "わざわいのうつわ") return Math.floor(value * 0.75);
    return value;
  }

  function applyRuinDefenseModifier(value, physical, attackerAbility) {
    if (physical && attackerAbility === "わざわいのつるぎ") return Math.floor(value * 0.75);
    if (!physical && attackerAbility === "わざわいのたま") return Math.floor(value * 0.75);
    return value;
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

  function resolvePower(move, attacker, defender, attackerStats, defenderStats, cfg, weather, field, attackerAbility, defenderAbility) {
    const name = move.name;
    if (name === "おはかまいり") return 50 + 50 * clamp(number(cfg.allyFainted, 0), 0, 5);
    if (name === "はたきおとす" && cfg.defenderItem) return Math.floor((move.power || 65) * 1.5);
    if (name === "だいちのはどう" && field !== "なし" && isGrounded(attacker, attackerAbility, cfg.attackerItem)) return 100;
    if (name === "ライジングボルト" && field === "エレキフィールド" && isGrounded(defender, defenderAbility, cfg.defenderItem)) return (move.power || 70) * 2;
    if (name === "ワイドフォース" && field === "サイコフィールド" && isGrounded(defender, defenderAbility, cfg.defenderItem)) return Math.floor((move.power || 80) * 1.5);
    if (name === "ミストバースト" && field === "ミストフィールド" && isGrounded(attacker, attackerAbility, cfg.attackerItem)) return Math.floor((move.power || 100) * 1.5);
    if (name === "アイアンローラー" && field === "なし") return 0;
    if (["くさむすび", "けたぐり"].includes(name)) return weightPower(effectiveWeight(defender.weight, defenderAbility));
    if (["ヒートスタンプ", "ヘビーボンバー"].includes(name)) return heavyPower(effectiveWeight(attacker.weight, attackerAbility), effectiveWeight(defender.weight, defenderAbility));
    if (name === "ジャイロボール") return Math.min(150, Math.max(1, Math.floor((25 * defenderStats.spe) / Math.max(1, attackerStats.spe)) + 1));
    if (name === "エレキボール") return electroBallPower(attackerStats.spe, defenderStats.spe);
    if (name === "ウェザーボール") return weather !== "なし" ? 100 : 50;
    if (name === "アクロバット") return cfg.attackerItem ? 55 : 110;
    if (name === "からげんき") return cfg.attackerStatus !== "なし" ? 140 : 70;
    if (name === "ベノムショック") return ["どく"].includes(cfg.defenderStatus) ? 130 : 65;
    if (name === "たたりめ") return cfg.defenderStatus !== "なし" ? 130 : 65;
    if (["しおふき", "ふんか", "ドラゴンエナジー"].includes(name)) {
      if (cfg.attackerHpCondition === "満タン") return 150;
      if (cfg.attackerHpCondition === "1/3以下") return 50;
      return move.power || 100;
    }
    if (["きしかいせい", "じたばた"].includes(name)) {
      if (cfg.attackerHpCondition === "1/3以下") return 100;
      return 20;
    }
    if (["ソーラービーム", "ソーラーブレード"].includes(name) && attackerAbility !== "メガソーラー" && ["あめ", "すなあらし", "ゆき"].includes(weather)) {
      return Math.max(1, Math.floor((move.power || 120) / 2));
    }
    return move.power || 0;
  }

  function resolveMoveType(move, ability, weather, field = "なし", attacker = null, item = "") {
    if (move.name === "ウェザーボール") {
      if (weather === "はれ") return "ほのお";
      if (weather === "あめ") return "みず";
      if (weather === "ゆき") return "こおり";
      if (weather === "すなあらし") return "いわ";
    }
    if (move.name === "だいちのはどう" && attacker && field !== "なし" && isGrounded(attacker, ability, item)) {
      const terrainTypes = {
        エレキフィールド: "でんき",
        グラスフィールド: "くさ",
        サイコフィールド: "エスパー",
        ミストフィールド: "フェアリー",
      };
      return terrainTypes[field] || move.type;
    }
    if (ability === "ノーマルスキン") return "ノーマル";
    if (move.type !== "ノーマル") return move.type;
    const skinTypes = {
      エレキスキン: "でんき",
      スカイスキン: "ひこう",
      フェアリースキン: "フェアリー",
      フリーズスキン: "こおり",
      ドラゴンスキン: "ドラゴン",
    };
    return skinTypes[ability] || move.type;
  }

  function effectiveWeather(selected, attackerAbility, defenderAbility) {
    const abilities = [attackerAbility, defenderAbility];
    if (abilities.some((ability) => ["エアロック", "ノーてんき"].includes(ability))) return "なし";
    if (selected && selected !== "なし") return selected;
    if (attackerAbility === "メガソーラー") return "はれ";
    if (abilities.some((ability) => ["ひでり", "ひひいろのこどう"].includes(ability))) return "はれ";
    if (abilities.includes("あめふらし")) return "あめ";
    if (abilities.includes("すなおこし")) return "すなあらし";
    if (abilities.includes("ゆきふらし")) return "ゆき";
    return "なし";
  }

  function effectiveField(selected, attackerAbility, defenderAbility) {
    if (selected && selected !== "なし") return selected;
    const abilities = [attackerAbility, defenderAbility];
    if (abilities.some((ability) => ["エレキメイカー", "ハドロンエンジン"].includes(ability))) return "エレキフィールド";
    if (abilities.some((ability) => ["グラスメイカー", "こぼれダネ"].includes(ability))) return "グラスフィールド";
    if (abilities.includes("サイコメイカー")) return "サイコフィールド";
    if (abilities.includes("ミストメイカー")) return "ミストフィールド";
    return "なし";
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

  function hitOptionsForMove(move) {
    if (!move) return [1];
    const normalized = String(move.hits || "1").normalize("NFKC").replace(/[~～ー−]/g, "-");
    if (move.name === "ネズミざん") return range(1, 10);
    const nums = normalized.match(/\d+/g)?.map((value) => number(value, 1)) || [];
    if (nums.length >= 2 && nums[1] > nums[0]) return range(nums[0], nums[1]);
    const hit = nums[0] || 1;
    if (hit > 1 && /途中で外れる|1回目|2回目|3回目/.test(move.description || "")) return range(1, hit);
    return [hit];
  }

  function resolveHits(move, selected) {
    const options = hitOptionsForMove(move);
    const requested = number(selected, options[0] || 1);
    return options.includes(requested) ? requested : options[0] || 1;
  }

  function resolvePowerList(move, power, hits) {
    if (move.name === "トリプルアクセル") return [20, 40, 60].slice(0, hits);
    if (move.name === "トリプルキック") return [10, 20, 30].slice(0, hits);
    return Array.from({ length: Math.max(1, hits) }, () => power);
  }

  function range(min, max) {
    const list = [];
    for (let value = min; value <= max; value += 1) list.push(value);
    return list;
  }

  function effectiveness(moveType, defender, attackerAbility = "", defenderAbility = "") {
    if (["ふゆう", "うなぎのぼり"].includes(defenderAbility) && moveType === "じめん") return 0;
    if (["ちくでん", "でんきエンジン", "ひらいしん"].includes(defenderAbility) && moveType === "でんき") return 0;
    if (["ちょすい", "よびみず", "かんそうはだ"].includes(defenderAbility) && moveType === "みず") return 0;
    if (["もらいび", "こんがりボディ"].includes(defenderAbility) && moveType === "ほのお") return 0;
    if (defenderAbility === "そうしょく" && moveType === "くさ") return 0;
    if (defenderAbility === "どしょく" && moveType === "じめん") return 0;
    const chart = TYPE_CHART[moveType] || {};
    return [defender.type1, defender.type2].filter(Boolean).reduce((value, type) => {
      if (["きもったま", "しんがん"].includes(attackerAbility) && type === "ゴースト" && ["ノーマル", "かくとう"].includes(moveType)) return value;
      return value * (chart[type] ?? 1);
    }, 1);
  }

  function stabModifier(attacker, moveType, ability) {
    const hasStab = [attacker.type1, attacker.type2].includes(moveType);
    if (!hasStab) return 1;
    return ability === "てきおうりょく" ? 2 : 1.5;
  }

  function itemDamageModifier(item, move, physical, typeEffect = 1, cfg = {}) {
    if (!item) return 1;
    let modifier = 1;
    if (item === "こだわりハチマキ" && physical) modifier *= 1.5;
    if (item === "こだわりメガネ" && !physical) modifier *= 1.5;
    if (item === "いのちのたま") modifier *= 1.3;
    if (item === "たつじんのおび" && typeEffect > 1) modifier *= 1.2;
    if (item === "ちからハチマキ" && physical) modifier *= 1.1;
    if (item === "ものしりメガネ" && !physical) modifier *= 1.1;
    if (item === "メトロノーム") modifier *= metronomeModifier(cfg.metronomeCount);
    const boostedType = boostedTypeByItem(item);
    if (boostedType === move.type) modifier *= 1.2;
    return modifier;
  }

  function boostedTypeByItem(item) {
    const row = getTool(item);
    const text = row?.["効果"] || "";
    const match = text.match(new RegExp(`(${Object.keys(TYPE_CLASS).join("|")})タイプの技の威力が1\\.2倍`));
    return match ? match[1] : "";
  }

  function defensiveItemModifierForMove(item, move, typeEffect, defenderAbility) {
    if (!item || typeEffect === 0) return 1;
    const row = getTool(item);
    const text = row?.["効果"] || "";
    let targetType = "";
    let superEffectiveOnly = true;
    const normalMatch = text.match(/ノーマルタイプの技を受けた時ダメージが半減/);
    if (normalMatch) {
      targetType = "ノーマル";
      superEffectiveOnly = false;
    } else {
      const match = text.match(new RegExp(`効果バツグンの(${Object.keys(TYPE_CLASS).join("|")})タイプの技を受けた時ダメージ[がを]半減`));
      if (match) targetType = match[1];
    }
    if (!targetType || targetType !== move.type) return 1;
    if (superEffectiveOnly && typeEffect <= 1) return 1;
    return defenderAbility === "じゅくせい" ? 0.25 : 0.5;
  }

  function getTool(item) {
    return state.tools.find((tool) => tool["名前"] === item) || null;
  }

  function weatherDamageModifier(weather, type) {
    if (weather === "はれ" && type === "ほのお") return 1.5;
    if (weather === "はれ" && type === "みず") return 0.5;
    if (weather === "あめ" && type === "みず") return 1.5;
    if (weather === "あめ" && type === "ほのお") return 0.5;
    return 1;
  }

  function fieldDamageModifier(field, move, defender, defenderAbility, defenderItem) {
    const defenderGrounded = isGrounded(defender, defenderAbility, defenderItem);
    if (field === "エレキフィールド" && move.type === "でんき" && defenderGrounded) return 1.3;
    if (field === "グラスフィールド" && move.type === "くさ" && defenderGrounded) return 1.3;
    if (field === "サイコフィールド" && move.type === "エスパー" && defenderGrounded) return 1.3;
    if (field === "グラスフィールド" && ["じしん", "じならし", "マグニチュード"].includes(move.name)) return 0.5;
    if (field === "ミストフィールド" && move.type === "ドラゴン" && defenderGrounded) return 0.5;
    return 1;
  }

  function wallDamageModifier(wall, category, attackerAbility = "", defenderAbility = "") {
    if ([attackerAbility, defenderAbility].includes("バリアフリー")) return 1;
    if (wall === "リフレクター" && category === "物理") return 0.5;
    if (wall === "ひかりのかべ" && category === "特殊") return 0.5;
    return 1;
  }

  function attackerPowerModifier(ability, move, power, typeEffect, cfg, weather, field) {
    let modifier = 1;
    if (ability === "テクニシャン" && power <= 60) modifier *= 1.5;
    if (ability === "すいほう" && move.type === "みず") modifier *= 2;
    if (ability === "ほのおのたてがみ" && move.type === "ほのお") modifier *= 1.5;
    if (ability === "いわはこび" && move.type === "いわ") modifier *= 1.5;
    if (["はがねつかい", "はがねのせいしん"].includes(ability) && move.type === "はがね") modifier *= 1.5;
    if (ability === "トランジスタ" && move.type === "でんき") modifier *= 1.3;
    if (ability === "りゅうのあぎと" && move.type === "ドラゴン") modifier *= 1.5;
    if (ability === "すなのちから" && weather === "すなあらし" && ["じめん", "いわ", "はがね"].includes(move.type)) modifier *= 1.3;
    if (ability === "ダークオーラ" && move.type === "あく") modifier *= 4 / 3;
    if (ability === "フェアリーオーラ" && move.type === "フェアリー") modifier *= 4 / 3;
    if (ability === "ブレインフォース" && typeEffect > 1) modifier *= 1.25;
    if (["エレキスキン", "スカイスキン", "フェアリースキン", "フリーズスキン", "ドラゴンスキン", "ノーマルスキン"].includes(ability)) modifier *= 1.2;
    if (ability === "てつのこぶし" && isPunchMove(move.name)) modifier *= 1.2;
    if (ability === "がんじょうあご" && isBiteMove(move.name)) modifier *= 1.5;
    if (ability === "きれあじ" && isCuttingMove(move.name)) modifier *= 1.5;
    if (ability === "メガランチャー" && isPulseMove(move.name)) modifier *= 1.5;
    if (ability === "パンクロック" && isSoundMove(move.name)) modifier *= 1.3;
    if (ability === "すてみ" && isRecoilMove(move.name)) modifier *= 1.2;
    if (ability === "かたいツメ" && isContactMove(move.name)) modifier *= 1.3;
    if (ability === "ちからずく" && hasAdditionalEffect(move)) modifier *= 1.3;
    if (ability === "そうだいしょう") modifier *= 1 + 0.1 * clamp(number(cfg.allyFainted, 0), 0, 5);
    if (ability === "どくぼうそう" && cfg.attackerStatus === "どく" && move.category === "物理") modifier *= 1.5;
    if (ability === "ねつぼうそう" && cfg.attackerStatus === "やけど" && move.category === "特殊") modifier *= 1.5;
    if (cfg.attackerHpCondition === "1/3以下") {
      if (ability === "もうか" && move.type === "ほのお") modifier *= 1.5;
      if (ability === "げきりゅう" && move.type === "みず") modifier *= 1.5;
      if (ability === "しんりょく" && move.type === "くさ") modifier *= 1.5;
      if (ability === "むしのしらせ" && move.type === "むし") modifier *= 1.5;
    }
    if (ability === "アナライズ" && cfg.attackerMovedLast) modifier *= 1.3;
    if (ability === "はりこみ" && cfg.targetSwitched) modifier *= 2;
    if (ability === "もらいび" && cfg.flashFireBoost && move.type === "ほのお") modifier *= 1.5;
    if (["でんきにかえる", "ふうりょくでんき"].includes(ability) && cfg.chargedBoost && move.type === "でんき") modifier *= 2;
    if (ability === "とうそうしん") {
      if (cfg.rivalry === "同性") modifier *= 1.25;
      if (cfg.rivalry === "異性") modifier *= 0.75;
    }
    return modifier;
  }

  function abilityFinalDamageModifier(attackerAbility, defenderAbility, move, typeEffect, cfg, weather) {
    let modifier = 1;
    if (["ハードロック", "フィルター", "プリズムアーマー"].includes(defenderAbility) && typeEffect > 1) modifier *= 0.75;
    if (defenderAbility === "あついしぼう" && ["ほのお", "こおり"].includes(move.type)) modifier *= 0.5;
    if (defenderAbility === "たいねつ" && move.type === "ほのお") modifier *= 0.5;
    if (defenderAbility === "きよめのしお" && move.type === "ゴースト") modifier *= 0.5;
    if (defenderAbility === "すいほう" && move.type === "ほのお") modifier *= 0.5;
    if (defenderAbility === "かんそうはだ" && move.type === "ほのお") modifier *= 1.25;
    if (defenderAbility === "もふもふ" && move.type === "ほのお") modifier *= 2;
    if (defenderAbility === "もふもふ" && isContactMove(move.name)) modifier *= 0.5;
    if (defenderAbility === "パンクロック" && isSoundMove(move.name)) modifier *= 0.5;
    if (defenderAbility === "こおりのりんぷん" && move.category === "特殊") modifier *= 0.5;
    if (["マルチスケイル", "ファントムガード"].includes(defenderAbility) && cfg.defenderHpCondition === "満タン") modifier *= 0.5;
    if (attackerAbility === "いろめがね" && typeEffect > 0 && typeEffect < 1) modifier *= 2;
    if (defenderAbility === "ダークオーラ" && move.type === "あく") modifier *= hasAuraBreak(attackerAbility, defenderAbility) ? 0.75 : 4 / 3;
    if (defenderAbility === "フェアリーオーラ" && move.type === "フェアリー") modifier *= hasAuraBreak(attackerAbility, defenderAbility) ? 0.75 : 4 / 3;
    if (hasAuraBreak(attackerAbility, defenderAbility)) {
      if (attackerAbility === "ダークオーラ" && move.type === "あく") modifier *= 0.75 / (4 / 3);
      if (attackerAbility === "フェアリーオーラ" && move.type === "フェアリー") modifier *= 0.75 / (4 / 3);
    }
    return modifier;
  }

  function burnDamageModifier(status, ability, move, physical) {
    if (status !== "やけど" || !physical) return 1;
    if (["こんじょう", "からげんき", "ねつこうかん"].includes(ability) || move.name === "からげんき") return 1;
    return 0.5;
  }

  function isReflectMove(name) {
    return ["カウンター", "ミラーコート", "メタルバースト"].includes(name);
  }

  function ignoresTargetAbility(attackerAbility, move) {
    if (["かたやぶり", "ターボブレイズ", "テラボルテージ"].includes(attackerAbility)) return true;
    if (["メテオドライブ", "シャドーレイ", "フォトンゲイザー"].includes(move?.name)) return true;
    return false;
  }

  function isAlwaysCriticalMove(name) {
    return ["こおりのいぶき", "やまあらし", "すいりゅうれんだ", "あんこくきょうだ", "トリックフラワー"].includes(name);
  }

  function criticalDamageModifier(active, attackerAbility) {
    if (!active) return 1;
    return attackerAbility === "スナイパー" ? 2.25 : 1.5;
  }

  function isFixedMultiHitMove(move) {
    return hitOptionsForMove(move).some((hit) => hit > 1);
  }

  function isHpHalfOrLess(condition) {
    return condition === "1/2以下" || condition === "1/3以下";
  }

  function metronomeModifier(count) {
    const value = clamp(number(count, 1), 1, 6);
    if (value <= 1) return 1;
    return Math.min(2, 1 + 0.2 * (value - 1));
  }

  function effectiveWeight(weight, ability) {
    let result = number(weight, 0);
    if (ability === "ヘヴィメタル") result *= 2;
    if (ability === "ライトメタル") result *= 0.5;
    return Math.max(0.1, result);
  }

  function highestBattleStat(stats) {
    const order = ["atk", "def", "spa", "spd", "spe"];
    return order.reduce((best, key) => (stats[key] > stats[best] ? key : best), order[0]);
  }

  function applyHighestStatBoost(stats, ability, item, weather, field) {
    const active = (ability === "こだいかっせい" && weather === "はれ") || (ability === "クォークチャージ" && field === "エレキフィールド");
    if (!active) return;
    const top = highestBattleStat(stats);
    stats[top] = Math.floor(stats[top] * (top === "spe" ? 1.5 : 1.3));
  }

  function hasAuraBreak(attackerAbility, defenderAbility) {
    return [attackerAbility, defenderAbility].includes("オーラブレイク");
  }
  const PUNCH_MOVES = new Set(["かみなりパンチ", "ほのおのパンチ", "れいとうパンチ", "きあいパンチ", "ドレインパンチ", "マッハパンチ", "バレットパンチ", "シャドーパンチ", "アームハンマー", "コメットパンチ", "メガトンパンチ", "れんぞくパンチ", "ばくれつパンチ", "グロウパンチ", "ジェットパンチ", "アイスハンマー", "スカイアッパー", "ダブルパンツァー", "あんこくきょうだ", "すいりゅうれんだ", "ぶちかまし", "ふんどのこぶし"]);
  const BITE_MOVES = new Set(["かみつく", "かみくだく", "ほのおのキバ", "かみなりのキバ", "こおりのキバ", "どくどくのキバ", "サイコファング", "ひっさつまえば", "エラがみ", "くらいつく"]);
  const CUTTING_MOVES = new Set(["アクアカッター", "エアカッター", "エアスラッシュ", "きりさく", "クロスポイズン", "サイコカッター", "サイコブレイド", "シェルブレード", "シザークロス", "しんぴのつるぎ", "せいなるつるぎ", "ソーラーブレード", "タキオンカッター", "つじぎり", "つばめがえし", "ドゲザン", "ネズミざん", "はっぱカッター", "パワフルエッジ", "ひけん・ちえなみ", "むねんのつるぎ", "リーフブレード", "れんぞくぎり"]);
  const PULSE_MOVES = new Set(["あくのはどう", "はどうだん", "みずのはどう", "りゅうのはどう", "だいちのはどう", "こんげんのはどう"]);
  const SOUND_MOVES = new Set(["いにしえのうた", "いびき", "うたかたのアリア", "エコーボイス", "さわぐ", "スケイルノイズ", "チャームボイス", "バークアウト", "ハイパーボイス", "ばくおんぱ", "むしのさざめき", "りんしょう", "オーバードライブ", "フレアソング", "ぶきみなじゅもん", "みわくのボイス", "サイコノイズ"]);
  const RECOIL_MOVES = new Set(["アフロブレイク", "ウッドハンマー", "じごくぐるま", "すてみタックル", "とっしん", "とびげり", "とびひざげり", "もろはのずつき", "フレアドライブ", "ブレイブバード", "ボルテッカー", "ワイルドボルト", "ウェーブタックル", "サンダーダイブ"]);
  const CONTACT_MOVES = new Set([...PUNCH_MOVES, ...BITE_MOVES, ...CUTTING_MOVES, ...RECOIL_MOVES, "げきりん", "ドラゴンクロー", "シャドークロー", "アクアテール", "アイアンヘッド", "じゃれつく", "とんぼがえり", "インファイト", "けたぐり", "かわらわり",  "かみなりパンチ", "フレアドライブ"]);

  function isPunchMove(name) { return PUNCH_MOVES.has(name); }
  function isBiteMove(name) { return BITE_MOVES.has(name); }
  function isCuttingMove(name) { return CUTTING_MOVES.has(name); }
  function isPulseMove(name) { return PULSE_MOVES.has(name); }
  function isSoundMove(name) { return SOUND_MOVES.has(name); }
  function isRecoilMove(name) { return RECOIL_MOVES.has(name); }
  function isContactMove(name) { return CONTACT_MOVES.has(name); }

  function hasAdditionalEffect(move) {
    const text = move.description || "";
    if (/自分の.*下げる|反動|次のターン/.test(text)) return false;
    return /\d+[%％]の確率|相手を.*状態|ひるませる|下げる/.test(text);
  }

  function defaultHazards() {
    return { stealthRock: false, spikes: 0 };
  }

  function cloneHazards(hazards = {}) {
    return { stealthRock: Boolean(hazards.stealthRock), spikes: clamp(number(hazards.spikes, 0), 0, 3) };
  }

  function isGrounded(pokemon, ability = "", item = "") {
    if (!pokemon) return true;
    if (item === "くろいてっきゅう") return true;
    if (item === "ふうせん") return false;
    if (["ふゆう", "うなぎのぼり"].includes(ability)) return false;
    if ([pokemon.type1, pokemon.type2].includes("ひこう")) return false;
    return true;
  }

  function calcEntryHazards(defender, hp, defenderAbility = "", defenderItem = "", hazards = defaultHazards()) {
    const active = cloneHazards(hazards);
    const notes = [];
    if (defenderItem === "あつぞこブーツ" || defenderAbility === "マジックガード") {
      if (active.stealthRock || active.spikes) notes.push(defenderItem === "あつぞこブーツ" ? "ブーツで設置無効" : "マジックガードで設置無効");
      return { damage: 0, pct: 0, notes };
    }
    let damage = 0;
    if (active.stealthRock) {
      const rockEffect = effectiveness("いわ", defender, "", defenderAbility);
      const rockDamage = rockEffect === 0 ? 0 : Math.max(1, Math.floor((hp / 8) * rockEffect));
      damage += rockDamage;
    }
    const spikesLayers = clamp(number(active.spikes, 0), 0, 3);
    if (spikesLayers > 0) {
      if (isGrounded(defender, defenderAbility, defenderItem)) {
        const rates = { 1: 1 / 8, 2: 1 / 6, 3: 1 / 4 };
        damage += Math.max(1, Math.floor(hp * rates[spikesLayers]));
      } else {
        notes.push("まきびし無効");
      }
    }
    damage = Math.min(hp, damage);
    return { damage, pct: (damage / hp) * 100, notes };
  }

  function fixedDamageForMove(move) {
    if (["ナイトヘッド", "ちきゅうなげ"].includes(move.name)) return LEVEL;
    return 0;
  }

  function ignoresDefenseRank(name) {
    return ["せいなるつるぎ", "DDラリアット", "なしくずし"].includes(name);
  }

  function koNoteWithEntry(moveMin, moveMax, hp, type, notes = [], entryDamage = 0) {
    if (type === 0) return ["無効", ...notes].join(" / ");
    const remaining = Math.max(1, hp - entryDamage);
    const minHits = Math.max(1, Math.ceil(remaining / Math.max(1, moveMax)));
    const maxHits = Math.max(1, Math.ceil(remaining / Math.max(1, moveMin)));
    const rangeText = minHits === maxHits ? `${minHits}発` : `${minHits}-${maxHits}発`;
    const typeText = type > 1 ? "抜群" : type < 1 ? "半減" : "等倍";
    return [rangeText, typeText, ...notes].join(" / ");
  }

  function koNote(min, max, hp, type, hits, notes = []) {
    if (type === 0) return ["無効", ...notes].join(" / ");
    const minHits = Math.max(1, Math.ceil(hp / Math.max(1, max)));
    const maxHits = Math.max(1, Math.ceil(hp / Math.max(1, min)));
    const rangeText = minHits === maxHits ? `${minHits}発` : `${minHits}-${maxHits}発`;
    const typeText = type > 1 ? "抜群" : type < 1 ? "半減" : "等倍";
    return [rangeText, typeText, ...notes].join(" / ");
  }

  function calcComboDamage(results) {
    const first = clamp(number(state.calc.comboFirst, 0), 0, 3);
    const second = clamp(number(state.calc.comboSecond, 1), 0, 3);
    const a = results[first];
    const b = results[second];
    if (!a?.ok || !b?.ok || !a.hp) {
      return { ok: false, label: "—", note: "2つの技を選ぶと、設置技込みで倒せるか確認できます" };
    }
    const hp = a.hp;
    const entry = Math.max(a.entryDamage || 0, b.entryDamage || 0);
    const min = Math.min(hp, entry + a.moveMin + b.moveMin);
    const max = Math.min(hp, entry + a.moveMax + b.moveMax);
    const minPct = (min / hp) * 100;
    const maxPct = (max / hp) * 100;
    const koText = min >= hp ? "確定で倒せる" : max >= hp ? "乱数で倒せる" : "倒せない";
    const moveNames = `${a.move?.name || first + 1} + ${b.move?.name || second + 1}`;
    const detail = entry > 0 ? `技${a.moveMin}-${a.moveMax} + 技${b.moveMin}-${b.moveMax} + 設置${entry}` : `技${a.moveMin}-${a.moveMax} + 技${b.moveMin}-${b.moveMax}`;
    return {
      ok: true,
      label: `${minPct.toFixed(1)} ~ ${maxPct.toFixed(1)}% / ${koText}`,
      note: `${moveNames} / ${detail}`,
    };
  }

  function resultLabel(result) {
    if (!result || !result.ok) return "—";
    return `${result.minPct.toFixed(1)} ~ ${result.maxPct.toFixed(1)}%`;
  }

  function resultNote(result) {
    if (!result) return "";
    if (!result.ok) return result.reason || "";
    const detail = result.entryDamage > 0 ? `技${result.moveMin}-${result.moveMax}+設置${result.entryDamage}` : `${result.min}-${result.max}`;
    return `${result.note} / ${detail}`;
  }

  function displayPower(move) {
    if (move.power) return move.power;
    if (["くさむすび", "けたぐり", "ヒートスタンプ", "ヘビーボンバー", "ジャイロボール", "エレキボール", "おはかまいり", "ライジングボルト", "ワイドフォース", "だいちのはどう", "ミストバースト", "はたきおとす"].includes(move.name)) return "可変";
    return "—";
  }

  function getDexFamily(name) {
    if (!name) return [];
    const baseName = state.baseByMega.get(name) || name;
    const names = [baseName, ...(state.megaByBase.get(baseName) || []).map((entry) => entry.megaName)];
    return unique(names).filter((pokeName) => state.pokemonByName.has(pokeName) && isPokemonSelectable(pokeName));
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

  function defaultAbility(pokemonName) {
    const options = getAbilityOptions(pokemonName);
    return options[0] || "";
  }

  function applyPokemonPreset(mode, name, options = {}) {
    const keepMoves = options.keepMoves === true;
    const targetIsAttacker = mode === "build" || mode === "calc-attacker";
    const setBuild = (patch) => Object.assign(state.build, patch);
    const setCalcAttacker = (patch) => {
      if (patch.nature !== undefined) state.calc.attackerNature = patch.nature;
      if (patch.item !== undefined) state.calc.attackerItem = patch.item;
      if (patch.ability !== undefined) state.calc.attackerAbility = patch.ability;
      if (patch.ev !== undefined) state.calc.attackerEv = cloneEv(patch.ev);
      if (patch.moves !== undefined) state.calc.moves = patch.moves.slice(0, 4);
      if (patch.moveHits !== undefined) state.calc.moveHits = patch.moveHits.slice(0, 4);
    };
    const setCalcDefender = (patch) => {
      if (patch.nature !== undefined) state.calc.defenderNature = patch.nature;
      if (patch.item !== undefined) state.calc.defenderItem = patch.item;
      if (patch.ability !== undefined) state.calc.defenderAbility = patch.ability;
      if (patch.ev !== undefined) state.calc.defenderEv = cloneEv(patch.ev);
    };
    const apply = mode === "build" ? setBuild : mode === "calc-attacker" ? setCalcAttacker : setCalcDefender;

    const patch = {};
    const rankPreset = rankingPresetForPokemon(name);
    if (rankPreset.nature) patch.nature = rankPreset.nature;
    if (rankPreset.ev) patch.ev = rankPreset.ev;

    if (state.baseByMega.has(name)) {
      const stone = megaStoneForPokemon(name);
      if (stone) patch.item = stone;
      patch.ability = defaultAbility(name);
    }

    const special = specialMegaPreset(name);
    if (special) {
      if (special.item) patch.item = special.item;
      if (special.ability) patch.ability = special.ability;
      if (targetIsAttacker) {
        patch.nature = special.nature;
        patch.ev = cloneEv(special.ev);
        if (!keepMoves) {
          patch.moves = special.moves.slice(0, 4);
          patch.moveHits = ["", "", "", ""];
        }
      } else {
        patch.nature = special.nature;
        patch.ev = cloneEv(special.ev);
      }
    } else if (targetIsAttacker && !keepMoves && rankPreset.moves?.length) {
      patch.moves = rankPreset.moves.slice(0, 4);
      patch.moveHits = ["", "", "", ""];
    }

    apply(patch);
  }

  function rankingPresetForPokemon(name) {
    const rank = getRankingForPokemon(name);
    const moves = getMoves(name);
    return {
      nature: parseRankNature(rank),
      ev: parseRankSpread(rank),
      moves: getRankedMoveNames(rank).map((moveName) => findMoveInList(moves, moveName) || findAnyMove(moveName)).filter(Boolean).map((move) => move.name),
    };
  }

  function specialMegaPreset(name) {
    const presets = {
      メガリザードンX: { item: "リザードナイトX", nature: "いじっぱり", ev: evSpread("AS32H2"), category: "物理" },
      メガリザードンY: { item: "リザードナイトY", nature: "おくびょう", ev: evSpread("CS32H2"), category: "特殊" },
      メガライチュウX: { item: "ライチュウナイトＸ", nature: "いじっぱり", ev: evSpread("AS32H2"), category: "物理" },
      メガライチュウY: { item: "ライチュウナイトＹ", nature: "おくびょう", ev: evSpread("CS32H2"), category: "特殊" },
    };
    const preset = presets[name];
    if (!preset) return null;
    const moves = suggestMovesByCategory(name, preset.category);
    return { ...preset, ability: defaultAbility(name), moves };
  }

  function suggestMovesByCategory(name, category) {
    const moves = getMoves(name);
    const rank = getRankingForPokemon(name);
    const ranked = getRankedMoveNames(rank).map((moveName) => findMoveInList(moves, moveName) || findAnyMove(moveName)).filter(Boolean);
    const selected = [];
    const add = (move) => {
      if (!move || move.category !== category) return;
      if (!selected.some((value) => moveKey(value) === moveKey(move.name))) selected.push(move.name);
    };
    ranked.forEach(add);
    moves.filter((move) => move.candidate).forEach(add);
    moves.forEach(add);
    ranked.forEach((move) => {
      if (move.category !== "変化" && !selected.some((value) => moveKey(value) === moveKey(move.name))) selected.push(move.name);
    });
    moves.forEach((move) => {
      if (move.category !== "変化" && !selected.some((value) => moveKey(value) === moveKey(move.name))) selected.push(move.name);
    });
    return selected.slice(0, 4);
  }

  function parseRankNature(rank) {
    const raw = rank?.natures?.[0];
    if (!raw) return "";
    const stripped = stripUsageText(raw);
    return NATURES.find((nature) => stripped.startsWith(nature.name))?.name || "";
  }

  function parseRankSpread(rank) {
    const raw = rank?.spreads?.[0];
    if (!raw) return null;
    const values = String(raw).match(/\d+/g)?.slice(0, 6).map((value) => clamp(number(value, 0), 0, POINT_MAX));
    if (!values || values.length < 6) return null;
    return { hp: values[0], atk: values[1], def: values[2], spa: values[3], spd: values[4], spe: values[5] };
  }

  function evSpread(code) {
    if (code === "AS32H2") return { hp: 2, atk: 32, def: 0, spa: 0, spd: 0, spe: 32 };
    if (code === "CS32H2") return { hp: 2, atk: 0, def: 0, spa: 32, spd: 0, spe: 32 };
    return defaultEv();
  }

  function suggestCharizardYMoves() {
    const moves = getMoves("メガリザードンY");
    const priority = ["ソーラービーム", "かえんほうしゃ", "だいもんじ", "エアスラッシュ", "ぼうふう", "オーバーヒート"];
    const selected = [];
    priority.forEach((name) => {
      const move = findMoveInList(moves, name);
      if (move && !selected.includes(move.name)) selected.push(move.name);
    });
    getRankedMoveNames(getRankingForPokemon("メガリザードンY")).forEach((name) => {
      const move = findMoveInList(moves, name);
      if (move && move.category === "特殊" && !selected.includes(move.name)) selected.push(move.name);
    });
    moves.forEach((move) => {
      if (move.category === "特殊" && !selected.includes(move.name)) selected.push(move.name);
    });
    return selected.slice(0, 4);
  }

  function megaStoneForPokemon(name) {
    const custom = {
      メガリザードンX: "リザードナイトX",
      メガリザードンY: "リザードナイトY",
      メガライチュウX: "ライチュウナイトＸ",
      メガライチュウY: "ライチュウナイトＹ",
      メガフシギバナ: "フシギバナイト",
      メガカメックス: "カメックスナイト",
    };
    if (custom[name]) return custom[name];
    const baseName = state.baseByMega.get(name);
    if (!baseName) return "";
    const guessed = `${baseName}ナイト`;
    if (state.tools.some((tool) => tool["名前"] === guessed)) return guessed;
    const normalizedBase = baseName.replace(/[ー\s]/g, "");
    const row = state.tools.find((tool) => tool["名前"].includes(normalizedBase.slice(0, 3)) && tool["名前"].endsWith("ナイト"));
    return row?.["名前"] || "";
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
    if (!pokemon) return "";
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

  function cloneEv(ev = {}) {
    return { hp: ev.hp || 0, atk: ev.atk || 0, def: ev.def || 0, spa: ev.spa || 0, spd: ev.spd || 0, spe: ev.spe || 0 };
  }

  function cloneRank(rank = {}) {
    return { atk: rank.atk || 0, def: rank.def || 0, spa: rank.spa || 0, spd: rank.spd || 0, spe: rank.spe || 0 };
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
