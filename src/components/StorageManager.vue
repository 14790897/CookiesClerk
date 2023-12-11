<template>
    <div class="flex items-center justify-between space-mx-4">
        <button @click="exportData" class=" rounded hover:bg-green-600 transition ml-6" data-i18n="exportData">
            导出数据
        </button>

        <input type="file" id="fileInput" ref="fileInput" @change="handleFileChange" accept=".json" class="hidden">

        <p v-if="state.isLoading" class="text-gray-500" data-i18n="loading">
            加载中...
        </p>

        <p v-if="state.errorMessage" class="text-red-500">
            {{ state.errorMessage }}
        </p>

        <button @click="triggerFileInput" class=" rounded hover:bg-green-600 transition mr-6" data-i18n="importData">
            导入数据
        </button>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const fileInput = ref(null);
const selectedFile = ref<File | null>(null);
const state = reactive({
    isLoading: false,
    errorMessage: ''
});

chrome.storage.local.get('error', (data) => {
    console.log('error in popup from back', data.error);
    state.errorMessage = data.error || [];
});

const clearError = () => {
    state.errorMessage = '';
};

const exportData = () => {
    state.isLoading = true;
    clearError();
    chrome.storage.local.get(null, items => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "storage_data.json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    });
    state.isLoading = false;
};

const triggerFileInput = () => {
    fileInput.value.click();
};

const handleFileChange = (event: Event) => {
    try {
        const target = event.target as HTMLInputElement;
        if (target.files) {
            selectedFile.value = target.files[0];
            importData();
        }
    } catch (error) {
        state.errorMessage = '文件读取失败: ' + error.message;
    }
};

const importStorageData = (data: string) => {
    try {
        const jsonData = JSON.parse(data);
        chrome.storage.local.set(jsonData, () => {
            if (chrome.runtime.lastError) {
                console.error("无法保存数据:", chrome.runtime.lastError);
            } else {
                console.log("数据成功导入");
            }
        });
    } catch (error: any) {
        state.errorMessage = '数据解析失败: ' + error.message;
    }
};

const importData = () => {
    state.isLoading = true;
    clearError();
    if (selectedFile.value) {
        const reader = new FileReader();
        reader.readAsText(selectedFile.value, "UTF-8");
        reader.onload = evt => {
            if (evt.target) {
                const result = evt.target.result as string;
                importStorageData(result);
            }
        };
        reader.onerror = () => {
            console.error("读取文件时发生错误");
        };
    }
    state.isLoading = false;
};
</script>
