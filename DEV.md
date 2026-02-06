开发文档（DEV.md）

简介
-	在现有单一计算器页面的基础上，已将页面重构为单页多视图（SPA 风格），并新增了一个可折叠的左侧目录（覆盖式侧栏）和底部左下角触发按钮。当前已有两个视图：
-	1) `道具兑换计算器`（原有功能保留于 `view-exchange`）
-	2) `进化材料计算器`（占位视图，`view-evolution`，功能待实现）

文件变更汇总
-	`index.html`：新增侧栏（`#sidebar`）、底部触发按钮（`#tocToggle`），并将原页面包裹进 `#view-exchange`，新增 `#view-evolution` 占位视图。
-	`styles.css`：新增侧栏与目录按钮的样式，保留并兼容原有响应式样式。
-	`script.js`：新增侧栏开关、无刷新视图切换与自动收起逻辑；保留原有计算逻辑和按钮事件。
-	`DEV.md`：本文件，说明如何扩展与调试。

主要交互接口说明
-	切换视图：调用 `selectCalculator(id)`，例如 `selectCalculator('exchange')` 或 `selectCalculator('evolution')`。
-	打开/收起侧栏：调用 `toggleSidebar()`（切换）或 `toggleSidebar(true)`（打开）/`toggleSidebar(false)`（收起）。
-	侧栏 DOM：`#sidebar`，目录项为带 `data-view` 的按钮，点击后会调用 `selectCalculator` 并自动收起侧栏。

如何添加新计算器视图
1. 在 `index.html` 的 `<main id="main-content">` 中增加一个新的视图容器，命名为 `id="view-xxx"`，并设置 class `view`。
2. 在侧栏（`#sidebar`）的 `<ul>` 中加入一项：

   <li><button class="nav-item" data-view="xxx" onclick="selectCalculator('xxx')">新的计算器名称</button></li>

3. 在 `script.js` 中无需额外注册（已实现基于 `view-` 前缀的通用切换），但如果新视图需要在加载时执行初始化代码，可在 `DOMContentLoaded` 回调中添加针对 `view-xxx` 的初始化逻辑。

样式与可访问性注意
-	侧栏使用覆盖式显示（translateX 动画），并会在打开时添加 `body.sidebar-open` 与 `overlay-visible` 辅助类以便样式或遮罩拓展。
-	触发按钮 `#tocToggle` 为固定在左下角的小按钮，移动或样式调整可在 `styles.css` 中修改 `.toc-toggle`。
-	侧栏的 `aria-hidden` 与触发按钮的 `aria-expanded` 会根据侧栏状态自动更新，便于无障碍支持。

开发与测试建议
-	本地打开 `index.html` 进行交互测试，点击左下角 `目录` 按钮查看侧栏展开/收起、点击条目切换视图并自动收起。
-	测试在不同视口下的表现（移动端触控、桌面端点击），确保侧栏行为符合预期。
-	后续实现新计算器时，尽量将计算逻辑封装为模块函数，避免直接在全局作用域污染。

未来改进
-	为侧栏添加动画遮罩（目前有简易 overlay 类）；
-	使用路由（hash 或 history）记录当前视图（便于分享链接与后退导航）；
-	为每个视图实现独立的初始化/销毁钩子，以便更好地管理事件监听与状态。

如需我继续：
-	我可以为 `进化材料计算器` 生成初步 UI 表单与字段（材料列表、合成配方输入、来源选择等），或者实现基于 hash 的路由以支持 URL 切换。请选择下一步。