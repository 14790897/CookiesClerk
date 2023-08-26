// import './index.scss'

// const src = chrome.runtime.getURL('src/content-script/iframe/index.html')

// const iframe = new DOMParser().parseFromString(
//   `<iframe class="crx-iframe" src="${src}"></iframe>`,
//   'text/html'
// ).body.firstElementChild

// if (iframe) {
//   document.body?.append(iframe)
// }

// // 创建遮罩层div
// const mask = document.createElement('div');
// mask.id = 'loading-mask';
// mask.style.position = 'fixed';
// mask.style.top = '0';
// mask.style.right = '0';
// mask.style.bottom = '0';
// mask.style.left = '0';
// mask.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
// mask.style.display = 'flex';
// mask.style.alignItems = 'center';
// mask.style.justifyContent = 'center';
// mask.style.zIndex = '1000';

// // 创建加载指示器div
// const loader = document.createElement('div');
// loader.className = 'loader';
// loader.style.width = '24px';
// loader.style.height = '24px';
// loader.style.border = '4px solid';
// loader.style.borderTop = '4px solid gray';
// loader.style.borderRadius = '50%';
// loader.style.animation = 'spin 1s linear infinite';

// // 添加加载指示器到遮罩层
// mask.appendChild(loader);

// // 添加遮罩层到页面
// document.body.appendChild(mask);

// // 可选：定义旋转动画
// const style = document.createElement('style');
// style.innerHTML = `
//   @keyframes spin {
//     0% { transform: rotate(0deg); }
//     100% { transform: rotate(360deg); }
//   }
// `;
// document.head.appendChild(style);

// // 初始隐藏遮罩层
// mask.style.display = 'none';

// // 监听来自Service worker的消息
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.action === 'showMask') {
//     mask.style.display = 'flex';
//   } else if (message.action === 'hideMask') {
//     mask.style.display = 'none';
//   }
// });

//定义一个函数，用于输出"Hello world"
// function logHelloWorld() {
//   console.log('Hello world')
// }

// // 使用setInterval来每秒输出一次"Hello world"
// setInterval(logHelloWorld, 1000)

// document.addEventListener('DOMContentLoaded', function () {
//   const links = document.querySelectorAll('a')
//   links.forEach((link) => {
//     link.target = '_self' // 设置或重写 target 属性，确保在当前窗口打开
//     console.log('Hello world=-------------------------------------------')
//   })
// })

// // content-script.js
// document.addEventListener('DOMContentLoaded', function () {
//   const links = document.querySelectorAll('a')
//   links.forEach((link) => {
//     link.addEventListener('click', function (event) {
//       event.preventDefault() // 阻止默认行为
//       window.location.href = link.href // 在当前窗口中导航
//       console.log('Hello world=-------------------------------------------')
//     })
//   })
// })


// content-script.js
// document.addEventListener("click", function(event) {
//   // 检查点击的元素或其父元素是否是一个链接
//   let target = event.target;
//   while (target && target.tagName !== "A") {
//     target = target.parentElement;
//   }
  
//   if (target && target.tagName === "A") {
//     event.preventDefault(); // 阻止默认行为
//     window.location = target.href; // 在当前窗口中导航
//   }
// }, true); // 设置为 true 以启用事件捕获
