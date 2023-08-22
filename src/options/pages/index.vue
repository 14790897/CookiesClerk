

<template>
  <div class="text-center m-4 w-full overflow-visible">
    <h1 class="text-3xl font-bold underline pb-6">Hello world from Options!</h1>
    <div class="mt-4 p-4 border border-gray-300">
      <h2 class="text-2xl font-bold mb-2">Debug Information</h2>
      <pre id="debug-info" class="text-sm text-left overflow-auto bg-gray-100 p-2">
        {{ debugInfo }}
      </pre>
    </div>
    <RouterLink to="/about">About</RouterLink>
  </div>
</template>

<script setup lang="ts">
    const debugInfo = ref('');

    chrome.storage.local.get('accounts', (data) => {
      console.log('data.accounts in popup', data.accounts);
      debugInfo.value = data.accounts || {};
    });
    chrome.storage.onChanged.addListener(function (changes, areaName) {
      if (areaName === 'local' && changes.accounts) {
        // Update the local variable with the new value from storage
        debugInfo.value = changes.accounts.newValue || {};
      }
    })
</script>


<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}


</style>
