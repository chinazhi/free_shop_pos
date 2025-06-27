const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { app } = require('electron')

class Database {
  constructor() {
    this.db = null
    this.dbPath = path.join(app.getPath('userData'), 'pos_database.db')
  }

  // 初始化数据库连接
  init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('数据库连接失败:', err.message)
          reject(err)
        } else {
          console.log('数据库连接成功')
          this.createTables().then(resolve).catch(reject)
        }
      })
    })
  }

  // 创建数据表
  createTables() {
    return new Promise((resolve, reject) => {
      const tables = [
        // 商品表
        `CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT UNIQUE,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          cost REAL DEFAULT 0,
          category TEXT,
          stock INTEGER DEFAULT 0,
          min_stock INTEGER DEFAULT 0,
          description TEXT,
          image_url TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 分类表
        `CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 会员表
        `CREATE TABLE IF NOT EXISTS members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_no TEXT UNIQUE,
          name TEXT NOT NULL,
          phone TEXT,
          email TEXT,
          points INTEGER DEFAULT 0,
          total_spent REAL DEFAULT 0,
          level TEXT DEFAULT 'bronze',
          birthday TEXT,
          address TEXT,
          notes TEXT,
          is_active BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,
        
        // 销售记录表
        `CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_no TEXT UNIQUE NOT NULL,
          member_id INTEGER,
          total_amount REAL NOT NULL,
          discount_amount REAL DEFAULT 0,
          tax_amount REAL DEFAULT 0,
          final_amount REAL NOT NULL,
          payment_method TEXT NOT NULL,
          payment_status TEXT DEFAULT 'completed',
          refund_amount REAL DEFAULT 0,
          refund_reason TEXT,
          refund_time DATETIME,
          cashier TEXT,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members (id)
        )`,
        
        // 销售明细表
        `CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price REAL NOT NULL,
          total_price REAL NOT NULL,
          discount REAL DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )`,
        
        // 库存变动记录表
        `CREATE TABLE IF NOT EXISTS inventory_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'in', 'out', 'adjust'
          quantity INTEGER NOT NULL,
          before_stock INTEGER,
          after_stock INTEGER,
          reason TEXT,
          operator TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id)
        )`,
        
        // 会员积分变动日志表
        `CREATE TABLE IF NOT EXISTS member_points_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          member_id INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'add', 'subtract', 'set'
          change_amount INTEGER NOT NULL,
          before_points INTEGER NOT NULL,
          after_points INTEGER NOT NULL,
          reason TEXT,
          operator TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (member_id) REFERENCES members (id)
        )`,
        
        // 系统设置表
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT,
          description TEXT,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
      ]

      let completed = 0
      const total = tables.length

      tables.forEach((sql) => {
        this.db.run(sql, (err) => {
          if (err) {
            console.error('创建表失败:', err.message)
            reject(err)
            return
          }
          completed++
          if (completed === total) {
            console.log('所有数据表创建完成')
            this.insertDefaultData().then(resolve).catch(reject)
          }
        })
      })
    })
  }

  // 插入默认数据
  async insertDefaultData() {
    const defaultCategories = [
      ['饮料', '各类饮品'],
      ['零食', '休闲食品'],
      ['日用品', '生活用品'],
      ['烟酒', '烟草酒类'],
      ['其他', '其他商品']
    ];
    const defaultProducts = [
      ['6901028089296', '可口可乐 330ml', 3.5, 2.5, '饮料', 50, 10, '经典可乐', '', 1],
      ['6901028089297', '薯片 70g', 5.0, 3.0, '零食', 30, 5, '香脆薯片', '', 1],
      ['6901028089298', '矿泉水 500ml', 2.0, 1.0, '饮料', 100, 20, '纯净水', '', 1]
    ];
    const defaultMembers = [
      ['M0001', '张三', '13800138001', 'zhangsan@example.com', 1200, 0, 'gold'],
      ['M0002', '李四', '13800138002', 'lisi@example.com', 680, 0, 'silver'],
      ['M0003', '王五', '13800138003', 'wangwu@example.com', 320, 0, 'bronze']
    ];
    const defaultSettings = [
      ['shop_name', '便利店', '店铺名称'],
      ['tax_rate', '0', '税率(%)'],
      ['currency', 'CNY', '货币单位'],
      ['receipt_footer', '谢谢惠顾，欢迎再次光临！', '小票底部信息'],
      ['auto_print', 'false', '自动打印小票'],
      ['business_hours', '["09:00","22:00"]', '营业时间'],
      ['store_address', '', '门店地址'],
      ['store_phone', '', '联系电话'],
      ['store_description', '', '门店描述'],
      ['decimal_places', '2', '小数位数'],
      ['enable_tax', 'false', '启用税务'],
      ['tax_number', '', '税务编号'],
      ['tax_name', '增值税', '税务名称'],
      ['paper_width', '80', '小票纸宽'],
      ['receipt_header', '', '小票页眉'],
      ['show_barcode', 'true', '显示商品条码'],
      ['show_cashier', 'true', '显示收银员'],
      ['enable_points', 'true', '启用积分'],
      ['points_expiry', '365', '积分有效期'],
      ['points_value', '0.01', '积分抵扣'],
      ['member_levels', '[{"name":"青铜会员","discount":0.95,"pointsRate":1,"minSpent":0},{"name":"白银会员","discount":0.9,"pointsRate":1.5,"minSpent":1000},{"name":"黄金会员","discount":0.85,"pointsRate":2,"minSpent":5000}]', '会员等级'],
      ['theme_color', '#409eff', '主题色彩'],
      ['language', 'zh-CN', '语言'],
      ['time_format', '24', '时间格式'],
      ['auto_backup', 'true', '自动备份'],
      ['backup_frequency', 'daily', '备份频率'],
      ['data_retention', '365', '数据保留天数']
    ];
    const runAsync = (stmt, params) => new Promise((res, rej) => stmt.run(...params, err => err ? rej(err) : res()));
    // 分类
    const categoryStmt = this.db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
    for (const row of defaultCategories) await runAsync(categoryStmt, row);
    categoryStmt.finalize();
    // 设置
    const settingStmt = this.db.prepare('INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)');
    for (const row of defaultSettings) await runAsync(settingStmt, row);
    settingStmt.finalize();
    // 商品
    const productStmt = this.db.prepare('INSERT OR IGNORE INTO products (barcode, name, price, cost, category, stock, min_stock, description, image_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of defaultProducts) await runAsync(productStmt, row);
    productStmt.finalize();
    // 会员
    const memberStmt = this.db.prepare('INSERT OR IGNORE INTO members (member_no, name, phone, email, points, total_spent, level, birthday, address, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of defaultMembers) await runAsync(memberStmt, row);
    memberStmt.finalize();
    // 初始化默认销售订单和明细
    const defaultSales = [
      // 添加退款相关字段：refund_amount, refund_reason, refund_time
      ['20240125001', 2, 156.80, 15.68, 14.11, 155.23, 'wechat', 'completed', 0, null, null, '张三', '', '2024-01-25T14:30:00Z'],
      ['20240125002', null, 89.50, 0, 8.05, 97.55, 'cash', 'completed', 0, null, null, '王五', '', '2024-01-25T15:45:00Z'],
      ['20240125003', null, 234.60, 23.46, 19.00, 230.14, 'alipay', 'refunded', 230.14, '商品质量问题', '2024-01-25T17:30:00Z', '张三', '', '2024-01-25T16:20:00Z']
    ];
    
    // 更新对应的 SQL 语句
    const saleStmt = this.db.prepare('INSERT OR IGNORE INTO sales (order_no, member_id, total_amount, discount_amount, tax_amount, final_amount, payment_method, payment_status, refund_amount, refund_reason, refund_time, cashier, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    for (const row of defaultSales) await runAsync(saleStmt, row);
    saleStmt.finalize();
    const defaultSaleItems = [
      // sale_id, product_id, quantity, unit_price, total_price, discount, created_at
      [1, 1, 2, 3.5, 7.0, 0.35, '2024-01-25T14:30:00Z'],
      [1, 2, 1, 12.8, 12.8, 1.28, '2024-01-25T14:30:00Z'],
      [2, 3, 2, 2.0, 4.0, 0, '2024-01-25T15:45:00Z'],
      [3, 1, 5, 3.5, 17.5, 0.35, '2024-01-25T16:20:00Z']
    ];
    const saleItemStmt = this.db.prepare('INSERT OR IGNORE INTO sale_items (sale_id, product_id, quantity, unit_price, total_price, discount, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)');
    for (const row of defaultSaleItems) await runAsync(saleItemStmt, row);
    saleItemStmt.finalize();
  }

  // 执行查询
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err)
        } else {
          resolve(rows)
        }
      })
    })
  }
  
  // 执行单条查询
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err)
        } else {
          resolve(row)
        }
      })
    })
  }

  // 执行更新/插入
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err)
        } else {
          resolve({ id: this.lastID, changes: this.changes })
        }
      })
    })
  }

  // 重置数据库（删除所有数据并重新初始化）
  async resetDatabase() {
    try {
      // 删除所有表的数据（保留表结构）
      const tables = ['inventory_logs', 'sale_items', 'sales', 'products', 'members', 'categories', 'settings', 'member_points_logs']
      
      for (const table of tables) {
        await this.run(`DELETE FROM ${table}`)
        // 重置自增ID
        await this.run(`DELETE FROM sqlite_sequence WHERE name='${table}'`)
      }
      
      // 重新插入默认数据
      await this.insertDefaultData()
      
      console.log('数据库重置成功')
      return { success: true, message: '数据库重置成功' }
    } catch (error) {
      console.error('数据库重置失败:', error)
      throw error
    }
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('关闭数据库失败:', err.message)
        } else {
          console.log('数据库连接已关闭')
        }
      })
    }
  }
}

module.exports = Database