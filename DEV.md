# 开发文档（DEV.md）

版本说明
- 本项目已由单页静态页面重构为“框架 + 按需视图”的简单 SPA：根 `index.html` 作为应用壳（侧栏、触发按钮、视图容器），各计算器视图以独立文件夹（例如 `active/`、`evolution/`）的 `index.html` + `script.js` 的形式存在，按需通过 `fetch` 加载并动态注入对应脚本。

快速概览
- 侧栏控制：`script.js` 中提供 `toggleSidebar(open)` 与 `closeSidebar()`。
- 视图加载：调用 `selectCalculator(id)` 会触发 `loadView(id)`：
  - `loadView` 会 fetch 对应的 HTML（`active/index.html` 或 `evolution/index.html`），把返回的 HTML 放入 `#view-<id>` 容器，标记 `data-loaded='true'`，并动态创建 `<script src="...">` 注入到 `document.body`，以便视图脚本能在 DOM 可见时进行初始化。

文件与职责
- `index.html`（根）
  - 应用壳：包含 `#sidebar`（目录）、`#tocToggle`（汉堡触发按钮）和若干 `div#view-xxx` 视图容器。
  - 引入 `styles.css` 与 `script.js`（框架脚本）。
- `script.js`（根）
  - 管理侧栏打开/关闭、外部点击自动收起、ESC 收起、初始视图加载、按需加载视图 HTML 与脚本。
  - 导出/在全局可用函数：`selectCalculator(id)`, `toggleSidebar(open)`。
- `styles.css`
  - 全局样式，包含汉堡按钮、侧栏样式以及响应式规则。
- `active/index.html`, `active/script.js`
  - 活动道具计算器的实现（当前 `active/index.html` 是一个完整页面副本，用于单独调试）。
  - 注意：当通过 `fetch` 将 `active/index.html` 的内容注入根页面时，图片路径最好使用相对根路径（如 `image/...` 而非 `./image` 或 `../image`），否则可能会出现资源加载错误。

如何添加新的计算器视图（推荐流程）
1. 在仓库中创建新文件夹 `xxx/`，在其中放置 `index.html`（仅包含视图片段的 body 内容，建议不要重复 `<html>`/`<head>`）和 `script.js`（初始化与事件绑定）。
2. 在根 `index.html` 的 `<main id="main-content">` 添加容器：

   ```html
   <div id="view-xxx" class="view" data-loaded="false" style="display:none;"></div>
   ```

3. 在 `#sidebar` 的 `<ul>` 中加入入口：

   ```html
   <li><button class="nav-item" data-view="xxx" onclick="selectCalculator('xxx')">新的计算器</button></li>
   ```

4. 在 `xxx/index.html` 中实现视图结构，并在 `xxx/script.js` 的最外层添加初始化逻辑（立即执行或 `DOMContentLoaded`），例如：

   ```js
   (function init(){
     // 绑定按钮、读取inputs、建立计算函数
     // 确保在视图被注入后运行
   })();
   ```

5. 点击侧栏条目时，`script.js` 的 `loadView` 会 fetch 并注入 HTML，然后注入 `xxx/script.js`，保证脚本在 DOM 存在后运行。

注意与调试提示
- 视图 HTML 的路径问题：当视图通过 `fetch` 注入到根页面时，视图中引用的相对资源（例如 `./image/xxx.jpg`）会相对于根页面解析。推荐在视图中使用根相对路径 `image/xxx.jpg` 或绝对路径以避免路径错误。
- 脚本重复注入：`loadView` 会根据 `data-loaded` 标记避免重复加载视图 HTML，但如果需要刷新视图或重新初始化，请在脚本中提供明确的 `init()`/`destroy()` 接口或在 `loadView` 后强制重新加载脚本。
- 日志与错误处理：浏览器控制台可查看 `fetch` 或脚本注入错误，建议在 `loadView` catch 中显示用户可见的错误提示（目前仅在控制台打印警告）。

开发与测试流程建议
1. 本地调试：直接在浏览器打开 `index.html`，从侧栏选择视图并观察控制台（F12）。
2. 独立调试视图：如果希望单独调试某个视图，可暂时打开 `active/a.html`（或 `active/index.html` 的完整页面版本）直接在浏览器中打开，确保 UI/逻辑正确，然后将其转换为片段以便按需注入。
3. 添加自动化检查：为 `script.js` 增加加载失败的用户提示与 retry 按钮，便于线上调试。

变更记录（简要）
- 将原单页内容拆分为根壳与按需视图。
- 新增左下角汉堡触发（`.toc-toggle`）与覆盖式侧栏。
- 将活动计算器迁移到 `active/` 文件夹，并保留一个完整页面副本用于调试。

下一步建议（可选）
- 统一视图资源路径（将 `image/` 资源全部改为根相对路径）。
- 将 `active/index.html` 转为片段（减少重复的 `<head>`），并把样式/脚本依赖改为根统一管理。
- 为视图加载添加 loading 指示与错误提示 UI。

如果你希望我现在执行其中一项，请告诉我具体选择（例如：把 `active/index.html` 转为片段并更新注入逻辑；或为 `loadView` 添加 loading + 错误 UI）。