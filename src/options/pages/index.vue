

<!-- <template>
  <div class="text-center m-4 w-full overflow-visible">
    <div class="mt-4 p-4 border border-gray-300">
      <pre id="debug-info" class="text-sm text-left overflow-auto bg-gray-100 p-2">
        {{ debugInfo }}
      </pre>
    </div>
    <RouterLink to="/about">About</RouterLink>
  </div>
</template> -->

<template>
  <div class="container mx-auto p-4 flex flex-wrap space-x-4 ">
    <div v-for="(account, key) in accounts" :key="key"
      class="flex flex-wrap items-center mb-4 p-4 bg-white shadow-md rounded-lg">
      <input v-model="selectedAccounts[key]" type="checkbox" class="mr-2">
      <div class="flex-grow">
        <p class="font-bold text-lg">{{ account.alias || key }}</p>
        <p class="text-gray-600" :class="{ 'text-green-600': account.manualSave }">Manual Save: {{ account.manualSave }}</p>
        <p class="text-gray-600" :class="{ 'text-red-600': account.closed }" >Closed: {{ account.closed }}</p>
        <button @click="toggleCookiesVisible(key)" class="text-blue-500 hover:underline focus:outline-none">
          {{ cookiesVisible[key] ? 'Hide Cookies' : 'Show Cookies' }}
        </button>
        <ul v-if="cookiesVisible[key]" class="mt-2">
          <li v-for="(cookie, index) in account.cookies" :key="index" class="text-gray-600">
            {{ cookie.name }}: {{ cookie.value }}
          </li>
        </ul>
      </div>
    </div>
  </div>

  <div class="flex justify-center items-center ">
    <button class="bg-red-500 hover:bg-red-700 text-white font-bold rounded mr-2"
              @click="clearAllClosedCookies"><img src="../../assets/ClearAllClosedCookies.png"
                alt="Clear All Closed Cookies Icon" title="Clear All Closed Cookies" class="w-16 h-16 mr-2"></button>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2" @click="saveAllCookies">
      <img src="../../assets/SaveAllCookies.png" alt="Save All Cookies Icon" title="Save All Cookies"
        class="w-16 h-16 mr-2"></button>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2" @click="loadAllCookies">
      <img src="../../assets/LoadAllCookies.png" alt="Load All Cookies Icon" title="Load All Cookies"
        class="w-16 h-16 mr-2"></button>
    <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold rounded mr-2"
      @click="showNotification">notification</button>
  </div>
  <div class="container mx-auto p-4">
    <div class="bg-white-200 p-4 rounded">
      <h2>Selected Accounts:</h2>
      <ul class="list-inside list-decimal">
        <li v-for="(entry, key) in selectedAccountsEntries" :key="key">
          <!-- Key: {{ entry[0] }}, Value: {{ entry[1] }} -->
          Key: {{ key }}, Value: {{ entry }}

        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">

const accounts = ref<Record<string, any>>({});
const selectedAccounts = ref<Record<string, any>>({});
const cookiesVisible = ref<Record<string, any>>({});

onMounted(() => {
  chrome.storage.local.get('accounts', (data) => {
    console.log('data.accounts in popup', data.accounts);
    accounts.value = data.accounts || {};
  });
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if (areaName === 'local' && changes.accounts) {
    // Update the local variable with the new value from storage
    accounts.value = changes.accounts.newValue || {};
  }
})

function toggleCookiesVisible(key: string) {
  cookiesVisible.value[key] = !cookiesVisible.value[key];
}

// const selectedAccountsEntries = computed(() => {
//   const entries = Object.entries(selectedAccounts.value);
//   const entriesWithCookies: Record<string, any> = entries.map(([key, value]) => {
//     if (value) {
//       return [key, accounts.value[key].cookies];
//     } else {
//       return null; // Handle unchecked checkboxes
//     }
//   });
//   return entriesWithCookies.filter(entry => entry !== null); // Remove null entries
// });

const selectedAccountsEntries = computed(() => {
  const entries = Object.entries(selectedAccounts.value);
  const selectedEntries = entries.reduce((result, [key, value]) => {
    if (value) {
      result[key] = accounts.value[key];
    }
    return result;
  }, {});
  console.log('selectedEntries', selectedEntries)
  return selectedEntries;
});

// 清除旧通知
const clearPreviousNotification = (notificationId: string) => {
  chrome.notifications.clear(notificationId, (wasCleared) => {
    if (wasCleared) {
      console.log('Previous notification cleared');
    } else {
      console.log('Previous notification not found');
    }
  });
};

const showNotification = () => {
  const notificationId = '1'; // Use a unique ID for your notification

  // 清除之前的通知
  clearPreviousNotification(notificationId);

  const options = {
    type: 'basic' as chrome.notifications.TemplateType,
    iconUrl: chrome.runtime.getURL('src/assets/icon.png'),
    title: 'CookiesClerk',
    message: 'Thank you to use my extension',
    buttons: [
      { title: 'Yes' },
      { title: 'No' }
    ]
  };

  chrome.notifications.create(notificationId, options, (notificationId) => {
    console.log("Notification created")
  });
};

const clearAllClosedCookies = () => {
  // 发送清除Cookie的请求到背景脚本
  chrome.runtime.sendMessage({ action: 'clearAllClosedCookies' }, () => {
    console.log('Closed cookies cleared');
  });
};

const saveAllCookies = async () => {
  await chrome.storage.local.set({ savedSelectedAccounts: selectedAccountsEntries.value });
  console.log("We have saved the selectedAccountsEntries in options interface");
};

const loadAllCookies = async () => {
  // 判断 selectedAccounts 对象是否包含 true 值
  const valuesArray = Object.values(selectedAccounts.value);
  const hasTrueValue = valuesArray.some((value: boolean)  => value === true);
  if (hasTrueValue){
      await chrome.storage.local.set({ savedSelectedAccounts: selectedAccountsEntries.value });
  }
  chrome.runtime.sendMessage({ action: 'loadAllCookies', loadSavedSelectedAccounts: true }, () => {
    console.log('loadAllCookies');
  });
};
</script>
