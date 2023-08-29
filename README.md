# CookiesClerk

CookiesClerk is a Google Chrome plugin that simplifies the management of multiple cookies for the same website. It allows users to have multiple accounts open in the same browser simultaneously by efficiently managing cookies.

## Installation

You can install CookiesClerk from the [Chrome Web Store](link-to-chrome-web-store).

1. Visit the [CookiesClerk page](link-to-chrome-web-store).
2. Click on the "Add to Chrome" button to install the plugin.
3. The plugin will be added to your browser.

## Features

- Easily manage cookies for multiple accounts on the same website.
- Save, load, and delete cookies for individual accounts.
- Clear cookies for closed accounts or all accounts.
- Add and track domains for efficient cookie management.

## Usage

1. Install the plugin as mentioned in the installation section.
2. Click on the CookiesClerk icon in the browser toolbar to open the popup.
3. Use the buttons in the popup to manage cookies for different accounts and domains.
4. Add new accounts and domains for more efficient cookie management.


## Folders

- `src` - main source.
  - `content-script` - scripts and components to be injected as `content_script`
    -  `iframe` content script iframe vue3 app which will be injected into page
  - `background` - scripts for background.
  - `popup` - popup vuejs application root
    - `pages` - popup pages
  - `options` - options vuejs application root
    - `pages` - options pages
  - `pages` - application pages, common to all views (About, Contact, Authentication etc)
  - `components` - auto-imported Vue components that are shared in popup and options page.
  - `assets` - assets used in Vue components
- `dist` - built files, also serve stub entry for Vite on development.
## Development
```
pnpm dev
```
Then load extension in browser with the dist/ folder.

Build
To build the extension, run
```
pnpm build
```

## Contributing
    
Contributions are welcome! If you find any bugs or want to suggest new features, feel free to [create an issue](https://github.com/14790897/CookiesClerk/issues) or submit a pull request.

## License

This project is licensed under the [MIT License](./LICENSE).

---

If you have any questions or need assistance, please don't hesitate to contact us at [liuweiqing@liuweiqing.top](mailto:liuweiqing@liuweiqing.top).

## Credits
Thanks https://github.com/mubaidr/vite-vue3-chrome-extension-v3/blob/master/README.md?plain=1
