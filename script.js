// script.js (root) - 框架脚本：侧栏控制与按需加载各视图的 HTML/脚本

function toggleSidebar(open) {
    const sidebar = document.getElementById('sidebar');
    const toc = document.getElementById('tocToggle');
    if (!sidebar || !toc) return;
    if (typeof open === 'undefined') open = !sidebar.classList.contains('open');
    if (open) {
        sidebar.classList.add('open');
        document.body.classList.add('sidebar-open', 'overlay-visible');
        sidebar.setAttribute('aria-hidden', 'false');
        toc.setAttribute('aria-expanded', 'true');
    } else {
        sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open', 'overlay-visible');
        sidebar.setAttribute('aria-hidden', 'true');
        toc.setAttribute('aria-expanded', 'false');
    }
}

function closeSidebar() { toggleSidebar(false); }

function loadView(id) {
    const view = document.getElementById('view-' + id);
    if (!view) return Promise.reject(new Error('view not found'));
    if (view.dataset.loaded === 'true') return Promise.resolve();
    const path = id === 'exchange' ? 'active/index.html' : 'evolution/index.html';
    const scriptPath = id === 'exchange' ? 'active/script.js' : 'evolution/script.js';
    return fetch(path)
        .then(resp => { if (!resp.ok) throw new Error('fetch failed'); return resp.text(); })
        .then(html => {
            view.innerHTML = html;
            view.dataset.loaded = 'true';
            // 动态加载视图脚本
            return new Promise((resolve, reject) => {
                const s = document.createElement('script');
                s.src = scriptPath;
                s.onload = () => resolve();
                s.onerror = () => reject(new Error('script load error'));
                document.body.appendChild(s);
            });
        });
}

function selectCalculator(id) {
    // 先加载视图（如果未加载），再显示
    loadView(id).catch(err => console.warn('加载视图失败', err)).finally(() => {
        document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
        const view = document.getElementById('view-' + id);
        if (view) view.style.display = '';
        closeSidebar();
    });
}

// 绑定触发按钮与外部点击收起 + 初始加载 default view
document.addEventListener('DOMContentLoaded', () => {
    const toc = document.getElementById('tocToggle');
    if (toc) {
        toc.addEventListener('click', (e) => { e.stopPropagation(); toggleSidebar(); });
    }

    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const toc = document.getElementById('tocToggle');
        if (!sidebar) return;
        if (sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && e.target !== toc) closeSidebar();
        }
    });

    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSidebar(); });

    // 初始加载道具兑换视图
    selectCalculator('exchange');
});