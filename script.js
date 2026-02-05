// script.js
function setAmount(button, amount) {
    const input = button.closest('.controls').querySelector('input');
    input.value = amount;
}

function addAmount(button, amount) {
    const input = button.closest('.controls').querySelector('input');
    const newValue = parseInt(input.value || 0) + amount;
    const max = parseInt(input.max);
    input.value = Math.min(newValue, max);
}

function setMax(button) {
    const input = button.closest('.controls').querySelector('input');
    input.value = input.dataset.max;
}

function calculateRequiredStamina() {
    // 获取初始道具数量
    const initialS = parseInt(document.getElementById('initialS').value || 0);
    const initialSS = parseInt(document.getElementById('initialSS').value || 0);
    const initialSSS = parseInt(document.getElementById('initialSSS').value || 0);
    const initialBigEvent = parseInt(document.getElementById('initialBigEvent').value || 0);
    
    // 将大活动掉落物按90:9:1比例转换为S、SS、SSS道具
    const bigEventS = Math.floor(initialBigEvent * 0.9);
    const bigEventSS = Math.floor(initialBigEvent * 0.09);
    const bigEventSSS = Math.floor(initialBigEvent * 0.01);
    
    // 计算总的初始道具数量（包含转换后的大活动掉落物）
    const totalInitialS = initialS + bigEventS;
    const totalInitialSS = initialSS + bigEventSS;
    const totalInitialSSS = initialSSS + bigEventSSS;
    
    let totalS = 0;
    let totalSS = 0;
    let totalSSS = 0;
    let itemCounts = {};

    // 收集普通兑换输入
    document.querySelectorAll('.exchange-input').forEach(input => {
        const amount = parseInt(input.value || 0);
        if (amount <= 0) return;

        const type = input.dataset.type;
        // 获取道具名称 - 修改获取方式以确保可靠
        const itemCard = input.closest('.item-card');
        const itemName = itemCard.querySelector('img').getAttribute('alt');
        // const itemName = input.closest('.item-card').querySelector('p').textContent;
        
        if (type === 'special') {
            // 处理特殊兑换
            totalS += amount * parseInt(input.dataset.sCost || 0);
            totalSS += amount * parseInt(input.dataset.ssCost || 0);
            totalSSS += amount * parseInt(input.dataset.sssCost || 0);
            itemCounts[itemName] = amount;
        } else {
            // 处理普通兑换
            const cost = parseInt(input.dataset.cost);
            if (type === 's') totalS += amount * cost;
            if (type === 'ss') totalSS += amount * cost;
            if (type === 'sss') totalSSS += amount * cost;
            itemCounts[itemName] = amount;
        }
    });
    
    // 保存原始需求量用于计算剩余道具
    const originalTotalS = totalS;
    const originalTotalSS = totalSS;
    const originalTotalSSS = totalSSS;
    
    // 减去初始道具数量，计算实际还需要的道具数量
    totalS = Math.max(0, totalS - totalInitialS);
    totalSS = Math.max(0, totalSS - totalInitialSS);
    totalSSS = Math.max(0, totalSSS - totalInitialSSS);

     // 计算大活动所需体力和剩余道具
    const bigEventResult = calculateBigEventStamina(totalS, totalSS, totalSSS, originalTotalS, originalTotalSS, originalTotalSSS, totalInitialS, totalInitialSS, totalInitialSSS);
     // 计算小活动所需体力
    const smallEventStamina = calculateSmallEventStamina(totalS, originalTotalS, totalInitialS);

    let itemsHtml = '';
    for (const [item, count] of Object.entries(itemCounts)) {
        if (count > 0) {
            itemsHtml += `${item}: ${count}个<br>`;
        }
    }

    // 显示结果
    // document.getElementById('bigEventResult').innerHTML = 
    // `【大活动】<br>所需体力：${bigEventResult.stamina} (${bigEventResult.battles}次战斗)<br>` +
    // `获得道具：<br>` +
    // `S道具: ${bigEventResult.obtained.S}个 (剩余: ${bigEventResult.remaining.S}个)<br>` +
    // `SS道具: ${bigEventResult.obtained.SS}个 (剩余: ${bigEventResult.remaining.SS}个)<br>` +
    // `SSS道具: ${bigEventResult.obtained.SSS}个 (剩余: ${bigEventResult.remaining.SSS}个)<br>` +
    // (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');
    
    // document.getElementById('smallEventResult').innerHTML = 
    //  `——————————<br>【小活动】<br>` +
    //  `所需体力：${smallEventStamina.stamina} (${smallEventStamina.battles}次战斗)<br>` +
    //  `获得道具：<br>` +
    //  `S道具: ${smallEventStamina.obtained.S}个 (剩余: ${smallEventStamina.remaining.S}个)<br>` +
    //  (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');

    document.getElementById('bigEventResult').innerHTML = 
    `【大活动】(s:ss:sss=90:9:1)<br>所需体力：${bigEventResult.stamina} (${bigEventResult.battles}次战斗)<br>` +
    `扫荡统计：${bigEventResult.sweepInfo.rounds}轮` + 
    (bigEventResult.sweepInfo.remaining > 0 ? ` + ${bigEventResult.sweepInfo.remaining}次战斗` : '') + 
    `<br>获得道具：<br>` +
    `S道具: ${bigEventResult.obtained.S}个 (剩余: ${bigEventResult.remaining.S}个) [初始: ${totalInitialS}个]<br>` +
    `SS道具: ${bigEventResult.obtained.SS}个 (剩余: ${bigEventResult.remaining.SS}个) [初始: ${totalInitialSS}个]<br>` +
    `SSS道具: ${bigEventResult.obtained.SSS}个 (剩余: ${bigEventResult.remaining.SSS}个) [初始: ${totalInitialSSS}个]<br>` +
    (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');

    
    document.getElementById('smallEventResult').innerHTML = 
    `——————————<br>【小活动】(该计算不会计入ss及sss道具，且仅计算25%的s道具掉率)<br>` +
    `所需体力：${smallEventStamina.stamina} (${smallEventStamina.battles}次战斗)<br>` +
    `扫荡统计：${smallEventStamina.sweepInfo.rounds}轮` +
    (smallEventStamina.sweepInfo.remaining > 0 ? ` + ${smallEventStamina.sweepInfo.remaining}次战斗` : '') +
    `<br>获得道具：<br>` +
    `S道具: ${smallEventStamina.obtained.S}个 (剩余: ${smallEventStamina.remaining.S}个) [初始: ${totalInitialS}个]<br>` +
    (itemsHtml ? `<br>兑换道具统计：<br>${itemsHtml}` : '');
}

function calculateBigEventStamina(totalS, totalSS, totalSSS, originalTotalS, originalTotalSS, originalTotalSSS, totalInitialS, totalInitialSS, totalInitialSSS) {
    // 大活动：40%概率获得道具A
    // 道具A开启概率：SSS(1%), SS(9%), S(90%)
    const totalNeededA = Math.ceil(
        Math.max(
            totalS / 0.9, // S道具需求
            totalSS / 0.09, // SS道具需求
            totalSSS / 0.01  // SSS道具需求
        )
    );
     // 计算需要的战斗次数 (每次战斗40%概率获得A)
     const battlesNeeded = Math.ceil(totalNeededA / 0.4);
    
     // 计算总体力消耗 (每次战斗消耗5体力)
     const totalStamina = battlesNeeded * 5;
     
     // 计算这些体力实际可以获得的道具A数量
     const totalBattles = totalStamina / 5;
     const totalA = Math.floor(totalBattles * 0.4);
     
     // 计算获得的各类道具数量
     const obtainedS = Math.floor(totalA * 0.9);
     const obtainedSS = Math.floor(totalA * 0.09);
     const obtainedSSS = Math.floor(totalA * 0.01);
     
     // 计算剩余的道具数量：获得数量 - 原始需求数量 + 初始道具数量
     const remainingS = obtainedS - originalTotalS + totalInitialS;
     const remainingSS = obtainedSS - originalTotalSS + totalInitialSS;
     const remainingSSS = obtainedSSS - originalTotalSSS + totalInitialSSS;
     
    // 在返回结果前添加扫荡次数计算
    const sweepRounds = Math.floor(totalBattles / 9999);
    const remainingBattles = Math.floor(totalBattles % 9999);

    return {
        stamina: totalStamina,
        battles: totalBattles,
        sweepInfo: {
            rounds: sweepRounds,
            remaining: remainingBattles
        },
        remaining: {
            S: remainingS,
            SS: remainingSS,
            SSS: remainingSSS
        },
        obtained: {
            S: obtainedS,
            SS: obtainedSS,
            SSS: obtainedSSS
        }
    };
    // return Math.ceil(totalNeededA * 5 / 0.4); // 每5点体力40%概率获得A
}

function calculateSmallEventStamina(totalS, originalTotalS, totalInitialS) {
    // 计算需要的战斗次数 (每次战斗25%概率获得S)
    const battlesNeeded = Math.ceil(totalS / 0.25);
    // 计算总体力消耗 (每次战斗消耗5体力)

    // 添加扫荡次数计算
    const sweepRounds = Math.floor(battlesNeeded / 9999);
    const remainingBattles = Math.floor(battlesNeeded % 9999);
    return {
        stamina: battlesNeeded * 5,
        battles: battlesNeeded,
        sweepInfo: {
            rounds: sweepRounds,
            remaining: remainingBattles
        },
        obtained: {
            S: Math.floor(battlesNeeded * 0.25)
        },
        remaining: {
            S: Math.floor(battlesNeeded * 0.25) - originalTotalS + totalInitialS
        }
    };
    // return battlesNeeded * 5;

}

// function calculateSmallEventStamina(totalS) {
//     // 小活动：25%概率获得S道具
//     return Math.ceil(totalS * 5 / 0.25); // 每5点体力25%概率获得S
// }

// 添加重置函数
function resetAllInputs() {
    // 重置所有兑换输入框为0
    document.querySelectorAll('.exchange-input').forEach(input => {
        input.value = 0;
    });
    
    // 重置初始道具设置输入框为0
    document.querySelectorAll('.initial-input').forEach(input => {
        input.value = 0;
    });
    
    // 清空计算结果
    document.getElementById('bigEventResult').textContent = '';
    document.getElementById('smallEventResult').textContent = '';
}

// 添加计算按钮事件监听
document.getElementById('calculateBtn').addEventListener('click', calculateRequiredStamina);
// 添加重置按钮事件监听
document.getElementById('resetBtn').addEventListener('click', resetAllInputs);
// 添加清除缓存按钮事件监听
document.getElementById('clearCacheBtn').addEventListener('click', clearCacheAndReload);

// 清除缓存并重新加载页面的函数
function clearCacheAndReload() {
    // 显示确认对话框
    if (confirm('确定要清除缓存并重新加载页面吗？这将清除所有已保存的数据。')) {
        try {
            // 清除localStorage
            if (typeof(Storage) !== "undefined") {
                localStorage.clear();
            }
            
            // 清除sessionStorage
            if (typeof(Storage) !== "undefined") {
                sessionStorage.clear();
            }
            
            // 清除所有cookie（仅限当前域名）
            document.cookie.split(";").forEach(function(c) { 
                document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
            });
            
            // 强制重新加载页面，绕过缓存
            window.location.reload(true);
            
        } catch (error) {
            console.error('清除缓存时出错:', error);
            // 如果清除缓存失败，仍然尝试重新加载页面
            window.location.reload(true);
        }
    }
}