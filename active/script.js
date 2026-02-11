// active/script.js - 活动道具计算器逻辑（从 root script.js 中抽取）
function setAmount(button, amount) {
    const input = button.closest('.controls').querySelector('input');
    if (input) input.value = amount;
}

function addAmount(button, amount) {
    const input = button.closest('.controls').querySelector('input');
    if (!input) return;
    const newValue = parseInt(input.value || 0) + amount;
    const max = parseInt(input.max || input.dataset.max || 9999999);
    input.value = Math.min(newValue, max);
}

function setMax(button) {
    const input = button.closest('.controls').querySelector('input');
    if (input) input.value = input.dataset.max || input.max || 0;
}

function calculateRequiredStamina() {
    const initialS = parseInt(document.getElementById('initialS').value || 0);
    const initialSS = parseInt(document.getElementById('initialSS').value || 0);
    const initialSSS = parseInt(document.getElementById('initialSSS').value || 0);
    const initialBigEvent = parseInt(document.getElementById('initialBigEvent').value || 0);

    const bigEventS = Math.floor(initialBigEvent * 0.9);
    const bigEventSS = Math.floor(initialBigEvent * 0.09);
    const bigEventSSS = Math.floor(initialBigEvent * 0.01);

    const totalInitialS = initialS + bigEventS;
    const totalInitialSS = initialSS + bigEventSS;
    const totalInitialSSS = initialSSS + bigEventSSS;

    let totalS = 0, totalSS = 0, totalSSS = 0;
    let itemCounts = {};

    document.querySelectorAll('.exchange-input').forEach(input => {
        const amount = parseInt(input.value || 0);
        if (amount <= 0) return;
        const type = input.dataset.type;
        const itemCard = input.closest('.item-card');
        const itemName = itemCard ? (itemCard.querySelector('img')?.getAttribute('alt') || '') : '';
        if (type === 'special') {
            totalS += amount * parseInt(input.dataset.sCost || 0);
            totalSS += amount * parseInt(input.dataset.ssCost || 0);
            totalSSS += amount * parseInt(input.dataset.sssCost || 0);
            itemCounts[itemName] = amount;
        } else {
            const cost = parseInt(input.dataset.cost || 0);
            if (type === 's') totalS += amount * cost;
            if (type === 'ss') totalSS += amount * cost;
            if (type === 'sss') totalSSS += amount * cost;
            itemCounts[itemName] = amount;
        }
    });

    const originalTotalS = totalS;
    const originalTotalSS = totalSS;
    const originalTotalSSS = totalSSS;

    totalS = Math.max(0, totalS - totalInitialS);
    totalSS = Math.max(0, totalSS - totalInitialSS);
    totalSSS = Math.max(0, totalSSS - totalInitialSSS);

    const bigEventResult = calculateBigEventStamina(totalS, totalSS, totalSSS, originalTotalS, originalTotalSS, originalTotalSSS, totalInitialS, totalInitialSS, totalInitialSSS);
    const smallEventStamina = calculateSmallEventStamina(totalS, originalTotalS, totalInitialS);

    const snapshot = {
        initialTotals: { S: totalInitialS, SS: totalInitialSS, SSS: totalInitialSSS },
        totalsNeeded: { S: totalS, SS: totalSS, SSS: totalSSS },
        totalsOriginal: { S: originalTotalS, SS: originalTotalSS, SSS: originalTotalSSS },
        itemCounts,
        bigEventResult,
        smallEventStamina
    };

    let itemsHtml = '';
    for (const [item, count] of Object.entries(itemCounts)) {
        if (count > 0) itemsHtml += `${item}: ${count}个<br>`;
    }

    document.getElementById('bigEventResult').innerHTML = 
    `【大活动】(s:ss:sss=90:9:1)<br>所需体力：${bigEventResult.stamina} (${bigEventResult.battles}次战斗)<br>` +
    `扫荡统计：${bigEventResult.sweepInfo.rounds}轮` + 
    (bigEventResult.sweepInfo.remaining > 0 ? ` + ${bigEventResult.sweepInfo.remaining}次战斗` : '') + 
    `<br>获得道具：<br>` +
    `S道具: ${bigEventResult.obtained.S}个 (剩余: ${bigEventResult.remaining.S}个) [额外: ${totalInitialS}个]<br>` +
    `SS道具: ${bigEventResult.obtained.SS}个 (剩余: ${bigEventResult.remaining.SS}个) [额外: ${totalInitialSS}个]<br>` +
    `SSS道具: ${bigEventResult.obtained.SSS}个 (剩余: ${bigEventResult.remaining.SSS}个) [额外: ${totalInitialSSS}个]<br>` +
    (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');

    document.getElementById('smallEventResult').innerHTML = 
    `——————————<br>【小活动】(该计算不会计入ss及sss道具，且仅计算25%的s道具掉率)<br>` +
    `所需体力：${smallEventStamina.stamina} (${smallEventStamina.battles}次战斗)<br>` +
    `扫荡统计：${smallEventStamina.sweepInfo.rounds}轮` +
    (smallEventStamina.sweepInfo.remaining > 0 ? ` + ${smallEventStamina.sweepInfo.remaining}次战斗` : '') +
    `<br>获得道具：<br>` +
    `S道具: ${smallEventStamina.obtained.S}个 (剩余: ${smallEventStamina.remaining.S}个) [额外: ${totalInitialS}个]<br>` +
    (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');
    return snapshot;
}

function calculateBigEventStamina(totalS, totalSS, totalSSS, originalTotalS, originalTotalSS, originalTotalSSS, totalInitialS, totalInitialSS, totalInitialSSS) {
    const totalNeededA = Math.ceil(
        Math.max(
            totalS / 0.9,
            totalSS / 0.09,
            totalSSS / 0.01
        )
    );
    const battlesNeeded = Math.ceil(totalNeededA / 0.4);
    const totalStamina = battlesNeeded * 5;
    const totalBattles = totalStamina / 5;
    const totalA = Math.floor(totalBattles * 0.4);
    const obtainedS = Math.floor(totalA * 0.9);
    const obtainedSS = Math.floor(totalA * 0.09);
    const obtainedSSS = Math.floor(totalA * 0.01);
    const remainingS = obtainedS - originalTotalS + totalInitialS;
    const remainingSS = obtainedSS - originalTotalSS + totalInitialSS;
    const remainingSSS = obtainedSSS - originalTotalSSS + totalInitialSSS;
    const sweepRounds = Math.floor(totalBattles / 9999);
    const remainingBattles = Math.floor(totalBattles % 9999);

    return {
        stamina: totalStamina,
        battles: totalBattles,
        sweepInfo: { rounds: sweepRounds, remaining: remainingBattles },
        remaining: { S: remainingS, SS: remainingSS, SSS: remainingSSS },
        obtained: { S: obtainedS, SS: obtainedSS, SSS: obtainedSSS }
    };
}

function calculateSmallEventStamina(totalS, originalTotalS, totalInitialS) {
    const battlesNeeded = Math.ceil(totalS / 0.25);
    const sweepRounds = Math.floor(battlesNeeded / 9999);
    const remainingBattles = Math.floor(battlesNeeded % 9999);
    return {
        stamina: battlesNeeded * 5,
        battles: battlesNeeded,
        sweepInfo: { rounds: sweepRounds, remaining: remainingBattles },
        obtained: { S: Math.floor(battlesNeeded * 0.25) },
        remaining: { S: Math.floor(battlesNeeded * 0.25) - originalTotalS + totalInitialS }
    };
}

function resetAllInputs() {
    document.querySelectorAll('.exchange-input').forEach(input => input.value = 0);
    document.querySelectorAll('.initial-input').forEach(input => input.value = 0);
    const be = document.getElementById('bigEventResult'); if (be) be.textContent = '';
    const se = document.getElementById('smallEventResult'); if (se) se.textContent = '';
}

function clearCacheAndReload() {
    if (confirm('确定要清除缓存并重新加载页面吗？这将清除所有已保存的数据。')) {
        try {
            if (typeof(Storage) !== "undefined") localStorage.clear();
            if (typeof(Storage) !== "undefined") sessionStorage.clear();
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            window.location.reload(true);
        } catch (error) {
            console.error('清除缓存时出错:', error);
            window.location.reload(true);
        }
    }
}

const MARKET_STATE = { loaded: false, loading: false };

function getMarketApiBase() {
    if (window.MARKET_API_BASE) return window.MARKET_API_BASE;
    if (location.protocol === 'file:') return 'http://localhost:8080';
    return '';
}

function marketApiUrl(path) {
    return `${getMarketApiBase()}${path}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function parseJsonField(value) {
    if (!value) return null;
    if (typeof value === 'object') return value;
    try { return JSON.parse(value); } catch { return null; }
}

function setMarketStatus(message, type) {
    const el = document.getElementById('marketStatus');
    if (!el) return;
    el.textContent = message || '';
    el.className = `market-status${type ? ` is-${type}` : ''}`;
}

function formatMarketMode(mode) {
    if (mode === 'big') return '只保存大活动';
    if (mode === 'small') return '只保存小活动';
    if (mode === 'both') return '大小都保存';
    return mode || '';
}

function formatSweepInfo(info) {
    if (!info) return '0轮';
    const rounds = Number(info.rounds || 0);
    const remaining = Number(info.remaining || 0);
    return remaining > 0 ? `${rounds}轮 + ${remaining}次` : `${rounds}轮`;
}

function buildResultBlock(label, result) {
    if (!result) return '';
    const obtained = result.obtained || {};
    const remaining = result.remaining || {};
    const rows = [
        `所需体力: ${result.stamina ?? 0}`,
        `战斗次数: ${result.battles ?? 0}`,
        `扫荡: ${formatSweepInfo(result.sweepInfo)}`
    ];
    if (typeof obtained.S !== 'undefined') rows.push(`S: ${obtained.S} (剩余: ${remaining.S ?? 0})`);
    if (typeof obtained.SS !== 'undefined') rows.push(`SS: ${obtained.SS} (剩余: ${remaining.SS ?? 0})`);
    if (typeof obtained.SSS !== 'undefined') rows.push(`SSS: ${obtained.SSS} (剩余: ${remaining.SSS ?? 0})`);

    return `<div class="market-result-block"><div class="market-result-title">${escapeHtml(label)}</div>${rows.map(row => `<div class="market-result-row">${escapeHtml(row)}</div>`).join('')}</div>`;
}

function renderMarketPlans(plans) {
    const list = document.getElementById('marketList');
    if (!list) return;
    list.innerHTML = '';
    if (!plans || !plans.length) {
        list.innerHTML = '<div class="market-empty">暂无方案，快发布一个吧。</div>';
        return;
    }

    plans.forEach(plan => {
        const items = parseJsonField(plan.items) || {};
        const bigResult = parseJsonField(plan.big_result);
        const smallResult = parseJsonField(plan.small_result);
        const itemEntries = Object.entries(items);
        const itemsHtml = itemEntries.length
            ? itemEntries.map(([name, count]) => `<div class="market-item-row"><span>${escapeHtml(name)}</span><span class="market-count">${escapeHtml(count)}</span></div>`).join('')
            : '<div class="market-empty">未填写兑换道具</div>';
        const createdAt = plan.created_at ? new Date(plan.created_at).toLocaleString() : '';
        const modeLabel = formatMarketMode(plan.result_mode);
        const descriptionHtml = plan.description ? escapeHtml(plan.description) : '<span class="market-muted">无说明</span>';

        const card = document.createElement('div');
        card.className = 'market-card';
        card.innerHTML = `
            <div class="market-card-header">
                <div class="market-title-wrap">
                    <h4>${escapeHtml(plan.title || '未命名方案')}</h4>
                    <div class="market-meta">${escapeHtml([modeLabel, createdAt].filter(Boolean).join(' · '))}</div>
                </div>
            </div>
            <p class="market-desc">${descriptionHtml}</p>
            <div class="market-items">
                <div class="market-section-title">兑换道具</div>
                ${itemsHtml}
            </div>
            ${buildResultBlock('大活动结果', bigResult)}
            ${buildResultBlock('小活动结果', smallResult)}
        `;
        list.appendChild(card);
    });
}

async function loadMarketPlans(force) {
    if (MARKET_STATE.loading) return;
    if (MARKET_STATE.loaded && !force) return;
    MARKET_STATE.loading = true;
    setMarketStatus('正在加载方案市场...', 'info');
    const list = document.getElementById('marketList');
    if (list) list.innerHTML = '<div class="market-empty">加载中...</div>';
    try {
        const resp = await fetch(marketApiUrl('/api/plans'));
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const plans = Array.isArray(data) ? data : (data.plans || []);
        renderMarketPlans(plans);
        MARKET_STATE.loaded = true;
        setMarketStatus('', '');
    } catch (error) {
        renderMarketPlans([]);
        setMarketStatus('加载失败，请检查后端服务是否已启动。', 'error');
    } finally {
        MARKET_STATE.loading = false;
    }
}

async function savePlanToMarket() {
    const titleEl = document.getElementById('marketTitle');
    if (!titleEl) return;
    const title = titleEl.value.trim();
    const description = (document.getElementById('marketDescription')?.value || '').trim();
    const mode = document.querySelector('input[name="marketSaveMode"]:checked')?.value || 'both';

    if (!title) {
        setMarketStatus('请填写标题。', 'error');
        return;
    }

    const snapshot = calculateRequiredStamina();
    const items = snapshot?.itemCounts || {};
    if (!Object.keys(items).length) {
        setMarketStatus('请至少填写一个兑换道具数量。', 'error');
        return;
    }

    const payload = {
        title,
        description,
        result_mode: mode,
        items,
        stamina_big: mode !== 'small' ? snapshot.bigEventResult.stamina : 0,
        stamina_small: mode !== 'big' ? snapshot.smallEventStamina.stamina : 0,
        big_result: mode !== 'small' ? snapshot.bigEventResult : null,
        small_result: mode !== 'big' ? snapshot.smallEventStamina : null
    };

    setMarketStatus('正在保存...', 'info');
    try {
        const resp = await fetch(marketApiUrl('/api/plans'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        setMarketStatus('保存成功，已发布到方案市场。', 'success');
        MARKET_STATE.loaded = false;
        await loadMarketPlans(true);
    } catch (error) {
        setMarketStatus('保存失败，请稍后重试。', 'error');
    }
}

function setupMarketActions() {
    const saveBtn = document.getElementById('savePlanBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => savePlanToMarket());
    const refreshBtn = document.getElementById('refreshMarketBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadMarketPlans(true));
}

function switchActiveTab(tabId) {
    const tabs = document.querySelectorAll('.active-tab');
    const panels = document.querySelectorAll('.active-tab-panel');
    tabs.forEach(tab => {
        const active = tab.dataset.tab === tabId;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    panels.forEach(panel => {
        const active = panel.dataset.panel === tabId;
        panel.hidden = !active;
    });
    if (tabId === 'market') loadMarketPlans();
}

function setupActiveTabs() {
    const tabs = document.querySelectorAll('.active-tab');
    if (!tabs.length) return;
    tabs.forEach(tab => tab.addEventListener('click', () => switchActiveTab(tab.dataset.tab)));
    switchActiveTab('calculator');
}

// 初始化：为按钮绑定事件（在视图注入后会直接执行）
function setupItemCardLayout() {
    document.querySelectorAll('.item-card').forEach(card => {
        if (card.dataset.compactLayout === '1') return;
        card.dataset.compactLayout = '1';
        const img = card.querySelector('img');
        if (!img) return;
        const controls = card.querySelector('.controls');
        const textElements = [];
        let node = img.nextElementSibling;
        while (node && node !== controls) {
            const next = node.nextElementSibling;
            if (node.matches('p')) textElements.push(node);
            node = next;
        }
        if (!textElements.length) return;

        const header = document.createElement('div');
        header.className = 'item-header';

        const textWrap = document.createElement('div');
        textWrap.className = 'item-text';

        textElements.forEach(p => {
            p.classList.add('truncate');
            textWrap.appendChild(p);
        });

        const expandBtn = document.createElement('button');
        expandBtn.type = 'button';
        expandBtn.className = 'expand-toggle';
        expandBtn.textContent = '展开';
        expandBtn.setAttribute('aria-expanded', 'false');
        expandBtn.addEventListener('click', () => {
            const expanded = textWrap.classList.toggle('expanded');
            expandBtn.textContent = expanded ? '收起' : '展开';
            expandBtn.setAttribute('aria-expanded', expanded ? 'true' : 'false');
            updateExpandButtons();
        });

        textWrap.appendChild(expandBtn);
        header.appendChild(img);
        header.appendChild(textWrap);

        if (controls) {
            card.insertBefore(header, controls);
        } else {
            card.appendChild(header);
        }
    });

    updateExpandButtons();
}

function updateExpandButtons() {
    document.querySelectorAll('.item-card').forEach(card => {
        const textWrap = card.querySelector('.item-text');
        const btn = card.querySelector('.expand-toggle');
        if (!textWrap || !btn) return;
        if (textWrap.classList.contains('expanded')) {
            btn.style.display = 'inline-flex';
            return;
        }
        const needs = Array.from(textWrap.querySelectorAll('p'))
            .some(p => p.scrollWidth > p.clientWidth);
        btn.style.display = needs ? 'inline-flex' : 'none';
    });
}

function setupResizeHandler() {
    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(updateExpandButtons, 120);
    });
}

(function initActive() {
    const calcBtn = document.getElementById('calculateBtn');
    if (calcBtn) calcBtn.addEventListener('click', calculateRequiredStamina);
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetAllInputs);
    const clearBtn = document.getElementById('clearCacheBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearCacheAndReload);
    setupActiveTabs();
    setupMarketActions();
    setupItemCardLayout();
    setupResizeHandler();
})();
