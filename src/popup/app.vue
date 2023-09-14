<script setup lang="ts"></script>

<template>
  <!-- <header
    aria-label="Site Header"
    class="bg-gray-50"
  >
    Popup Header
  </header> -->

  <RouterView></RouterView>

  <footer aria-label="Site Footer">
    <div class="bg-gray-50 text-gray-700 px-4">
      <div class="flex justify-between items-center">
        <div>
          <a href="https://github.com/14790897/CookiesClerk/issues" class="mr-2" target="_blank">Help</a>
          <a href="../assets/support.jpg" class="mr-2" target="_blank">Support</a>
          <a href="https://github.com/14790897/CookiesClerk" class="mr-2" target="_blank">GitHub</a>
        </div>
        <div>
          <span class="mr-2">Version: 1.0.3</span>
          <a href="https://github.com/14790897/CookiesClerk/blob/main/src/assets/privacy%20policy.md" class="mr-2" target="_blank">Privacy Policy</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped></style>
