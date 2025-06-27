const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const Database = require('./database')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let database

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: true,
      preload: path.join(__dirname, '../preload.js')
    },
    icon: path.join(__dirname, '../../assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  })

  // 加载应用
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
    // 开发环境下打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist-vue/index.html'))
  }

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // 当窗口被关闭时
  mainWindow.on('closed', () => {
    mainWindow = null
  })
  // 捕获渲染进程崩溃
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('渲染进程崩溃:', details)
    app.quit()
  })
}

// 初始化数据库
async function initDatabase() {
  try {
    database = new Database()
    await database.init()
    console.log('数据库初始化成功')
  } catch (error) {
    console.error('数据库初始化失败:', error)
  }
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  await initDatabase()
  createWindow()

  // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，重新创建窗口
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 设置应用菜单
const template = [
  {
    label: '文件',
    submenu: [
      {
        label: '新建订单',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('new-order')
          }
        }
      },
      {
        label: '打印小票',
        accelerator: 'CmdOrCtrl+P',
        click: () => {
          if (mainWindow && mainWindow.webContents) {
            mainWindow.webContents.send('print-receipt')
          }
        }
      },
      { type: 'separator' },
      {
        label: '退出',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit()
        }
      }
    ]
  },
  {
    label: '编辑',
    submenu: [
      { role: 'undo', label: '撤销' },
      { role: 'redo', label: '重做' },
      { type: 'separator' },
      { role: 'cut', label: '剪切' },
      { role: 'copy', label: '复制' },
      { role: 'paste', label: '粘贴' }
    ]
  },
  {
    label: '视图',
    submenu: [
      { role: 'reload', label: '重新加载' },
      { role: 'forceReload', label: '强制重新加载' },
      { role: 'toggleDevTools', label: '切换开发者工具' },
      { type: 'separator' },
      { role: 'resetZoom', label: '实际大小' },
      { role: 'zoomIn', label: '放大' },
      { role: 'zoomOut', label: '缩小' },
      { type: 'separator' },
      { role: 'togglefullscreen', label: '切换全屏' }
    ]
  },
  {
    label: '帮助',
    submenu: [
      {
        label: '关于',
        click: () => {
          mainWindow.webContents.send('show-about')
        }
      }
    ]
  }
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

// IPC 通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion()
})

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.handle('maximize-window', () => {
  if (!mainWindow) return
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize()
  } else {
    mainWindow.maximize()
  }
})

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close()
})

// 数据库查询
ipcMain.handle('db-query', async (event, sql, params) => {
  try {
    return await database.query(sql, params)
  } catch (error) {
    console.error('数据库查询错误:', error)
    throw error
  }
})

// 数据库单行查询
ipcMain.handle('db-get', async (event, sql, params) => {
  try {
    return await database.get(sql, params)
  } catch (error) {
    console.error('数据库查询错误:', error)
    throw error
  }
})

// 数据库执行
ipcMain.handle('db-run', async (event, sql, params) => {
  try {
    return await database.run(sql, params)
  } catch (error) {
    console.error('数据库执行错误:', error)
    throw error
  }
})

// 打印功能
ipcMain.handle('print-receipt', async (event, content) => {
  try {
    console.log('打印小票:', content)
    return { success: true }
  } catch (error) {
    console.error('打印失败:', error)
    return { success: false, error: error.message }
  }
})

// 获取所有商品
ipcMain.handle('get-products', async (event) => {
  try {
    console.log('[get-products] dbPath:', database.dbPath)
    const sql = 'SELECT * FROM products ORDER BY name'
    const result = await database.query(sql)
    // console.log('[get-products] result:', result)
    return result
  } catch (error) {
    console.error('获取商品失败:', error)
    throw error
  }
})

// 根据条码获取商品
ipcMain.handle('get-product-by-barcode', async (event, barcode) => {
  try {
    const sql = 'SELECT * FROM products WHERE barcode = ? AND is_active = 1'
    return await database.get(sql, [barcode])
  } catch (error) {
    console.error('根据条码获取商品失败:', error)
    throw error
  }
})

// 添加商品
ipcMain.handle('add-product', async (event, productData) => {
  try {
    const sql = `INSERT INTO products 
      (barcode, name, price, cost, category, stock, min_stock, description, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const params = [
      productData.barcode,
      productData.name,
      productData.price,
      productData.cost,
      productData.category,
      productData.stock || 0,
      productData.min_stock || 0,
      productData.description,
      productData.image_url
    ]
    const result = await database.run(sql, params)
    return { id: result.lastID, ...productData }
  } catch (error) {
    console.error('添加商品失败:', error)
    throw error
  }
})

// 更新商品
ipcMain.handle('update-product', async (event, id, productData) => {
  try {
    // 构建动态SQL更新语句
    const updateFields = []
    const params = []
    
    if (productData.barcode !== undefined) {
      updateFields.push('barcode = ?')
      params.push(productData.barcode)
    }
    if (productData.name !== undefined) {
      updateFields.push('name = ?')
      params.push(productData.name)
    }
    if (productData.price !== undefined) {
      updateFields.push('price = ?')
      params.push(productData.price)
    }
    if (productData.cost !== undefined) {
      updateFields.push('cost = ?')
      params.push(productData.cost)
    }
    if (productData.category !== undefined) {
      updateFields.push('category = ?')
      params.push(productData.category)
    }
    if (productData.stock !== undefined) {
      updateFields.push('stock = ?')
      params.push(productData.stock)
    }
    if (productData.min_stock !== undefined) {
      updateFields.push('min_stock = ?')
      params.push(productData.min_stock)
    }
    if (productData.description !== undefined) {
      updateFields.push('description = ?')
      params.push(productData.description)
    }
    if (productData.image_url !== undefined) {
      updateFields.push('image_url = ?')
      params.push(productData.image_url)
    }
    if (productData.is_active !== undefined) {
      updateFields.push('is_active = ?')
      params.push(productData.is_active ? 1 : 0)
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)
    
    const sql = `UPDATE products SET ${updateFields.join(', ')} WHERE id = ?`
    await database.run(sql, params)
    // 更新后查询完整商品信息返回
    const row = await database.get('SELECT * FROM products WHERE id = ?', [id])
    
    return row
  } catch (error) {
    console.error('更新商品失败:', error)
    throw error
  }
})

// 删除商品
ipcMain.handle('delete-product', async (event, id) => {
  try {
    const sql = 'UPDATE products SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    await database.run(sql, [id])
    return { success: true }
  } catch (error) {
    console.error('删除商品失败:', error)
    throw error
  }
})

// 添加库存变动记录
ipcMain.handle('add-inventory-log', async (event, logData) => {
  try {
    const sql = `INSERT INTO inventory_logs 
      (product_id, type, quantity, before_stock, after_stock, reason, operator) 
      VALUES (?, ?, ?, ?, ?, ?, ?)`
    const params = [
      logData.product_id,
      logData.type,
      logData.quantity,
      logData.before_stock,
      logData.after_stock,
      logData.reason,
      logData.operator
    ]
    const result = await database.run(sql, params)
    return { id: result.lastID, ...logData }
  } catch (error) {
    console.error('添加库存记录失败:', error)
    throw error
  }
})

// 事务性库存更新（同时更新库存和记录日志）
ipcMain.handle('update-stock-with-log', async (event, productId, stockData, logData) => {
  try {
    // 开始事务
    await database.run('BEGIN TRANSACTION')
    
    try {
      // 更新商品库存
      const updateSql = 'UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      await database.run(updateSql, [stockData.stock, productId])
      
      // 添加库存变动日志
      const logSql = `INSERT INTO inventory_logs 
        (product_id, type, quantity, before_stock, after_stock, reason, operator) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      const logParams = [
        logData.product_id,
        logData.type,
        logData.quantity,
        logData.before_stock,
        logData.after_stock,
        logData.reason,
        logData.operator
      ]
      await database.run(logSql, logParams)
      
      // 提交事务
      await database.run('COMMIT')
      
      // 返回更新后的商品信息
      const updatedProduct = await database.get('SELECT * FROM products WHERE id = ?', [productId])
      return updatedProduct
    } catch (error) {
      // 回滚事务
      await database.run('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('事务性库存更新失败:', error)
    throw error
  }
})

// 重置数据库
ipcMain.handle('reset-database', async (event) => {
  try {
    const result = await database.resetDatabase()
    return result
  } catch (error) {
    console.error('重置数据库失败:', error)
    throw error
  }
})

// 获取库存变动记录
ipcMain.handle('get-inventory-logs', async (event, filters = {}) => {
  try {
    let sql = `
      SELECT 
        il.*,
        p.name as product_name,
        p.barcode
      FROM inventory_logs il
      LEFT JOIN products p ON il.product_id = p.id
      WHERE 1=1
    `
    const params = []
    
    // 添加筛选条件
    if (filters.product_id) {
      sql += ' AND il.product_id = ?'
      params.push(filters.product_id)
    }
    
    if (filters.type) {
      sql += ' AND il.type = ?'
      params.push(filters.type)
    }
    
    if (filters.start_date) {
      sql += ' AND DATE(il.created_at) >= DATE(?)'
      params.push(filters.start_date)
    }
    
    if (filters.end_date) {
      sql += ' AND DATE(il.created_at) <= DATE(?)'
      params.push(filters.end_date)
    }
    
    sql += ' ORDER BY il.created_at DESC'
    
    if (filters.limit) {
      sql += ' LIMIT ?'
      params.push(filters.limit)
    }
    
    return await database.query(sql, params)
  } catch (error) {
    console.error('获取库存记录失败:', error)
    throw error
  }
})

// ==================== 会员管理相关 IPC 处理 ====================

// 获取所有会员
ipcMain.handle('get-members', async (event) => {
  try {
    const sql = 'SELECT * FROM members WHERE is_active = 1 ORDER BY created_at DESC'
    return await database.query(sql)
  } catch (error) {
    console.error('获取会员失败:', error)
    throw error
  }
})

// 添加会员
ipcMain.handle('add-member', async (event, memberData) => {
  try {
    // 生成会员编号
    const memberNo = 'M' + Date.now().toString().slice(-8)
    
    const sql = `INSERT INTO members 
      (member_no, name, phone, email, level, points, total_spent, birthday, address, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    const params = [
      memberNo,
      memberData.name,
      memberData.phone,
      memberData.email || '',
      memberData.level || 'bronze',
      memberData.points || 0,
      memberData.total_spent || 0,
      memberData.birthday || null,
      memberData.address || '',
      memberData.notes || ''
    ]
    const result = await database.run(sql, params)
    return { id: result.lastID, member_no: memberNo, ...memberData }
  } catch (error) {
    console.error('添加会员失败:', error)
    throw error
  }
})

// 更新会员
ipcMain.handle('update-member', async (event, id, memberData) => {
  try {
    // 构建动态SQL更新语句
    const updateFields = []
    const params = []
    
    if (memberData.name !== undefined) {
      updateFields.push('name = ?')
      params.push(memberData.name)
    }
    if (memberData.phone !== undefined) {
      updateFields.push('phone = ?')
      params.push(memberData.phone)
    }
    if (memberData.email !== undefined) {
      updateFields.push('email = ?')
      params.push(memberData.email)
    }
    if (memberData.level !== undefined) {
      updateFields.push('level = ?')
      params.push(memberData.level)
    }
    if (memberData.points !== undefined) {
      updateFields.push('points = ?')
      params.push(memberData.points)
    }
    if (memberData.total_spent !== undefined) {
      updateFields.push('total_spent = ?')
      params.push(memberData.total_spent)
    }
    if (memberData.birthday !== undefined) {
      updateFields.push('birthday = ?')
      params.push(memberData.birthday)
    }
    if (memberData.address !== undefined) {
      updateFields.push('address = ?')
      params.push(memberData.address)
    }
    if (memberData.notes !== undefined) {
      updateFields.push('notes = ?')
      params.push(memberData.notes)
    }
    if (memberData.is_active !== undefined) {
      updateFields.push('is_active = ?')
      params.push(memberData.is_active)
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(id)
    
    const sql = `UPDATE members SET ${updateFields.join(', ')} WHERE id = ?`
    await database.run(sql, params)
    
    // 返回更新后的会员信息
    const updatedMember = await database.get('SELECT * FROM members WHERE id = ?', [id])
    return updatedMember
  } catch (error) {
    console.error('更新会员失败:', error)
    throw error
  }
})

// 删除会员
ipcMain.handle('delete-member', async (event, id) => {
  try {
    const sql = 'UPDATE members SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    await database.run(sql, [id])
    return { success: true }
  } catch (error) {
    console.error('删除会员失败:', error)
    throw error
  }
})

// 更新会员积分
ipcMain.handle('update-member-points', async (event, memberId, pointsData) => {
  try {
    // 开始事务
    await database.run('BEGIN TRANSACTION')
    
    try {
      // 更新会员积分
      const sql = 'UPDATE members SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
      await database.run(sql, [pointsData.points, memberId])
      
      // 记录积分变动日志
      const logSql = `INSERT INTO member_points_logs 
        (member_id, type, change_amount, before_points, after_points, reason, operator) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`
      const beforePoints = pointsData.points - pointsData.change_amount
      const logParams = [
        memberId,
        pointsData.type,
        pointsData.change_amount,
        beforePoints,
        pointsData.points,
        pointsData.reason || '',
        pointsData.operator || '系统'
      ]
      await database.run(logSql, logParams)
      
      // 提交事务
      await database.run('COMMIT')
      
      // 返回更新后的会员信息
      const updatedMember = await database.get('SELECT * FROM members WHERE id = ?', [memberId])
      return updatedMember
    } catch (error) {
      // 回滚事务
      await database.run('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('更新会员积分失败:', error)
    throw error
  }
})

// 获取会员订单
ipcMain.handle('get-member-orders', async (event, memberId) => {
  try {
    const sql = `
      SELECT 
        s.*,
        COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE s.member_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `
    return await database.query(sql, [memberId])
  } catch (error) {
    console.error('获取会员订单失败:', error)
    throw error
  }
})

// ==================== 分类管理相关 IPC 处理 ====================

// 获取所有分类
ipcMain.handle('get-categories', async (event) => {
  try {
    const sql = 'SELECT * FROM categories ORDER BY name'
    return await database.query(sql)
  } catch (error) {
    console.error('获取分类失败:', error)
    throw error
  }
})

// 添加分类
ipcMain.handle('add-category', async (event, categoryData) => {
  try {
    const sql = 'INSERT INTO categories (name, description) VALUES (?, ?)'
    const params = [categoryData.name, categoryData.description || '']
    const result = await database.run(sql, params)
    return { id: result.lastID, ...categoryData }
  } catch (error) {
    console.error('添加分类失败:', error)
    throw error
  }
})

// 更新分类
ipcMain.handle('update-category', async (event, id, categoryData) => {
  try {
    const sql = 'UPDATE categories SET name = ?, description = ? WHERE id = ?'
    const params = [categoryData.name, categoryData.description || '', id]
    await database.run(sql, params)
    return { id, ...categoryData }
  } catch (error) {
    console.error('更新分类失败:', error)
    throw error
  }
})

// 删除分类
ipcMain.handle('delete-category', async (event, id) => {
  try {
    // 检查是否有商品使用此分类
    const productsUsingCategory = await database.get(
      'SELECT COUNT(*) as count FROM products WHERE category = (SELECT name FROM categories WHERE id = ?)',
      [id]
    )
    
    if (productsUsingCategory.count > 0) {
      throw new Error('该分类下还有商品，无法删除')
    }
    
    const sql = 'DELETE FROM categories WHERE id = ?'
    await database.run(sql, [id])
    return { success: true }
  } catch (error) {
    console.error('删除分类失败:', error)
    throw error
  }
})

// 应用退出前清理
app.on('before-quit', async () => {
  try {
    if (database) {
      await database.close()
      console.log('数据库已关闭')
    }
  } catch (e) {
    console.error('关闭数据库时发生异常:', e)
  }
})

// ==================== 统一销售事务相关 IPC 处理 ====================

// 统一销售事务处理
ipcMain.handle('process-sale', async (event, salePayload) => {
  const { sale, items, stockUpdates, logs, memberPoints } = salePayload;
  const db = database;
  await db.run('BEGIN TRANSACTION');
  try {
    // 插入销售主表
    const saleSql = `INSERT INTO sales (order_no, member_id, total_amount, discount_amount, tax_amount, final_amount, payment_method, payment_status, cashier, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
    const saleParams = [sale.order_no, sale.member_id, sale.total_amount, sale.discount_amount, sale.tax_amount, sale.final_amount, sale.payment_method, sale.payment_status, sale.cashier];
    const saleResult = await db.run(saleSql, saleParams);
    const saleId = saleResult.id;
    // 插入销售明细表
    for (const item of items) {
      const itemSql = `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, discount, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))`;
      const itemParams = [saleId, item.product_id, item.quantity, item.unit_price, item.total_price, item.discount];
      await db.run(itemSql, itemParams);
    }
    // 批量扣减库存并写入库存日志
    for (let i = 0; i < stockUpdates.length; i++) {
      const { product_id, new_stock } = stockUpdates[i];
      await db.run('UPDATE products SET stock = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [new_stock, product_id]);
      const log = logs[i];
      const logSql = `INSERT INTO inventory_logs (product_id, type, quantity, before_stock, after_stock, reason, operator) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const logParams = [log.product_id, log.type, log.quantity, log.before_stock, log.after_stock, log.reason, log.operator];
      await db.run(logSql, logParams);
    }
    // 会员积分处理
    if (memberPoints && sale.member_id) {
      // 更新会员积分
      await db.run('UPDATE members SET points = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [memberPoints.after_points, sale.member_id]);
      // 写入积分变动日志
      const logSql = `INSERT INTO member_points_logs (member_id, type, change_amount, before_points, after_points, reason, operator) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const logParams = [sale.member_id, memberPoints.type, memberPoints.change_amount, memberPoints.before_points, memberPoints.after_points, memberPoints.reason || '', memberPoints.operator || '系统'];
      await db.run(logSql, logParams);
    }
    await db.run('COMMIT');
    return { success: true, saleId };
  } catch (error) {
    await db.run('ROLLBACK');
    console.error('销售事务失败:', error);
    return { success: false, error: error.message };
  }
});

// ==================== 系统设置相关 IPC 处理 ====================

// 获取所有设置
ipcMain.handle('get-settings', async (event) => {
  try {
    const sql = 'SELECT key, value FROM settings ORDER BY key'
    return await database.query(sql)
  } catch (error) {
    console.error('获取设置失败:', error)
    throw error
  }
})

// 批量更新设置
ipcMain.handle('update-settings', async (event, settingsArr) => {
  try {
    await database.run('BEGIN TRANSACTION')
    try {
      for (const setting of settingsArr) {
        // 使用 INSERT OR REPLACE 确保新设置能被正确保存
        await database.run(
          'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
          [setting.key, setting.value]
        )
      }
      await database.run('COMMIT')
      console.log('设置保存成功:', settingsArr.length, '项')
      return { success: true }
    } catch (error) {
      await database.run('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('批量更新设置失败:', error)
    throw error
  }
})
