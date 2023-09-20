//插件功能简介：用于保存同一网站的不同cookie，用户的每个网页对于同一网站有不同cookie，可以方便切换cookie， Account：键为域名加上网页标签的位置，值为cookie，trackedDomains：需要追踪，自动保存新的cookie的域名。 8.7
//目前的逻辑是同一时间对一个网站只存在一种cookie,如果要切换到具有新的cookie的相同根域名网页，则用新的cookie替换旧的cookie 8.7

type SameSiteStatus = 'no_restriction' | 'lax' | 'strict' | 'None'

// 定义接口和类型
interface Account {
  cookies: chrome.cookies.Cookie[]
  localstorage?: any
  manualSave?: boolean
  closed?: boolean
  refresh?: boolean //加载全部cookie后,是否需要手动刷新?
  alias?: string //用户手动修改的别名 9.13
}

// 定义变量的类型
// let accounts: Record<string, Account> = {}
// let trackedDomains: string[] = []
// let currentTabId: number | null = null
// let clearCookiesEnabled// 开关状态

// chrome.storage.sync.clear(function () {
//   console.log('所有云端同步数据已清除')
// })

// chrome.storage.local.clear(function () {
//   console.log('所有本地同步数据已清除')
// })

//以下代码中打开option页用于调试
chrome.runtime.onInstalled.addListener(function (details) {
  // if (details.reason === 'install' || details.reason === 'update') {
  //   //
  //   chrome.runtime.openOptionsPage()
  // }
  if (details.reason === 'install') {
    chrome.storage.local.set({ clearCookiesEnabled: true })
    chrome.storage.local.set({ modifyLinkEnabled: true }) // 9.12
  }
})

// chrome.storage.sync.set({ trackedDomains: JSON.stringify(['kaggle.com', 'saturnenterprise.io', 'twitter.com', 'bilibili.com']) })

//accounts存放在local，domains存放在sync
async function getStorageData<T>(storageKey: string, defaultValue: T = {} as T): Promise<T> {
  try {
    const result = await chrome.storage.local.get(storageKey)
    if (!result[storageKey]) {
      console.log('Notice: the value is null in getStorageData. storageKey:', storageKey) //这里不应该抛出错误，因为这个函数是用来获取数据的，如果没有数据，就返回默认值 9.13
    }
    return (result[storageKey] || defaultValue) as T
  } catch (error) {
    console.error(`Error fetching ${storageKey}:`, error)
    return defaultValue
  }
}

async function getTrackedDomains(): Promise<string[]> {
  try {
    const result = await chrome.storage.sync.get('trackedDomains')
    return JSON.parse(result.trackedDomains || '[]')
  } catch (error) {
    console.error('An error occurred while fetching trackedDomains:', error)
    return []
  }
}

function getURLFromAccountKey(accountKey: string): string {
  return accountKey.split('-')[0]
}

//每次重新打开浏览器插件时，需要检测一遍这个浏览器窗口的所有标签页，看是否和我现在账户列表里的域名加标签位置的域名是否匹配,如果不匹配，就把账户里对应的选项给删除 8.14
//这里如果初始化的话应该把ID全部重置为一个负值(-1)，这样就不会和正常的ID冲突了 8.22
async function checkTabsAndCleanAccounts() {
  const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27

  // 创建一个新的对象来存储修改后的账户
  const updatedAccounts: Record<string, Account> = {}
  Object.keys(accounts).forEach((accountKey) => {
    let modifiedKey = modifyTabIdFromKey(accountKey, true)

    // 检查键是否已经存在
    while (updatedAccounts.hasOwnProperty(modifiedKey)) {
      // 如果键已经存在，则减少键名中的数字
      modifiedKey = decrementNumberInKey(modifiedKey)
    }
    if (accounts[accountKey]) {
      accounts[accountKey].closed = true
    }
    // 将修改后的键及其对应的值放回新的对象
    updatedAccounts[modifiedKey] = accounts[accountKey]
  })
  console.log('已经修改不存在的选项卡cookie in checkTabsAndCleanAccounts')
  // 将更新后的账户列表保存回插件的存储
  chrome.storage.local.set({ accounts: updatedAccounts })
}

function decrementNumberInKey(key: string): string {
  const firstDashIndex = key.indexOf('-')
  const part1 = key.substring(0, firstDashIndex) // "somekey"
  const part2 = key.substring(firstDashIndex + 1) // "1-2-3"
  const keyParts = [part1, part2]
  const lastPart = keyParts[1]
  const newLastPart = (parseInt(lastPart, 10) - 1).toString()
  keyParts[1] = newLastPart
  return keyParts.join('-')
}

// 在浏览器启动时调用此函数
chrome.runtime.onStartup.addListener(checkTabsAndCleanAccounts)

chrome.runtime.onStartup.addListener(clearOnStartup) //9.19

async function clearOnStartup() {
  const onStartupClearEnabled = await getStorageData<boolean>('onStartupClearEnabled', false)
  if (onStartupClearEnabled) {
    removeClosedAccounts()
  }
}

//可能还少检查了一步，如果cookies的domain和你从网址中读取的不一样,我觉得最好是在你手动读取的domain前面加一个点
chrome.runtime.onMessage.addListener(async (request: any, _sender: chrome.runtime.MessageSender, _sendResponse: (response: any) => void) => {
  if (request.action == 'saveCookies') {
    try {
      console.log('手动saveCookies已经触发')
      // 获取当前活动窗口的活动标签
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      // 在调用之后打印返回的tabs数组
      console.log('Tabs returned from query: ', tabs)

      // 可以进一步检查tabs数组的长度，以确定是否有找到活动标签
      if (tabs.length === 0) {
        console.error('No active tab found in current window in savecookies manually.')
        return
      }
      const [rootDomain, key, isNotInDomain] = (await processDomain(tabs[0], false)) as [string, string, boolean] //isNotInDomain不一定返回布尔值吧 9.9
      if (isNotInDomain) {
        const trackedDomains = await getTrackedDomains() //8.27
        trackedDomains.push(rootDomain as string)
        await chrome.storage.sync.set({
          trackedDomains: JSON.stringify(trackedDomains),
        })
      } else {
        console.log('this domain is not added in savecookies manually because it has been added before')
      }
      const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
      if (request.account in accounts) {
        // await saveCurrentCookies(rootDomain, key, request.account)
        await saveCurrentCookies(rootDomain, request.account, true)
      } else {
        console.log("We don't receive the account you select in saveCookies manually", 'accounts:', accounts, 'request.account:', request.account)
      }
    } catch (error) {
      console.log('An error occurred in saveCookies manually:', error)
    }
  } else if (request.action == 'loadCookies') {
    console.log('手动loadCookies已经触发')
    try {
      const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
      if (request.account in accounts && accounts[request.account]) {
        // Get the URL for the account
        const rootDomain = getURLFromAccountKey(request.account)
        // Load cookies for this account
        // const rootDomain = getRootDomain(url) // TODO: Is this code necessary? 8.29
        if (rootDomain) {
          // 添加监听器
          const listener = async (tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete') {
              console.log('进入手动加载cookies的loadcookies部分')
              loadCookies(rootDomain, accounts[request.account].cookies)
              //加载好cookies之后要刷新页面 8.25
              await reloadActiveTab()
              // 移除监听器
              chrome.tabs.onUpdated.removeListener(listener)
            }
          }

          chrome.tabs.onUpdated.addListener(listener)

          // 确保URL是完整的
          const fullURL = rootDomain.startsWith('http') ? rootDomain : 'https://' + rootDomain
          await chrome.tabs.create({ url: fullURL })
          // await chrome.tabs.update(tabs[0].id, { url: fullURL }) //刷新界面 9.20
          console.log('已经刷新界面，url：', fullURL)
          // request.account = null 不能在这里使用，因为会先执行这个，再加载cookies，到时cookies无法访问 9.20
        } else {
          console.error('Unable to get rootDomain from url in loadCookies manually.')
        }
      } else {
        console.log('No cookies saved for this account 在手动loadCookies中.')
      }
    } catch (error) {
      console.log('An error occurred in loadCookies manually:', error)
    }
  } else if (request.action == 'clearCookies') {
    // 获取当前活动窗口的活动标签
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tabs.length === 0) {
      console.error('No active tab found in current window in savecookies manually.')
      return
    }
    //Don't throw error in this code, because the domain is not restricted
    const [rootDomain, key] = (await processDomain(tabs[0], false)) as [string, string]
    clearCookiesForDomain(rootDomain)
    reloadActiveTab()
  } else if (request.action == 'saveAllCookies') {
    const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
    saveUniqueAccounts(accounts)
  } else if (request.action == 'loadAllCookies') {
    handleLoadAllCookies(request.loadSavedSelectedAccounts)
  } else if (request.action == 'clearAllClosedCookies') {
    removeClosedAccounts()
  }
})

async function loadLocalStorage(tabId: number, data: Record<string, string>) {
  try {
    console.log('data in loadLocalStorage:', data)
    if (!data) {
      return
    }
    chrome.scripting.executeScript({
      target: { tabId },
      func: (data) => {
        Object.assign(localStorage, data)
      },
      args: [data],
    })
    console.log('localStorage loaded successfully!')
  } catch (error) {
    console.log('An error occurred in loadLocalStorage:', error)
  }
}

async function saveAndClearLocalStorage(tabId: number) {
  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // 保存当前页面的localStorage数据
        const savedData = { ...localStorage }
        // 清除当前页面的localStorage
        localStorage.clear()
        return savedData
      },
    })

    // 输出成功消息
    console.log('Successfully saved and cleared localStorage:')

    return result
  } catch (error) {
    console.log('An error occurred in saveAndClearLocalStorage:', error)
  }
}

async function reloadActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (tabs[0] && tabs[0].id) {
    await chrome.tabs.reload(tabs[0].id)
  } else {
    console.log('tabs[0]不存在，无法刷新页面 in loadCookies manually.')
  }
}

async function createTabForAccount(account: Account) {
  const rootDomain = getRootDomain(account.cookies[0].domain)
  if (!rootDomain) {
    throw new Error('Root domain not found in processDomain.')
  }
  const cookieUrl = (account.cookies[0].secure ? 'https://' : 'http://') + rootDomain.replace(/^\./, '')
  const tab = await chrome.tabs.create({ url: cookieUrl, active: false })
  console.log('create a tab for account:', cookieUrl)
  return { tab, rootDomain }
}

async function handleLoadAllCookies(loadSavedSelectedAccounts: boolean) {
  try {
    let savedAccounts: Record<string, Account>
    const tabIdDataMap: Record<number, { key: string; account: Account }> = {}
    if (loadSavedSelectedAccounts) {
      savedAccounts = (await getStorageData('savedSelectedAccounts')) as Record<string, Account>
    } else {
      savedAccounts = (await getStorageData('savedAccounts')) as Record<string, Account>
    }
    // const newAccounts: Record<string, Account> = {}
    console.log('savedAccounts:', savedAccounts)
    //下面没必要再获得一次，只要深拷贝 9.19
    const accounts = await getStorageData<Record<string, Account>>('accounts') // 9.13
    for (const [key, account] of Object.entries(savedAccounts)) {
      if (!account.cookies || !account.cookies[0]) {
        console.log('No cookies for this account, account key:', key)
        continue
      }
      // todo 按道理来说，应该是不会立刻激活页面的，但实际会跳到第一个页面，所以需要在这里先创建一个tab，然后再把它关掉？？？这个想法不错9.19
      const result = await createTabForAccount(account)
      const tab = result.tab
      const rootDomain = result.rootDomain
      account.refresh = true
      //这里其实不用全部都保存，可以只保存账户的cookies 9.20
      delete account.alias // 将alias删除，这样可以使用自动清除close且无alias的页面9.19
      if (!tab.id) {
        console.log('No tab id found in createTabForAccount.')
        continue
      }
      const newKey = `${rootDomain}-${tab.id}`
      tabIdDataMap[tab.id] = { key: newKey, account } // 存储 tabId 和相应数据的映射
      accounts[newKey] = account
      // newAccounts[newKey] = account
    }
    await chrome.storage.local.set({ tabIdDataMap: tabIdDataMap })
    //update the accounts in this runtime, so we can use it in this extension 8.28
    // await chrome.storage.local.set({ accounts: newAccounts })
    await chrome.storage.local.set({ accounts: accounts })

    console.log('Updated accounts saved successfully!')
  } catch (error) {
    console.error('An error occurred in handleLoadAllCookies:', error)
  }
}

// 监听标签页更新事件
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab) {
  try {
    // 可能同时刷新多个标签页,要对符合条件的都执行脚本  9.12
    const modifyLinkEnabled = await getStorageData<boolean>('modifyLinkEnabled', false) //9.12
    if (modifyLinkEnabled) {
      await processDomain(tab) //用于判断当前网页是否在追踪域名之内 9.13
      modifyLinksInTab(tabId)
    }
    // const tabIdDataMap: Record<number, { key: string; account: Account }> = await getStorageData('tabIdDataMap')
    // // 检查是否存在映射数据
    // if (Object.prototype.hasOwnProperty.call(tabIdDataMap, tabId) && changeInfo.status === 'complete') {
    //   const { key, account } = tabIdDataMap[tabId]
    //   console.log(`Tab ${tabId} loaded for account key in onUpdated: ${key}`)
    //   const tab = await chrome.tabs.get(tabId) //At first  it is currenttabID, but now I change it to tabID.
    //   const [rootDomain, _] = (await processDomain(tab)) as [string, string]
    //   await chrome.storage.sync.set({ selectedAccount: key })
    //   await loadCookies(rootDomain, account.cookies)
    //   delete tabIdDataMap[tabId] // 从映射中移除数据
    //   await chrome.storage.local.set({ tabIdDataMap }) // 更新存储中的映射数据
    //   await chrome.tabs.reload(tabId)
    // }
    //下面的代码是为了在刷新界面的时候如果目标网址是要追踪的网址那么就加载对应的cookies,主要是为上面的加载所有保存的账户的网页所服务的,因为它会立即切换到第一个网页,但是这时候还没有运行loadcookies的代码,所以需要在这里运行一下 9.12
    const accounts = await getStorageData<Record<string, Account>>('accounts')
    if (changeInfo.status === 'complete') {
      for (const [key, account] of Object.entries(accounts)) {
        if (account.refresh) {
          if (key.includes(tabId.toString())) {
            const [rootDomain, _] = (await processDomain(tab)) as [string, string]
            await chrome.storage.sync.set({ selectedAccount: key })
            await loadCookies(rootDomain, account.cookies)
            await chrome.tabs.reload(tabId)
            account.refresh = false
          }
        }
      }
    }
    await chrome.storage.local.set({ accounts: accounts })
  } catch (error) {
    console.log('An error occurred in onUpdated:', error)
  }
})

function areAccountsSame(account1: Account, account2: Account): boolean {
  if (account1.cookies.length !== account2.cookies.length) return false
  //The first method is to use the for loop to check, assuming cookies are organized
  for (let i = 0; i < account1.cookies.length; i++) {
    const cookie1 = account1.cookies[i]
    const cookie2 = account2.cookies[i]

    if (!isCookiePresent([cookie1], cookie2)) {
      return false
    }
  }

  return true
  //The second method is to use the every() method to check, assuming cookies are unorganized
  // return account1.cookies.every((cookie1) => isCookiePresent(account2.cookies, cookie1))
}

async function saveUniqueAccounts(accounts: Record<string, Account>): Promise<void> {
  const uniqueAccounts: Record<string, Account> = {}
  for (const [key1, account1] of Object.entries(accounts)) {
    let isUnique = true

    for (const [key2, account2] of Object.entries(accounts)) {
      if (key1 !== key2 && areAccountsSame(account1, account2)) {
        isUnique = false
        break
      }
    }

    if (isUnique) {
      uniqueAccounts[key1] = account1
    }
  }

  // 保存独特的账户
  await chrome.storage.local.set({ savedAccounts: uniqueAccounts })
  console.log('Unique accounts saved successfully!')
}

//这段代码的作用是当用户离开网页的时候，保存这个网页cookie，同时在进入的网页加载new网页的cookie
chrome.tabs.onActivated.addListener(function (activeInfo) {
  handleTabChange(activeInfo.tabId)
})

async function removeClosedAccounts() {
  const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
  // 创建一个新的对象来存储未被删除的账户
  const updatedAccounts: Record<string, Account> = {}

  // 遍历现有的账户
  for (const [key, account] of Object.entries(accounts)) {
    // 如果账户没有被标记为关闭，则添加到新的对象中
    if (!account.closed || account.alias) {
      //如果有alias，说明是用户手动添加的，不应该删除
      //小心这里操作空对象，会报错，目前已修复9.9
      updatedAccounts[key] = account
    }
  }
  // 将更新后的账户列表保存回插件的存储
  await chrome.storage.local.set({ accounts: updatedAccounts })
  console.log('已经删除所有标记为删除的账户 in removeDeletedAccounts')
}

//This function should be triggered manually
// chrome.windows.onRemoved.addListener(function (windowId) {
//   removeClosedAccounts()
//   console.log('已经删除所有标记为closed的账户 in onRemoved')
//   console.log(`Window with ID ${windowId} has been removed.`)
// })

function extractTabIdFromKey(key: string, modify = false) {
  const keyParts = key.split('-')
  if (modify) {
    return keyParts[0] + '-' + '0'
  }
  return keyParts[keyParts.length - 1] // tabID存储在键的最后一部分
}

const modifyTabIdFromKey = extractTabIdFromKey

// Handle tab closure events
chrome.tabs.onRemoved.addListener(async function (tabId, _removeInfo) {
  try {
    const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
    for (const key in accounts) {
      const storedTabId = extractTabIdFromKey(key)
      if (storedTabId === String(tabId)) {
        // delete accounts[key]
        accounts[key].closed = true
      }
    }
    // 存储更新后的`accounts`对象
    await chrome.storage.local.set({ accounts: accounts })
  } catch (error) {
    console.log('An error occurred in remove listener:', error)
  }
})

//这段代码的功能是激活新的tab时,先保存旧的页面的 cookies，然后清除旧的页面的cookies，然后加载新的页面的cookies
async function handleTabChange(tabId: number) {
  let currentTabId: number | null = null
  let clearCookiesEnabled = false
  let accounts: Record<string, Account> = {}
  try {
    // If there is a currently active tab, save its cookies
    currentTabId = await getStorageData<number | null>('currentTabId', null) //8.27
    clearCookiesEnabled = await getStorageData<boolean>('clearCookiesEnabled', false) //8.27
    accounts = await getStorageData<Record<string, Account>>('accounts') //8.27

    if (currentTabId !== null) {
      const tab = await chrome.tabs.get(currentTabId)
      console.log('The tab we have just left in handleTabChange:', tab.url)

      const [rootDomain, key] = (await processDomain(tab)) as [string, string]
      // chrome.tabs.sendMessage(tabId, { action: 'showMask' }) // To show the mask in the content script, corresponding with onUpdated 8.26

      await saveCurrentCookies(rootDomain, key) //todo 这里可以将里面的保存提到外面来执行 9.13
      // save and clear localstorage 9.13
      const result = await saveAndClearLocalStorage(currentTabId)
      try {
        if (result && result[0] && result[0].result) {
          accounts[key].localstorage = result[0].result
          await chrome.storage.local.set({ accounts: accounts })
        } else {
          console.log("can't get result in saveAndClearLocalStorage in handleTabChange.")
        }
      } catch (error) {
        console.log('在handletapchange中需要忽视的报错 in saveAndClearLocalStorage:', error)
      }

      console.log('handleTabChange中saveCurrentCookies已触发')

      //用户可以选择是否清除
      if (!clearCookiesEnabled) {
        currentTabId = tabId
        chrome.storage.local.set({ currentTabId: tabId })
        console.log("%c clearCookiesEnabled is false, we don't clear and load", 'background: #ff0000; color: #fff')
        return
      }
      //load之前先把已经存在的cookie删除 8.18
      //So in fact we should compare the cookies first. If they are same, then we shouldn't do anything.
      await clearCookiesForDomain(rootDomain)
    } else {
      console.log('%c currentTabId is null, there may be a bug', 'background: #ff0000; color: #fff')
    }
  } catch (error) {
    console.log('在handletapchange中需要忽视的报错processDomain报错,发生在保存以及清除cookies时', error)
  }

  // Update it to the currently active tab ID
  currentTabId = tabId
  chrome.storage.local.set({ currentTabId: tabId })

  //If the code below can't load cookies, then selected account is empty
  await chrome.storage.sync.set({ selectedAccount: '' })

  try {
    // Get the URL and index of the newly activated tab
    const tab = await chrome.tabs.get(tabId) //At first  it is currenttabID, but now I change it to tabID.
    const [rootDomain, key] = (await processDomain(tab)) as [string, string]
    //make new links only open in the current tab 8.26

    // modifyLinksInTab(tabId) //It is not necessary to use await 9.9

    // Load the appropriate cookies
    if (key in accounts && accounts[key]) {
      //让popup页面显示当前所在的账户，popup页面的显示是通过sync.get来实现的(由于每次打开会自动获取，所以不需要持续监听) 为什么要写把这个放在if语句里面?因为这说明这是一个新打开的页面,暂时不保存可以方便用户创建自己的账户
      await chrome.storage.sync.set({ selectedAccount: key })
      //The code to create a mask 8.29
      // await injectMaskScript(tabId)

      await loadCookies(rootDomain, accounts[key].cookies)

      await loadLocalStorage(tabId, accounts[key].localstorage)

      // chrome.tabs.sendMessage(tabId, { action: 'hideMask' }) // To hide the mask in the content script, corresponding with onUpdated 8.26

      //The code to remove a mask 8.29
      // await removeMaskScript(tabId)
    } else {
      console.log('域名为追踪域名，但是当前域名-索引没有在保存账户中,所以无法从中加载cookies', 'rootdomain:', rootDomain, 'key:', key)
    }
  } catch (error) {
    console.log('An error occurred in handleTabChange in loadCookies:', error)
  }
}

// Save the current cookies for the specified tab
async function saveCurrentCookies(rootDomain: string, key: string, manualSave: boolean | string = false): Promise<void> {
  try {
    const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27

    // Save the current cookies for this URL and tab index
    const cookies = await chrome.cookies.getAll({ domain: rootDomain })

    // 确保 accounts[key] 已初始化
    accounts[key] = accounts[key] || {}
    accounts[key].cookies = cookies
    //When we use savecookies manually, we should reset the value of manualsave
    // if (typeof manualSave == 'string') {
    //在手动保存的时候会把 Account的key给传进来,自动保存为正常的boolen
    accounts[key].manualSave = !!manualSave
    // }
    console.log('成功保存cookie, account key为:', key)

    await chrome.storage.local.set({ accounts: accounts })
  } catch (error) {
    console.log('An error occurred in saveCurrentCookies. Notice this error may cause the function not work:', error)
  }
}

// 辅助函数：根据 cookie 名称调整 cookie 属性
function adjustCookieForSpecialNames(cookie: any) {
  // 如果 cookie 名称以 "__Host-" 开头
  if (cookie.name.startsWith('__Host-')) {
    delete cookie.domain // 移除 domain 属性
  }
  return cookie
}

function isCookiePresent(existingCookies: chrome.cookies.Cookie[], cookieToCheck: chrome.cookies.Cookie): boolean {
  return existingCookies.some(
    (existingCookie) =>
      existingCookie.name === cookieToCheck.name && existingCookie.value === cookieToCheck.value && existingCookie.path === cookieToCheck.path && existingCookie.domain === cookieToCheck.domain
  )
}

// Load the specified cookies for the specified URL
async function loadCookies(rootDomain: string, cookies: chrome.cookies.Cookie[]): Promise<void> {
  try {
    console.log('loadCookies已触发,clear的输出应该在此之前')
    const existingCookies = await chrome.cookies.getAll({ domain: rootDomain })
    const promises = Object.values(cookies).map(async (cookie) => {
      if (!isCookiePresent(existingCookies, cookie)) {
        const cookieUrl = (cookie.secure ? 'https://' : 'http://') + cookie.domain.replace(/^\./, '') // 移除域名开始的点
        if (cookie.sameSite == undefined) {
          console.log('cookie.sameSite:', cookie.sameSite)
          cookie.sameSite = 'None'
        }
        const origin_cookie = {
          url: cookieUrl,
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path,
          secure: cookie.secure,
          httpOnly: false,
          // sameSite: cookie.sameSite,
          sameSite: 'strict',
          expirationDate: cookie.expirationDate,
        }
        // const fixedCookie = fixCookieDomainAndUrl(origin_cookie)
        // 使用辅助函数来调整特殊名称的 cookie 属性,suah as '_Host'
        const fixedCookie = adjustCookieForSpecialNames(origin_cookie)
        // console.log('以下cookie将要被设置:', fixedCookie)
        await chrome.cookies.set(fixedCookie)
        console.log('Cookie set successfully in loadcookies!')
      } else {
        console.log('%c Cookie already exists, skip setting.', 'background: #ff0000; color: #fff')
      }
    })

    // Wait for all cookies to be processed
    await Promise.all(promises)

    // 在所有的 cookies 处理完成后存储 accounts
    // await chrome.storage.local.set({ accounts: accounts })
  } catch (error) {
    console.log('An error occurred in loadCookies:', error)
  }
}

// 清除特定域名的所有 cookies
// todo 增加对local storage的清除
async function clearCookiesForDomain(domain: string) {
  try {
    const cookies = await chrome.cookies.getAll({ domain })

    console.log('%c clear----------------------', 'background: #00ff00; color: #000')
    console.log(`%c Found ${cookies.length} cookies for domain: ${domain}`, 'background: #00ff00; color: #000')

    const promises = cookies.map(async (cookie) => {
      const { name, domain, storeId } = cookie
      const url = 'http' + (cookie.secure ? 's' : '') + '://' + domain

      const result = await chrome.cookies.remove({ url, name, storeId })

      if (!result) {
        console.error(`%c Failed to remove cookie named ${name} from ${url}.`, 'background: #ff0000; color: #fff')
      } else {
        // console.log(`%c Successfully removed cookie named ${name} from ${url}.`, 'background: #00ff00; color: #000')
      }
    })

    // Once all cookies are removed, print the final log line
    await Promise.all(promises)
    console.log('%c clear----------------------', 'background: #00ff00; color: #000')
  } catch (error) {
    console.error('%c Error during cookie operation:', 'background: #ff0000; color: #fff', error)
  }
}

chrome.tabs.onCreated.addListener(() => {
  chrome.storage.sync.set({ selectedAccount: '' })
  // showNotification()
})

function isValidURL(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (_) {
    return false
  }
}

async function processDomain(tab: chrome.tabs.Tab, throwErrors = true): Promise<[string, string] | null | [string, string, boolean]> {
  if (!tab) {
    throw new Error('Tab not found in processDomain')
  }
  if (tab.pendingUrl && isSpecialPage(tab.pendingUrl)) {
    throw new Error(`pendingUrl is specialPage  in processDomain: ${tab.pendingUrl}`)
  }

  if (!tab.url) {
    throw new Error(`URL not found for tab in processDomain: ${tab.id}`)
  }

  const url = new URL(tab.url).origin

  if (!isValidURL(url)) {
    throw new Error('Invalid URL in processDomain:' + url)
  }

  const rootDomain = getRootDomain(url)
  if (!rootDomain) {
    throw new Error('Root domain not found in processDomain.')
  }
  const trackedDomains = await getTrackedDomains() //8.27

  if (trackedDomains.includes(rootDomain)) {
    const key = `${rootDomain}-${tab.id}`
    return [rootDomain, key]
  } else {
    if (throwErrors) {
      throw new Error('This domain is not tracked in processDomain. Root domain: ' + rootDomain)
    } else {
      const key = `${rootDomain}-${tab.id}`
      return [rootDomain, key, true]
    }
  }
}

function getRootDomain(url: string): string | null {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url // 添加默认的 http 协议
    }
    const domain = new URL(url).hostname
    const parts = domain.split('.')
    if (parts.length < 2) return domain // 如果域名不包括至少两部分，则返回整个域名
    return parts.slice(-2).join('.') // 返回最后两个部分，用点连接
  } catch (e) {
    console.error('Invalid URL:', e)
    return null // 如果 URL 不合法，返回 null 或其他适当的默认值
  }
}

function isSpecialPage(pendingUrl: string) {
  return pendingUrl.startsWith('chrome://') || pendingUrl.startsWith('about:') || pendingUrl.startsWith('file://')
}

async function injectMaskScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: function () {
        // 创建遮罩层div
        const mask = document.createElement('div')
        mask.id = 'loading-mask'
        mask.style.position = 'fixed'
        mask.style.top = '0'
        mask.style.right = '0'
        mask.style.bottom = '0'
        mask.style.left = '0'
        mask.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'
        mask.style.display = 'flex'
        mask.style.alignItems = 'center'
        mask.style.justifyContent = 'center'
        mask.style.zIndex = '1000'

        // 创建加载指示器div
        const loader = document.createElement('div')
        loader.className = 'loader'
        loader.style.width = '24px'
        loader.style.height = '24px'
        loader.style.border = '4px solid'
        loader.style.borderTop = '4px solid gray'
        loader.style.borderRadius = '50%'
        loader.style.animation = 'spin 1s linear infinite'

        // 添加加载指示器到遮罩层
        mask.appendChild(loader)

        // 添加遮罩层到页面
        document.body.appendChild(mask)

        // 可选：定义旋转动画
        const style = document.createElement('style')
        style.innerHTML = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`
        document.head.appendChild(style)
      },
    })
    console.log('Mask script injected, handleTabChange中injectMaskScript触发')
  } catch (error) {
    console.log('Failed to inject mask script', error)
  }
}

async function removeMaskScript(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: function () {
        const mask = document.getElementById('loading-mask')
        if (mask) {
          mask.remove()
        }
      },
    })
    console.log('Mask script removed, handleTabChange中removeMaskScript触发')
  } catch (error) {
    console.log('Failed to remove mask script', error)
  }
}

async function modifyLinksInTab(tabId: number) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: function () {
        // 函数：修改链接和表单
        function modifyLinksAndForms() {
          document.querySelectorAll('a').forEach(function (link) {
            link.target = '_self'
          })
          // document.querySelectorAll('form').forEach(function (form) {
          //   form.addEventListener('submit', function (event) {
          //     event.preventDefault()
          //     window.location.href = form.action
          //   })
          // })
        }

        // 初始调用
        modifyLinksAndForms()

        // 添加点击事件监听器
        // document.body.addEventListener('click', function (event) {
        //   if (event.target && event.target.tagName === 'A') {
        //     event.preventDefault()
        //     window.location.href = event.target.href
        //   }
        // })

        // 重写window.open
        window.open = function (url) {
          window.location.href = url as string
          return null
        }

        // 使用MutationObserver监听DOM变化
        const observer = new MutationObserver(function (mutations) {
          mutations.forEach(function (mutation) {
            if (mutation.type === 'childList') {
              modifyLinksAndForms()
            }
          })
        })

        // 配置观察选项
        const config = { childList: true, subtree: true }

        // 开始观察
        observer.observe(document.body, config)
      },
    })
    console.log('Links and forms are modified to open in the same tab.')
  } catch (error) {
    console.log('Failed to modify links and forms', error)
  }
}

// 清除旧通知
const clearPreviousNotification = (notificationId: string) => {
  chrome.notifications.clear(notificationId, (wasCleared) => {
    if (wasCleared) {
      console.log('Previous notification cleared')
    } else {
      console.log('Previous notification not found')
    }
  })
}

chrome.notifications.onButtonClicked.addListener(async function loadCookiesFromLastTab(clickedNotificationId, buttonIndex) {
  if (clickedNotificationId === '1') {
    if (buttonIndex === 0) {
      // 用户点击了 Yes 按钮
      // const clearCookiesEnabled = await getStorageData<boolean>('clearCookiesEnabled', false) //8.27
      const currentTabId = await getStorageData<number | null>('currentTabId', null) //我们认为created的先触发所以可以用之前activated时保存的currentTabID
      const accounts = await getStorageData<Record<string, Account>>('accounts') //8.27
      const keys = Object.keys(accounts)
      let isMatched = false // Flag to track if a match is found

      for (const key of keys) {
        if (parseInt(extractTabIdFromKey(key)) === currentTabId) {
          isMatched = true
          const url = getURLFromAccountKey(key)
          const rootDomain = getRootDomain(url) // todo Is this code necessary? 8.29
          if (rootDomain) {
            await loadCookies(rootDomain, accounts[key].cookies)
            //加载好cookies之后要刷新页面 8.25
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
            if (tabs[0] && tabs[0].id) {
              await chrome.tabs.reload(tabs[0].id)
            } else {
              console.log('tabs[0]不存在，无法刷新页面 in loadCookies manually.')
            }
          } else {
            console.error('Unable to get rootDomain from url in loadCookies manually.')
          }
          console.log('loadCookiesFromLastTab中loadCookies')

          console.log('%c ---------------------------------------------------', 'background: #00ff00; color: #000')
          console.log('%c The tab we hav just left is tracked, so we can keep these cookies in new tab', 'background: #ff0000; color: #fff')
          console.log('%c ---------------------------------------------------', 'background: #00ff00; color: #000')
          break // Found a match, no need to continue looping
        }
      }
      // if (isMatched) {
      //   chrome.storage.local.set({ clearCookiesEnabled: false })
      // } else {
      //   chrome.storage.local.set({ clearCookiesEnabled: clearCookiesEnabled })
      // }
    } else if (buttonIndex === 1) {
      // 用户点击了 No 按钮
      // 执行 No 的操作,Don't do anything
    }
  }
})

const showNotification = () => {
  const notificationId = '1' // Use a unique ID for your notification

  // 清除之前的通知
  clearPreviousNotification(notificationId)

  const options = {
    type: 'basic' as chrome.notifications.TemplateType,
    iconUrl: chrome.runtime.getURL('src/assets/icon.png'),
    title: 'CookiesClerk',
    message: 'Do you want to use the cookies from last tab?',
    buttons: [{ title: 'Yes' }, { title: 'No' }],
  }

  chrome.notifications.create(notificationId, options, () => {
    console.log('%c Notification created', 'background: #ff0000; color: #fff')
  })
}

// function fixCookieDomainAndUrl(cookie: CookieType) {
//   const fixedCookie = { ...cookie }

//   // Fix the domain
//   if (fixedCookie.domain.startsWith('.www.')) {
//     fixedCookie.domain = fixedCookie.domain.replace('.www.', '.')
//   }

//   // Fix the url
//   if (fixedCookie.url.includes('://.www.')) {
//     fixedCookie.url = fixedCookie.url.replace('://.www.', '://www.')
//   }

//   return fixedCookie
// }

// function getRootDomain(url: string): string | null {
//   try {
//     if (!url.startsWith('http://') && !url.startsWith('https://')) {
//       url = 'http://' + url // 添加默认的 http 协议
//     }
//     const domain = new URL(url).hostname // 使用 URL 类来解析域名
//     const parts = domain.split('.').reverse()

//     if (
//       parts.length > 2 &&
//       parts[1].match(/^(com|co|org|gov|edu|ac|net|mil)$/)
//     ) {
//       return parts[2] + '.' + parts[1] + '.' + parts[0]
//     } else {
//       return parts[1] + '.' + parts[0]
//     }
//   } catch (e) {
//     return null // 如果 URL 不合法，返回 null 或其他适当的默认值
//   }
// }
