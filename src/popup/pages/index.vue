<template>
  <div class="container mx-auto p-2 ">
    <h1 class="text-lg text-center font-bold mb-2" data-i18n="title">CookiesClerk</h1>

    <div class="flex-col">
      <!-- Account Management -->
      <div class="border p-2 mb-2 flex-1">
        <h2 class="text-base text-center font-bold mb-2" data-i18n="accountManagement">Account Management</h2>
        <div class="flex items-center mb-2">
          <select id="accountSelect" v-model="selectedAccount" class="form-select mt-1 mr-2" style="min-width: 200px;">
            <option v-for="(accountData, accountKey) in accounts" :key="accountKey" :value="accountKey">
              {{ accountData.alias || accountKey }} {{ accountData && accountData.manualSave ? '[Manually Saved]' : '' }}
              {{ accountData && accountData.closed ? '[closed]' : '' }}
            </option>
          </select>
          <div class="flex ">
            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded mr-1 " @click="addAccount"
              data-i18n="addAccount">Add</button>
            <!-- Rename Button 9.13-->
            <button class="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded" @click="renameAccount"
              data-i18n="renameAccount">Rename</button>
          </div>
        </div>

        <div class="justify-center items-center ">
          <button class="bg-green-500 hover:bg-green-700 text-white font-bold rounded mr-2" @click="saveCookies"> <img
              src="../../assets/SaveCookies.png" alt="Save Cookies Icon" title="Save Cookies To Account"
              :class="imageClass" data-i18n-title="saveCookiesToAccount">
          </button>
          <button class="bg-yellow-500 hover:bg-yellow-700 text-white font-bold rounded mr-2" @click="loadCookies"><img
              src="../../assets/LoadCookies.png" alt="Load Cookies Icon" title="Load Cookies From Account"
              :class="imageClass" data-i18n-title="loadCookiesFromAccount"></button>
          <button class="bg-red-500 hover:bg-red-700 text-white font-bold  rounded mr-2" @click="deleteAccount"><img
              src="../../assets/DeleteAccount.png" alt="Delete Account Icon" title="Delete Account" :class="imageClass"
              data-i18n-title="deleteAccount">
          </button>
          <button class="bg-red-500 hover:bg-red-700 text-white font-bold rounded mr-2" @click="deleteAllAccounts"><img
              src="../../assets/DeleteAllAccount.png" alt="Delete All Account Icon" title="Delete All Account"
              :class="imageClass" data-i18n-title="deleteAllAccount"></button>
          <button class="bg-red-500 hover:bg-red-700 text-white font-bold rounded mr-2"
            @click="clearAllClosedCookies"><img src="../../assets/ClearAllClosedCookies.png"
              alt="Clear All Closed Cookies Icon" title="Clear All Closed Cookies" :class="imageClass"
              data-i18n-title="clearAllClosedCookies"></button>
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2" @click="clearCookies">
            <img src="../../assets/ClearCookies.png" alt="Clear Cookies Icon" title="Clear Cookies" :class="imageClass"
              data-i18n-title="clearCookies">
          </button>
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2" @click="saveAllCookies">
            <img src="../../assets/SaveAllCookies.png" alt="Save All Cookies Icon" title="Save All Cookies"
              :class="imageClass" data-i18n-title="saveAllCookies"></button>
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2" @click="loadAllCookies">
            <img src="../../assets/LoadAllCookies.png" alt="Load All Cookies Icon" title="Load All Cookies"
              :class="imageClass" data-i18n-title="loadAllCookies"></button>
          <!-- <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2 p-2" @click="openOptions"
            data-i18n="options">
            Options</button> -->
        </div>
      </div>

      <!-- Tracked Domain Management -->
      <div class="border p-2 flex-1">
        <h2 class="text-base font-bold text-center mb-2" data-i18n="trackedDomainManagement">Tracked Domain Management
        </h2>
        <div class="flex items-center mb-2">
          <input v-model="newDomain" type="text" placeholder="Add new domain" required class="form-input w-48 mt-1 mr-2"
            data-i18n-placeholder="domainExample">
          <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold  py-2 px-4 rounded mr-2 " @click="addDomain"
            data-i18n="addNewDomain">Add</button>
        </div>
        <label class="flex items-center space-x-2">
          <input v-model="clearCookiesEnabled" type="checkbox" />
          <span data-i18n="clearCookiesEnabled">开启对追踪域名的新选项卡清除cookie功能</span>
        </label>
        <label class="flex items-center space-x-2">
          <input v-model="modifyLinkEnabled" type="checkbox" />
          <span ref="spanElement" data-i18n="modifyLinkEnabled">限制追踪域名链接只能在当前页面打开</span>
        </label>
        <ul id="domain-list" class="list-inside list-decimal">
          <li v-for="(domain, index) in domains" :key="domain" class="mb-2">
            {{ domain }}
            <button class="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
              @click="deleteDomain(index)" data-i18n="delete">Delete</button>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <!-- <div class="text-center m-4">
    <RouterLink to="/about">About</RouterLink>
  </div> -->
</template>

<script setup lang="ts">

const selectedAccount = ref<string | null>(null);
const newDomain = ref<string>('');
const domains = ref<string[]>([]);
const accounts = ref<Record<string, any>>({});
const clearCookiesEnabled = ref(true); // 设置一个反应性变量来追踪开关状态
const modifyLinkEnabled = ref(true);
const spanElement = ref<HTMLElement | null>(null);
const imageClass = 'w-12 h-12 mr-2';

onMounted(() => {
  // 处理所有需要国际化的元素
  document.querySelectorAll('[data-i18n], [data-i18n-title], [data-i18n-placeholder]').forEach(el => {
    // 如果有data-i18n属性，设置文本内容
    if (el.hasAttribute('data-i18n')) {
      el.textContent = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
    }

    // 如果有data-i18n-title属性，设置title属性
    if (el.hasAttribute('data-i18n-title')) {
      el.setAttribute('title', chrome.i18n.getMessage(el.getAttribute('data-i18n-title')));
    }

    // 如果有data-i18n-placeholder属性，设置placeholder属性
    if (el.hasAttribute('data-i18n-placeholder')) {
      el.setAttribute('placeholder', chrome.i18n.getMessage(el.getAttribute('data-i18n-placeholder')));
    }
  });
});

// watchEffect(() => {
//   const el = document.querySelector(`[data-i18n=delete]`);
//   if (el) {
//     el.textContent = chrome.i18n.getMessage("delete");
//   }
// });

// 使用 watch 来监视 trackedDomains 的改变
watch(domains, (newValue) => {
  // 当 domains 改变时，将它存储到 Chrome 存储区
  chrome.storage.sync.set({ 'trackedDomains': JSON.stringify(newValue) }, () => {
    if (chrome.runtime.lastError) {
      console.error('存储失败:', chrome.runtime.lastError);
    } else {
      document.querySelectorAll('[data-i18n="delete"]').forEach(el => {
        el.textContent = chrome.i18n.getMessage(el.getAttribute('data-i18n'));
      });
      console.log('存储成功 in watch domains!');
    }
  });
});//, { immediate: true }

// 当selectedAccount改变时，保存其值
watch(selectedAccount, (newValue) => {
  chrome.storage.sync.set({ selectedAccount: newValue });
});
watch(clearCookiesEnabled, (newValue) => {
  // chrome.runtime.sendMessage({ clearCookiesEnabled: newValue });
  chrome.storage.local.set({ clearCookiesEnabled: newValue });
});

watch(modifyLinkEnabled, (newValue) => {
  chrome.storage.local.set({ modifyLinkEnabled: newValue });
});

// 加载存储的selectedAccount值
chrome.storage.sync.get('selectedAccount', (data) => {
  selectedAccount.value = data.selectedAccount || null;
});

chrome.storage.local.get('clearCookiesEnabled', (data) => {
  // if(Object.keys(data.clearCookiesEnabled).length !== 0){
  //   clearCookiesEnabled.value = data.clearCookiesEnabled;
  // }
  // else{
  //   clearCookiesEnabled.value = false;
  // }
  clearCookiesEnabled.value = data.clearCookiesEnabled || false;//If you set true, then it will always be true when you open the popup 8.29
});

chrome.storage.local.get('modifyLinkEnabled', (data) => {
  modifyLinkEnabled.value = data.modifyLinkEnabled || false;
  // if (spanElement.value) {
  //   spanElement.value.textContent = 'please refresh website';
  // }
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
    console.log('这是一个空的域名，未获取成功')
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
  console.log('domains.value in popup', toRaw(domains.value))
})



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

const renameAccount = () => {
  if (selectedAccount.value) {
    let newName = prompt("Enter the new name for the account:", selectedAccount.value);
    if (selectedAccount.value && newName) {
      accounts.value[selectedAccount.value].alias = newName;
      newName = '';
      chrome.storage.local.set({ accounts: accounts.value }, () => {
        if (chrome.runtime.lastError) {
          alert("Error: " + chrome.runtime.lastError.message);
        } else {
          alert(`Account ${selectedAccount.value} renamed successfully`);
          selectedAccount.value = null;
        }
      });
    }
  }
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
    // chrome.notifications.create({
    //   type: 'basic',
    //   iconUrl: 'src/assets/icon.png', // 你的图标URL
    //   title: 'save success',
    //   message: 'success'
    // });
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
const clearAllClosedCookies = () => {
  // 发送清除Cookie的请求到背景脚本
  chrome.runtime.sendMessage({ action: 'clearAllClosedCookies' }, () => {
    console.log('Closed cookies cleared');
  });
};

const clearCookies = () => {
  // 发送清除Cookie的请求到背景脚本
  chrome.runtime.sendMessage({ action: 'clearCookies' }, () => {
    console.log('Cookies cleared');
  });
};

const saveAllCookies = () => {
  chrome.runtime.sendMessage({ action: 'saveAllCookies' }, () => {
    console.log('saveAllCookies');
  });
};

const loadAllCookies = () => {
  //loadSavedSelectedAccounts is set in option interface 8.28
  chrome.runtime.sendMessage({ action: 'loadAllCookies', loadSavedSelectedAccounts: false }, () => {
    console.log('loadAllCookies');
  });
};

const openOptions = () => {
  chrome.runtime.openOptionsPage();
}

const addDomain = () => {
  try {
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
      domains.value = [...domains.value]; // 触发 Watcher

      newDomain.value = '';
    } else {
      alert('Please enter a valid domain.没有获得根域名');
      return;
    }
  }
  catch (error) {
    alert('Please enter a valid domain.没有获得根域名');
    return;
  }
};


const deleteDomain = (index: number) => {
  domains.value.splice(index, 1);
  domains.value = [...domains.value]; // 触发 Watcher

};

const isValidDomain = (domain: string): boolean => {
  // 正则表达式用于匹配有效的域名
  const pattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
  return pattern.test(domain);
};

const getRootDomain = (url: string): string | null => {
  try {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://' + url; // 添加默认的 http 协议
    }
    const domain = new URL(url).hostname;
    const parts = domain.split('.');
    if (parts.length < 2) return domain; // 如果域名不包括至少两部分，则返回整个域名
    return parts.slice(-2).join('.'); // 返回最后两个部分，用点连接
  } catch (e) {
    console.error('Invalid URL:', e);
    return null; // 如果 URL 不合法，返回 null 或其他适当的默认值
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
        newAccount[accountName] = {};//原先这里初始赋值为null,会导致这是空对象,访问属性报错 9.9
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

</script>

<!-- <style lang="postcss">
.custom-button {
  @apply bg-green-500 hover:bg-green-700 text-white font-bold rounded mr-2;
}
</style> -->