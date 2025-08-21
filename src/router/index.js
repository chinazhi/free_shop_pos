import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Layout',
    component: () => import('../views/Layout.vue'),
    redirect: '/pos',
    children: [
      {
        path: '/pos',
        name: 'POS',
        component: () => import('../views/POS.vue'),
        meta: { title: '收银台', icon: 'ShoppingCart' }
      },
      {
        path: '/products',
        name: 'Products',
        component: () => import('../views/Products.vue'),
        meta: { title: '商品管理', icon: 'Box' }
      },
      {
        path: '/sales',
        name: 'Sales',
        component: () => import('../views/Sales.vue'),
        meta: { title: '销售记录', icon: 'Document' }
      },
      {
        path: '/settings',
        name: 'Settings',
        component: () => import('../views/Settings.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router