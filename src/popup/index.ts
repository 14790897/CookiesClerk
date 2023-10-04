import { createApp } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import routes from '~pages'
import '../assets/base.scss'
import App from './app.vue'
import './index.scss'
// import { createI18n } from 'vue-i18n'

// const messages = {
//   en: {
//     title: 'Cookie Clerk',
//     accountManagement: 'Account Management',
//     add: 'Add',
//     saveCookies: 'Save Cookies To Account',
//   },
//   zh_CN: {
//     title: 'Cookie 管理员',
//     accountManagement: '账户管理',
//     add: '添加',
//     saveCookies: '保存 Cookies 到账户',
//   },
// }

// const i18n = createI18n({
//   locale: 'en', // 设置默认语言
//   messages,
// })

routes.push({
  path: '/',
  redirect: '/popup',
})

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.path === '/') {
    return next('/popup')
  }

  next()
})

createApp(App).use(router).mount('#app')
