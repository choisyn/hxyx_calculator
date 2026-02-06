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

// 初始化：为按钮绑定事件（在视图注入后会直接执行）
(function initActive() {
    const calcBtn = document.getElementById('calculateBtn');
    if (calcBtn) calcBtn.addEventListener('click', calculateRequiredStamina);
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', resetAllInputs);
    const clearBtn = document.getElementById('clearCacheBtn');
    if (clearBtn) clearBtn.addEventListener('click', clearCacheAndReload);
})();
