[English](README_en.md)|[Chinese](README.md) 

# CookiesClerk  

CookiesClerk is a Google Chrome plugin that simplifies the management of multiple cookies on the same website. It allows users to open multiple accounts in the same browser at the same time by managing cookies efficiently. 

## Installation 

You can install CookiesClerk. 

1. Visit the [CookiesClerk page](https://chrome.google.com/webstore/detail/cookiesclerk/njmcgckgojpcificfmkicgnlbocgdhke?hl=zh-CN&authuser=0).  
2. Click the "Add to Chrome" button to install the plugin .
3. The plugin will be added to your browser .

### Features 

- Easily manage cookies for multiple accounts on the same website .
- Save, load and delete cookies for individual accounts .
- Clear cookies for closed accounts or all accounts. 
- Add and track domains for efficient cookie management .

## How to use 

1. Install the plugin as described in the Installation section .
2. Click the CookiesClerk icon in the browser toolbar to open a pop-up window. 3 .
3. Use the buttons in the popup window to manage cookies for different accounts and domains. 4 .
4. Add new accounts and domains to manage cookies more efficiently .


## Folders 

- `src` - The main source code .
  - `content-script` - Scripts and components that will be injected as `content_scripts` .
    - `iframe` - iframe vue3 app content script that will be injected into the page 
  - `background` - The background script .
  - `popup` - popup vuejs app root directory 
    - `pages` - Popup pages 
  - `options` - vuejs app root options 
    - `pages` - options page 
  - `pages` - application pages, common to all views (about, contact, validation, etc.) 
  - `components` - Automatically imported Vue components, shared across popups and options pages. 
  - `assets` - assets used in Vue components 
- `dist` - built-in files that also serve as stubs for Vite development. 
## Development 
```
pnpm dev  
```
Then load the extension in your browser using the dist/ folder .

Building 
To build the extension, run 
```
pnpm build  
```

## Contribute 
    
Contributions are welcome! If you find any bugs or want to suggest new features, feel free to [create an issue](https://github.com/14790897/CookiesClerk/issues) or submit a pull request. 

## License 

This project is licensed under the [MIT License](. /LICENSE) license. 

---

If you have any questions or need help, please feel free to contact us at [liuweiqing@liuweiqing.top](mailto:liuweiqing@liuweiqing.top) .

## Acknowledgments 
Thanks to https://github.com/mubaidr/vite-vue3-chrome-extension-v3 
