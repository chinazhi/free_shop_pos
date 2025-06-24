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
        path: '/inventory',
        name: 'Inventory',
        component: () => import('../views/Inventory.vue'),
        meta: { title: '库存管理', icon: 'Goods' }
      },
      {
        path: '/members',
        name: 'Members',
        component: () => import('../views/Members.vue'),
        meta: { title: '会员管理', icon: 'User' }
      },
      {
        path: '/sales',
        name: 'Sales',
        component: () => import('../views/Sales.vue'),
        meta: { title: '销售记录', icon: 'Document' }
      },
      {
        path: '/reports',
        name: 'Reports',
        component: () => import('../views/Reports.vue'),
        meta: { title: '报表统计', icon: 'DataAnalysis' }
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