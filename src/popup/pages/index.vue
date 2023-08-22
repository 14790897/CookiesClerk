<template>
  <div class="container mx-auto p-8 ">
    <h1 class="text-2xl font-bold mb-4">Cookie Clerk</h1>
    <div class="flex flex-wrap mb-4">
      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2" @click="addAccount">Add
        Account</button>
      <select id="accountSelect" v-model="selectedAccount" class="form-select block w-full mt-1 mr-2">
        <option v-for="(accountData, accountKey) in accounts" :key="accountKey" :value="accountKey">
          {{ modifyAccountKey(accountKey) }} {{ accountData && accountData.manualSave ? '[Manually Saved]' : '' }}
          {{ accountData && accountData.deleted ? '[closed]' : '' }}
        </option>
      </select>
      <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mr-2"
        @click="saveCookies">Save Cookies</button>
      <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mr-2"
        @click="loadCookies">Load Cookies</button>
      <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
        @click="deleteAccount">Delete Account</button>
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mr-2"
          @click="deleteAllAccounts">Delete All Account</button>


    </div>
    <h1 class="text-2xl font-bold mb-4">Manage Tracked Domains</h1>
    <div class="flex flex-wrap mb-4">
      <input v-model="newDomain" type="text" placeholder="Add new domain" required
        class="form-input block w-48 mt-1 mr-2">
      <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
        @click="addDomain">Add</button>
      <label class="flex items-center space-x-2">
        <input v-model="clearCookiesEnabled" type="checkbox" />
        <span>开启对追踪域名的新选项卡清除cookie功能</span>
      </label>
    </div>
    <ul id="domain-list" class="list-inside list-decimal">
      <li v-for="(domain, index) in domains" :key="domain" class="mb-2">
        {{ domain }}
        <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
          @click="deleteDomain(index)">Delete</button>
      </li>
    </ul>
  </div>

  <div class="text-center m-4">
    <RouterLink to="/about">About</RouterLink>
  </div>
</template>


<script lang="ts">
import { defineComponent, ref } from 'vue';
import { watch } from 'vue';

export default defineComponent({
  setup() {
    const selectedAccount = ref<string | null>(null);
    const newDomain = ref<string>('');
    const domains = ref<string[]>(['www.kaggle.com']);
    const accounts = ref<Record<string, any>>({});
    const clearCookiesEnabled = ref(false); // 设置一个反应性变量来追踪开关状态

    // 使用 watch 来监视 trackedDomains 的改变
    watch(domains, (newValue) => {
      // 当 domains 改变时，将它存储到 Chrome 存储区
      chrome.storage.sync.set({ 'trackedDomains': JSON.stringify(newValue) }, () => {
        if (chrome.runtime.lastError) {
          console.error('存储失败:', chrome.runtime.lastError);
        } else {
          console.log('存储成功!');
        }
      });
    }, { immediate: true });
    // 当selectedAccount改变时，保存其值
    watch(selectedAccount, (newValue) => {
      chrome.storage.sync.set({ selectedAccount: newValue });
    });
    watch(clearCookiesEnabled, (newValue) => {
      chrome.runtime.sendMessage({ clearCookiesEnabled: newValue });
      chrome.storage.sync.set({ clearCookiesEnabled: newValue });
    });

    // 加载存储的selectedAccount值
    chrome.storage.sync.get('selectedAccount', (data) => {
      selectedAccount.value = data.selectedAccount || null;
    });

    chrome.storage.sync.get('clearCookiesEnabled', (data) => {
      clearCookiesEnabled.value = data.clearCookiesEnabled || true;
    });

    chrome.storage.local.get('accounts', (data) => {
      console.log('data.accounts in popup', data.accounts);
      accounts.value = data.accounts || {};
    });

    chrome.storage.sync.get('trackedDomains', (data) => {
      if (data.trackedDomains) {
        // 如果云端有值，使用云端的值
        domains.value = JSON.parse(data.trackedDomains);
      } else if (!domains.value) {
        // 如果 domains.value 为空或未定义，设置为一个空数组
        domains.value = [];
      }
      console.log('domains.value in popup', domains.value);

  })

    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === 'local' && changes.accounts) {
        // Update the local variable with the new value from storage
        accounts.value = changes.accounts.newValue || {};
      }
    })
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === 'sync' && changes.trackedDomains) {
        // Update the local variable with the new value from storage
        const newValue = JSON.parse(changes.trackedDomains.newValue);
        if (JSON.stringify(domains.value) !== JSON.stringify(newValue)) {
          domains.value = newValue;
        }
      }
    })

    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'src/assets/icon.png', // 你的图标URL
      title: 'save success',
      message: 'success'
    });

    const modifyAccountKey = (str: string) => {
      let regex = /-(\d+)$/;
      let match = str.match(regex);

      if (match) {
        let originalNumber = parseInt(match[1]);
        let newNumber = originalNumber + 1;
        str = str.replace(regex, `-${newNumber}`);
      }

      return str
    }

    const addAccount = () => {
      promptForAccountName("Account added successfully");
    };

    const saveCookies = async () => {
      if (!selectedAccount.value) {
        await promptForAccountName("Account created. Cookies saved.");
      }
      if (selectedAccount.value) {
        chrome.runtime.sendMessage({
          action: "saveCookies",
          account: selectedAccount.value,
        });
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'src/assets/icon.png', // 你的图标URL
          title: 'save success',
          message: 'success'
        });
      } else {
        alert("No account selected or created. Cannot save cookies.");
      }
    };

    const loadCookies = () => {
      if (!selectedAccount.value) {
        alert("No account selected");
        return;
      }

      chrome.runtime.sendMessage({
        action: "loadCookies",
        account: selectedAccount.value,
      });
    };

    const deleteAccount = () => {
      if (!selectedAccount.value) {
        alert("No account selected");
        return;
      }
      // 确认是否要删除
      if (window.confirm(`Are you sure you want to delete account ${selectedAccount.value}?`)) {
        // 复制当前的账户
        const updatedAccounts = { ...accounts.value };
        // 删除选择的账户
        delete updatedAccounts[selectedAccount.value];
        // 更新存储
        chrome.storage.local.set({ accounts: updatedAccounts }, () => {
          if (chrome.runtime.lastError) {
            alert("Error: " + chrome.runtime.lastError.message);
          } else {
            alert(`Account ${selectedAccount.value} deleted successfully`);
            accounts.value = updatedAccounts;
            selectedAccount.value = null;
          }
        });
      }
    };

    const deleteAllAccounts = () => {
      // 确认是否要删除所有账户
      if (window.confirm("Are you sure you want to delete all accounts?")) {
        // 清空存储中的账户数据
        chrome.storage.local.set({ accounts: {} }, () => {
          if (chrome.runtime.lastError) {
            alert("Error: " + chrome.runtime.lastError.message);
          } else {
            alert("All accounts deleted successfully");
            accounts.value = {};
            selectedAccount.value = null;
          }
        });
      }
    };
  
    const addDomain = () => {
      if (!newDomain.value || !isValidDomain(newDomain.value)) {
        alert('Please enter a valid domain.');
        return;
      }
      const rootDomain = getRootDomain(newDomain.value);
      if (rootDomain !== null) {
        if (domains.value.includes(rootDomain)) {
          alert('Domain is already tracked.');
          return;
        }
        domains.value.push(rootDomain);
        newDomain.value = '';
      } else {
        alert('Please enter a valid domain.没有获得根域名');
        return;
      }
    };


    const deleteDomain = (index: number) => {
      domains.value.splice(index, 1);
    };

    const isValidDomain = (domain: string): boolean => {
      // 正则表达式用于匹配有效的域名
      const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
      return pattern.test(domain);
    };

    const getRootDomain = (url: string): string | null => {
      try {
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          url = 'http://' + url // 添加默认的 http 协议
        }
        const domain = new URL(url).hostname
        // 你的域名提取逻辑
        return domain
      } catch (e) {
        console.error('Invalid URL:', e)
        return null // 如果 URL 不合法，返回 null 或其他适当的默认值
      }
    }
    // const getRootDomain = (url: string): string | null => {
    //   try {
    //     if (!url.startsWith('http://') && !url.startsWith('https://')) {
    //       url = 'http://' + url; // 添加默认的 http 协议
    //     }
    //     const domain = new URL(url).hostname; // 使用 URL 类来解析域名
    //     const parts = domain.split('.').reverse();

    //     if (
    //       parts.length > 2 &&
    //       parts[1].match(/^(com|co|org|gov|edu|ac|net|mil)$/)
    //     ) {
    //       return parts[2] + '.' + parts[1] + '.' + parts[0];
    //     } else {
    //       return parts[1] + '.' + parts[0];
    //     }
    //   } catch (e) {
    //     return null; // 如果 URL 不合法，返回 null 或其他适当的默认值
    //   }
    // };
    const promptForAccountName = (successMessage: string) => {
      return new Promise<void>((resolve, reject) => {
        let accountName = prompt("Enter a name for the new account:");
        if (accountName) {
          if (!(accountName in accounts.value)) {
            const newAccount = { ...accounts.value };
            newAccount[accountName] = null;
            chrome.storage.local.set({ accounts: newAccount }, () => {
              if (chrome.runtime.lastError) {
                alert("Error: " + chrome.runtime.lastError.message);
                reject(chrome.runtime.lastError); // 错误处理
              } else {
                alert(successMessage);
                accounts.value = newAccount; // 更新组件状态
                selectedAccount.value = accountName; // 更新组件状态
                resolve(); // 完成 Promise
              }
            });
          } else {
            alert("Account already exists");
            resolve(); // 没有错误但也没有创建账户
          }
        } else {
          resolve(); // 用户取消或未输入名称
        }
      });
    };


    // Expose to the template
    return {
      selectedAccount,
      newDomain,
      domains,
      accounts,
      clearCookiesEnabled,
      addAccount,
      saveCookies,
      loadCookies,
      deleteAccount,
      deleteAllAccounts,
      addDomain,
      deleteDomain,
      isValidDomain,
      getRootDomain,
      promptForAccountName,
      modifyAccountKey,
    };
  },
});
</script>



