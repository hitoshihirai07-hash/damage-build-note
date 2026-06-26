(function () {
  "use strict";

  const STORAGE_KEY = "damage-build-note-battle-record-v2";
  const MAX_RECORDS = 300;
  const OUTCOMES = ["未確定", "勝ち", "負け"];

  const app = document.getElementById("review-app");
  const toast = document.getElementById("review-toast");
  const state = {
    core: null,
    savedBuilds: [],
    pokemonNames: [],
    record: null,
    records: [],
  };

  init();

  async function init() {
    try {
      state.core = window.DamageBuildNoteCore;
      if (!state.core) throw new Error("対戦記録の準備を始められませんでした。");
      await state.core.ready;
      state.savedBuilds = state.core.getSavedBuilds();
      state.pokemonNames = state.core.getPokemonNames();
      state.records = loadRecords();
      state.record = createEmptyRecord();
      render();
    } catch (error) {
      app.innerHTML = `
        <main class="view review-view">
          <section class="panel">
            <div class="panel-header"><h2>読み込みエラー</h2></div>
            <div class="panel-body"><p class="empty-state">${escapeHtml(error.message || "データを読み込めませんでした")}</p></div>
          </section>
        </main>
      `;
    }
  }

  function createEmptyRecord() {
    const now = new Date();
    return normalizeRecord({
      id: createId(),
      title: `対戦記録 ${formatDateTime(now)}`,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      outcome: "未確定",
      mySelection: [null, null, null],
      opponentParty: ["", "", "", "", "", ""],
      opponentLead: "",
      opponentSelection: ["", "", ""],
      memo: "",
    });
  }

  function createId() {
    return `battle-record-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function normalizeRecord(raw) {
    const value = raw && typeof raw === "object" ? raw : {};
    const selection = Array.isArray(value.mySelection) ? value.mySelection : [];
    const party = Array.isArray(value.opponentParty) ? value.opponentParty : [];
    const opponentSelection = Array.isArray(value.opponentSelection) ? value.opponentSelection : [];
    return {
      id: String(value.id || createId()),
      title: String(value.title || "対戦記録").slice(0, 80),
      createdAt: safeIso(value.createdAt),
      updatedAt: safeIso(value.updatedAt || value.createdAt),
      outcome: OUTCOMES.includes(value.outcome) ? value.outcome : "未確定",
      mySelection: [0, 1, 2].map((index) => cloneBuild(selection[index])),
      opponentParty: [0, 1, 2, 3, 4, 5].map((index) => normalizeName(party[index])),
      opponentLead: normalizeName(value.opponentLead),
      opponentSelection: [0, 1, 2].map((index) => normalizeName(opponentSelection[index])),
      memo: String(value.memo || "").slice(0, 2000),
    };
  }

  function safeIso(value) {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
  }

  function cloneBuild(build) {
    if (!build || !build.name) return null;
    return {
      buildId: String(build.buildId || build.id || ""),
      name: String(build.name || "").slice(0, 60),
      nickname: String(build.nickname || "").slice(0, 60),
    };
  }

  function normalizeName(value) {
    return String(value || "").trim().slice(0, 60);
  }

  function render() {
    const stats = buildStats(state.records);
    app.innerHTML = `
      <header class="topbar review-topbar">
        <div class="brand">
          <p class="rule-line">Pokemon Champions / 3vs3シングル / 動画・画像は使わない</p>
          <h1>対戦記録</h1>
        </div>
        <div class="header-actions">
          <a class="text-button compact-button" href="index.html">戻る</a>
          <button class="text-button compact-button" type="button" data-record-action="new">新規</button>
          <button class="text-button" type="button" data-record-action="save">保存</button>
        </div>
      </header>
      <main class="view review-view">
        ${renderNotice()}
        ${renderBasicPanel()}
        ${renderOpponentPanel()}
        ${renderMemoPanel()}
        ${renderStatsPanel(stats)}
        ${renderHistoryPanel()}
      </main>
      ${renderPokemonDatalist()}
    `;
  }

  function renderNotice() {
    return `
      <section class="review-notice">
        <strong>選出と結果を残すだけの簡単な記録シートです。</strong>
        <span>自分の選出3体、相手の手持ち6体・初手・判明した選出を保存します。動画・画像・ターンごとの行動・ダメージ計算は扱いません。</span>
      </section>
    `;
  }

  function renderBasicPanel() {
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>対戦の記録</h2>
          <span class="panel-meta">自分の選出順</span>
        </div>
        <div class="panel-body">
          <div class="field-grid review-two-column">
            <label class="field">
              <span>タイトル</span>
              <input type="text" maxlength="80" data-record-field="title" value="${escapeAttr(state.record.title)}" placeholder="例：○○入りとの対戦" />
            </label>
            <label class="field">
              <span>結果</span>
              <select data-record-field="outcome">${OUTCOMES.map((value) => option(value, state.record.outcome)).join("")}</select>
            </label>
          </div>
          ${state.savedBuilds.length ? `
            <div class="review-selection-grid">
              ${[0, 1, 2].map((index) => renderMySelectionSlot(index)).join("")}
            </div>
          ` : `
            <div class="review-empty-action">
              <p class="empty-state">先に「育成登録」で自分のポケモンを保存すると、ここで選出順を選べます。</p>
              <a class="primary-button secondary" href="index.html">育成登録へ</a>
            </div>
          `}
        </div>
      </section>
    `;
  }

  function renderMySelectionSlot(index) {
    const selected = state.record.mySelection[index];
    const options = state.savedBuilds.map((build) => {
      const id = String(build.id || "");
      return `<option value="${escapeAttr(id)}" ${id === selected?.buildId ? "selected" : ""}>${escapeHtml(buildLabel(build))}</option>`;
    }).join("");
    return `
      <label class="review-selection-slot">
        <span>${index + 1}番手</span>
        <select data-record-field="my-selection" data-index="${index}">
          <option value="">選択しない</option>
          ${options}
        </select>
        <strong>${selected ? escapeHtml(buildLabel(selected)) : "未選択"}</strong>
      </label>
    `;
  }

  function renderOpponentPanel() {
    const party = state.record.opponentParty;
    return `
      <section class="panel">
        <div class="panel-header">
          <h2>相手の記録</h2>
          <span class="panel-meta">初手・選出率の集計用</span>
        </div>
        <div class="panel-body review-opponent-record-body">
          <div class="review-opponent-section">
            <div class="review-section-heading">
              <h3>相手の手持ち 6体</h3>
              <p>集計の母数になります。わかる範囲で入力してください。</p>
            </div>
            <div class="record-party-grid">
              ${party.map((name, index) => `
                <label class="field record-party-slot">
                  <span>${index + 1}</span>
                  <input list="record-pokemon-options" data-record-field="opponent-party" data-index="${index}" value="${escapeAttr(name)}" autocomplete="off" placeholder="ポケモン名" />
                </label>
              `).join("")}
            </div>
          </div>
          <div class="review-opponent-section record-opponent-choice">
            <div class="review-section-heading">
              <h3>相手の初手・選出</h3>
              <p>相手の選出率は、選出3体すべてが分かった対戦だけで集計します。</p>
            </div>
            <div class="field-grid review-two-column">
              <label class="field">
                <span>相手の初手</span>
                <input list="record-pokemon-options" data-record-field="opponent-lead" value="${escapeAttr(state.record.opponentLead)}" autocomplete="off" placeholder="相手の初手" />
              </label>
              <div class="record-selection-complete-note">
                <strong>${opponentSelectionComplete(state.record) ? "選出3体：記録済み" : "選出3体：未確定"}</strong>
                <span>未確定の対戦は初手率だけに反映されます。</span>
              </div>
            </div>
            <div class="review-selection-grid record-opponent-selection-grid">
              ${state.record.opponentSelection.map((name, index) => `
                <label class="review-selection-slot">
                  <span>相手 ${index + 1}体目</span>
                  <input list="record-pokemon-options" data-record-field="opponent-selection" data-index="${index}" value="${escapeAttr(name)}" autocomplete="off" placeholder="選出ポケモン" />
                </label>
              `).join("")}
            </div>
          </div>
        </div>
      </section>
    `;
  }

  function renderMemoPanel() {
    return `
      <section class="panel">
        <div class="panel-header"><h2>メモ</h2><span class="panel-meta">任意</span></div>
        <div class="panel-body">
          <label class="field">
            <span>次回に残すこと</span>
            <textarea rows="4" maxlength="2000" data-record-field="memo" placeholder="選出の理由、反省、次に試したいことなど">${escapeHtml(state.record.memo)}</textarea>
          </label>
        </div>
      </section>
    `;
  }

  function renderStatsPanel(stats) {
    return `
      <section class="panel">
        <div class="panel-header"><h2>ポケモン記録</h2><span class="panel-meta">保存済み ${stats.total}戦</span></div>
        <div class="panel-body review-stats-body">
          <div class="review-summary-grid record-summary-grid">
            <div><span>対戦数</span><strong>${stats.total}</strong></div>
            <div><span>勝ち</span><strong>${stats.win}</strong></div>
            <div><span>負け</span><strong>${stats.loss}</strong></div>
            <div><span>勝率</span><strong>${stats.winRate}</strong></div>
          </div>
          <div class="record-stat-note">自分の選出率は自分の3体選出をすべて残した対戦、相手の選出率は相手の3体選出をすべて残した対戦のみを母数にしています。</div>
          <div class="record-stat-grid">
            ${renderMyStats(stats)}
            ${renderOpponentStats(stats)}
          </div>
        </div>
      </section>
    `;
  }

  function renderMyStats(stats) {
    const rows = stats.myEntries.length
      ? stats.myEntries.map((entry) => `
        <tr>
          <th scope="row">${escapeHtml(entry.label)}</th>
          <td>${rateText(entry.selected, stats.mySelectionBase)}</td>
          <td>${rateText(entry.lead, stats.mySelectionBase)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3" class="record-empty-cell">自分の選出を保存すると表示されます。</td></tr>`;
    return `
      <section class="review-aggregate-block record-table-block">
        <div class="record-table-heading">
          <h3>自分の選出</h3>
          <span>母数 ${stats.mySelectionBase}戦</span>
        </div>
        <div class="record-table-wrap">
          <table class="record-table">
            <thead><tr><th>ポケモン</th><th>選出率</th><th>先発率</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderOpponentStats(stats) {
    const rows = stats.opponentEntries.length
      ? stats.opponentEntries.map((entry) => `
        <tr>
          <th scope="row">${escapeHtml(entry.name)}</th>
          <td>${rateText(entry.lead, entry.appearance)}</td>
          <td>${rateText(entry.selected, entry.selectionBase)}</td>
        </tr>
      `).join("")
      : `<tr><td colspan="3" class="record-empty-cell">相手の手持ちを保存すると表示されます。</td></tr>`;
    return `
      <section class="review-aggregate-block record-table-block">
        <div class="record-table-heading">
          <h3>相手の初手・選出</h3>
          <span>初手率は手持ち6体を母数</span>
        </div>
        <div class="record-table-wrap">
          <table class="record-table">
            <thead><tr><th>ポケモン</th><th>初手率</th><th>選出率</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
    `;
  }

  function renderHistoryPanel() {
    const cards = state.records.length
      ? state.records.map(renderHistoryCard).join("")
      : `<p class="empty-state">保存した対戦記録はまだありません。</p>`;
    return `
      <section class="panel">
        <div class="panel-header"><h2>履歴</h2><span class="panel-meta">最新順</span></div>
        <div class="panel-body"><div class="review-history-list">${cards}</div></div>
      </section>
    `;
  }

  function renderHistoryCard(record) {
    const mySelection = record.mySelection.filter(Boolean).map((build, index) => `${index + 1}. ${buildLabel(build)}`).join(" → ") || "自分の選出未入力";
    const opponentParty = uniqueNames(record.opponentParty).join("・") || "相手の手持ち未入力";
    const opponentInfo = [record.opponentLead ? `初手：${record.opponentLead}` : "初手未入力", opponentSelectionComplete(record) ? `選出：${record.opponentSelection.join("・")}` : "選出3体未確定"].join(" / ");
    return `
      <article class="review-history-card">
        <div>
          <h3>${escapeHtml(record.title)}</h3>
          <p>${escapeHtml(formatDateTime(new Date(record.updatedAt)))} / ${escapeHtml(record.outcome)}</p>
          <p><b>自分：</b>${escapeHtml(mySelection)}</p>
          <p><b>相手：</b>${escapeHtml(opponentParty)}</p>
          <p>${escapeHtml(opponentInfo)}</p>
        </div>
        <div class="review-card-actions">
          <button class="ghost-button small" type="button" data-record-action="load" data-id="${escapeAttr(record.id)}">開く</button>
          <button class="ghost-button small" type="button" data-record-action="delete" data-id="${escapeAttr(record.id)}">削除</button>
        </div>
      </article>
    `;
  }

  function renderPokemonDatalist() {
    return `<datalist id="record-pokemon-options">${state.pokemonNames.map((name) => `<option value="${escapeAttr(name)}"></option>`).join("")}</datalist>`;
  }

  function buildStats(records) {
    const stats = {
      total: records.length,
      win: records.filter((record) => record.outcome === "勝ち").length,
      loss: records.filter((record) => record.outcome === "負け").length,
      winRate: "—",
      mySelectionBase: 0,
      myEntries: [],
      opponentEntries: [],
    };
    const decided = stats.win + stats.loss;
    stats.winRate = decided ? `${((stats.win / decided) * 100).toFixed(1)}%` : "—";

    const myMap = new Map();
    const addMyEntry = (build) => {
      const key = buildKey(build);
      if (!key) return null;
      if (!myMap.has(key)) myMap.set(key, { key, label: buildLabel(build), selected: 0, lead: 0 });
      return myMap.get(key);
    };
    state.savedBuilds.forEach((build) => addMyEntry(build));
    records.forEach((record) => {
      if (!mySelectionComplete(record)) return;
      stats.mySelectionBase += 1;
      record.mySelection.forEach((build, index) => {
        const entry = addMyEntry(build);
        if (!entry) return;
        entry.selected += 1;
        if (index === 0) entry.lead += 1;
      });
    });
    stats.myEntries = Array.from(myMap.values())
      .filter((entry) => entry.selected > 0)
      .sort((a, b) => b.selected - a.selected || b.lead - a.lead || a.label.localeCompare(b.label, "ja"));

    const opponentMap = new Map();
    const getOpponent = (name) => {
      const key = normalizeName(name);
      if (!key) return null;
      if (!opponentMap.has(key)) opponentMap.set(key, { name: key, appearance: 0, lead: 0, selectionBase: 0, selected: 0 });
      return opponentMap.get(key);
    };
    records.forEach((record) => {
      const party = uniqueNames(record.opponentParty);
      if (party.length === 6) {
        party.forEach((name) => {
          const entry = getOpponent(name);
          entry.appearance += 1;
          if (record.opponentLead === name) entry.lead += 1;
        });
      }
      if (party.length === 6 && opponentSelectionComplete(record)) {
        party.forEach((name) => {
          const entry = getOpponent(name);
          entry.selectionBase += 1;
        });
        record.opponentSelection.forEach((name) => {
          const entry = getOpponent(name);
          if (entry) entry.selected += 1;
        });
      }
    });
    stats.opponentEntries = Array.from(opponentMap.values())
      .sort((a, b) => b.appearance - a.appearance || b.selected - a.selected || b.lead - a.lead || a.name.localeCompare(b.name, "ja"));
    return stats;
  }

  function mySelectionComplete(record) {
    const picks = record.mySelection.filter(Boolean);
    return picks.length === 3 && new Set(picks.map(buildKey)).size === 3;
  }

  function opponentSelectionComplete(record) {
    const party = uniqueNames(record.opponentParty);
    const picks = uniqueNames(record.opponentSelection);
    return party.length === 6 && picks.length === 3 && picks.every((name) => party.includes(name));
  }

  function buildKey(build) {
    if (!build?.name) return "";
    return String(build.buildId || `${build.nickname || ""}|${build.name}`);
  }

  function buildLabel(build) {
    if (!build?.name) return "";
    return build.nickname ? `${build.nickname}（${build.name}）` : build.name;
  }

  function uniqueNames(values) {
    const seen = new Set();
    return (Array.isArray(values) ? values : []).map(normalizeName).filter((name) => {
      if (!name || seen.has(name)) return false;
      seen.add(name);
      return true;
    });
  }

  function rateText(numerator, denominator) {
    if (!denominator) return "—";
    return `${numerator}/${denominator} (${((numerator / denominator) * 100).toFixed(1)}%)`;
  }

  function loadRecords() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(raw)) return [];
      return raw.map(normalizeRecord).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, MAX_RECORDS);
    } catch (_) {
      return [];
    }
  }

  function persistRecords() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
      return true;
    } catch (_) {
      showToast("保存できませんでした。端末の保存領域を確認してください");
      return false;
    }
  }

  function saveRecord() {
    const error = validateRecord(state.record);
    if (error) {
      showToast(error);
      return;
    }
    const now = new Date().toISOString();
    state.record.updatedAt = now;
    const record = normalizeRecord(state.record);
    const index = state.records.findIndex((item) => item.id === record.id);
    if (index >= 0) state.records[index] = record;
    else state.records.unshift(record);
    state.records = state.records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, MAX_RECORDS);
    if (!persistRecords()) return;
    state.record = normalizeRecord(record);
    render();
    showToast("対戦記録を保存しました");
  }

  function validateRecord(record) {
    const selectedBuilds = record.mySelection.filter(Boolean);
    if (selectedBuilds.length && new Set(selectedBuilds.map(buildKey)).size !== selectedBuilds.length) return "自分の選出に同じポケモンが重複しています";
    const party = record.opponentParty.filter(Boolean);
    if (party.length && new Set(party).size !== party.length) return "相手の手持ちに同じポケモンが重複しています";
    const fullParty = uniqueNames(record.opponentParty);
    if (record.opponentLead && !fullParty.includes(record.opponentLead)) return "相手の初手は、相手の手持ち6体に入力したポケモンを選んでください";
    const opponentPicks = record.opponentSelection.filter(Boolean);
    if (opponentPicks.length && new Set(opponentPicks).size !== opponentPicks.length) return "相手の選出に同じポケモンが重複しています";
    if (opponentPicks.some((name) => !fullParty.includes(name))) return "相手の選出は、相手の手持ち6体に入力したポケモンを選んでください";
    return "";
  }

  function loadRecord(id) {
    const found = state.records.find((record) => record.id === id);
    if (!found) return;
    state.record = normalizeRecord(found);
    render();
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("対戦記録を開きました");
  }

  function deleteRecord(id) {
    const found = state.records.find((record) => record.id === id);
    if (!found) return;
    if (!window.confirm(`「${found.title}」を削除しますか？`)) return;
    state.records = state.records.filter((record) => record.id !== id);
    if (!persistRecords()) return;
    if (state.record.id === id) state.record = createEmptyRecord();
    render();
    showToast("対戦記録を削除しました");
  }

  function setField(target) {
    const field = target.dataset.recordField;
    const index = Number(target.dataset.index);
    if (field === "title") state.record.title = String(target.value || "").slice(0, 80);
    if (field === "outcome") state.record.outcome = OUTCOMES.includes(target.value) ? target.value : "未確定";
    if (field === "memo") state.record.memo = String(target.value || "").slice(0, 2000);
    if (field === "my-selection" && Number.isInteger(index)) {
      const build = state.savedBuilds.find((item) => String(item.id || "") === target.value);
      state.record.mySelection[index] = cloneBuild(build);
      render();
    }
    if (field === "opponent-party" && Number.isInteger(index)) state.record.opponentParty[index] = normalizeName(target.value);
    if (field === "opponent-lead") state.record.opponentLead = normalizeName(target.value);
    if (field === "opponent-selection" && Number.isInteger(index)) state.record.opponentSelection[index] = normalizeName(target.value);
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("[data-record-action]");
    if (!target) return;
    const action = target.dataset.recordAction;
    if (action === "new") {
      state.record = createEmptyRecord();
      render();
      showToast("新しい対戦記録を開きました");
      return;
    }
    if (action === "save") saveRecord();
    if (action === "load") loadRecord(target.dataset.id || "");
    if (action === "delete") deleteRecord(target.dataset.id || "");
  });

  document.addEventListener("input", (event) => {
    const target = event.target;
    if (!target?.dataset?.recordField) return;
    setField(target);
  });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (!target?.dataset?.recordField) return;
    setField(target);
    if (["opponent-party", "opponent-lead", "opponent-selection"].includes(target.dataset.recordField)) render();
  });

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2600);
  }

  function option(label, selected) {
    return `<option value="${escapeAttr(label)}" ${label === selected ? "selected" : ""}>${escapeHtml(label)}</option>`;
  }

  function formatDateTime(date) {
    const value = date instanceof Date ? date : new Date(date);
    if (Number.isNaN(value.getTime())) return "日時不明";
    return value.toLocaleString("ja-JP", {
      year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
    });
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();
