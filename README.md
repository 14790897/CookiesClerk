[English](README_en.md)|[中文](README.md)

# CookiesClerk 

CookiesClerk 是一款谷歌 Chrome 浏览器插件，可简化同一网站多个 cookie 的管理。通过有效管理 cookie，它允许用户在同一浏览器中同时打开多个账户。

## 安装

您可以从[Chrome 网上商店](https://chrome.google.com/webstore/detail/cookiesclerk/njmcgckgojpcificfmkicgnlbocgdhke?hl=zh-CN&authuser=0)安装 CookiesClerk。

1. 访问 [CookiesClerk 页面](https://chrome.google.com/webstore/detail/cookiesclerk/njmcgckgojpcificfmkicgnlbocgdhke?hl=zh-CN&authuser=0)。 
2. 点击 "添加到 Chrome "按钮安装插件。
3. 插件将添加到您的浏览器中。

### 功能

- 轻松管理同一网站上多个账户的 cookies。
- 保存、加载和删除单个账户的 cookies。
- 清除已关闭账户或所有账户的 cookie。
- 添加和跟踪域，实现高效的 cookie 管理。

## 使用方法

1. 按照安装部分所述安装插件。
2. 点击浏览器工具栏中的 CookiesClerk 图标，打开弹出窗口。
3. 使用弹出窗口中的按钮管理不同账户和域的 cookies。
4. 添加新账户和域，以便更有效地管理 cookie。


## 文件夹

- `src` - 主要源代码。
  - `content-script` - 将作为 `content_script` 注入的脚本和组件
    - `iframe` 将注入页面的 iframe vue3 应用程序内容脚本
  - `background` - 背景脚本。
  - `popup` - 弹出式 vuejs 应用程序根目录
    - `pages` - 弹出页面
  - `options` - vuejs 应用程序根选项
    - `pages` - 选项页面
  - `pages` - 应用程序页面，与所有视图（关于、联系、验证等）通用
  - `components` - 自动导入的 Vue 组件，在弹出窗口和选项页面中共享。
  - `assets` - Vue 组件中使用的资产
- `dist` - 内置文件，也是 Vite 开发的存根。
## 开发
```
pnpm dev 
```
然后在浏览器中使用 dist/ 文件夹加载扩展。

构建
要构建扩展，请运行
```
pnpm build 
```

## 投稿
    
欢迎贡献！如果您发现任何 bug 或想要建议新功能，请随时 [create an issue](https://github.com/14790897/CookiesClerk/issues) 或提交拉取请求。

## 许可证

本项目采用 [MIT License](./LICENSE) 许可。

---

如果您有任何问题或需要帮助，请随时通过 [liuweiqing@liuweiqing.top](mailto:liuweiqing@liuweiqing.top) 联系我们。

## 鸣谢
感谢 https://github.com/mubaidr/vite-vue3-chrome-extension-v3 