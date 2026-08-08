# mabinogi-life-tool

靜態網頁版《瑪奇 Mobile》生活跑商與生產助手。

## 核心檔案

- `index.html`：頁面結構
- `style.css`：樣式
- `data.js`：NPC、商店、交換、材料與配方資料
- `app.js`：互動、Local Storage、BOM、搜尋與匯入/匯出

## 使用者資料

每位使用者的：
- 每日／每週完成與跳過狀態
- 庫存
- 本週料理／秘藥生產目標

都只保存在該使用者自己的瀏覽器 Local Storage。

更新網站程式碼或 `data.js` 不會自動清除使用者資料。
`app.js` 內含 state migration，未來改欄位時應透過 migration 升級，不要改 Storage Key 或直接清空。

## 本機測試

直接開啟 `index.html` 即可。

## GitHub Pages

此專案使用 `.github/workflows/pages.yml` 自動部署。
Push 到 `main` 後會觸發 GitHub Pages deployment。

公開網址：

`https://xm30703.github.io/mabinogi-life-tool/`
