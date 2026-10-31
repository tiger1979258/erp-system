-- ERP系统数据库初始化脚本
-- 进销存 + 生产 + 财务

CREATE DATABASE IF NOT EXISTS erp_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE erp_system;

-- ── 1. 商品信息表 ──
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_code VARCHAR(32) UNIQUE NOT NULL COMMENT '商品编码',
    product_name VARCHAR(128) NOT NULL COMMENT '商品名称',
    category VARCHAR(64) COMMENT '分类',
    unit VARCHAR(16) COMMENT '单位',
    purchase_price DECIMAL(12,2) DEFAULT 0 COMMENT '参考进价',
    sale_price DECIMAL(12,2) DEFAULT 0 COMMENT '参考售价',
    safe_stock INT DEFAULT 0 COMMENT '安全库存',
    remark VARCHAR(256) COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ── 2. 供应商表 ──
CREATE TABLE IF NOT EXISTS suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    supplier_code VARCHAR(32) UNIQUE NOT NULL,
    supplier_name VARCHAR(128) NOT NULL,
    contact_person VARCHAR(64),
    phone VARCHAR(32),
    address VARCHAR(256),
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 3. 客户表 ──
CREATE TABLE IF NOT EXISTS customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_code VARCHAR(32) UNIQUE NOT NULL,
    customer_name VARCHAR(128) NOT NULL,
    contact_person VARCHAR(64),
    phone VARCHAR(32),
    address VARCHAR(256),
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 4. 入库单主表 ──
CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '入库单号',
    supplier_id INT COMMENT '供应商ID',
    order_date DATE NOT NULL,
    total_amount DECIMAL(14,2) DEFAULT 0 COMMENT '入库总金额',
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ── 5. 入库单明细表 ──
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    purchase_order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_code VARCHAR(32) NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    unit VARCHAR(16),
    quantity INT NOT NULL COMMENT '入库数量',
    ref_purchase_price DECIMAL(12,2) COMMENT '参考进价',
    amount DECIMAL(14,2) COMMENT '入库金额=数量*参考进价',
    actual_purchase_price DECIMAL(12,2) COMMENT '实际进价',
    actual_amount DECIMAL(14,2) COMMENT '实际金额=数量*实际进价',
    remark VARCHAR(256),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── 6. 销售出库单主表 ──
CREATE TABLE IF NOT EXISTS sales_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '销售单号',
    customer_id INT COMMENT '客户ID',
    order_date DATE NOT NULL,
    total_income DECIMAL(14,2) DEFAULT 0 COMMENT '总收入',
    total_cost DECIMAL(14,2) DEFAULT 0 COMMENT '总成本',
    total_profit DECIMAL(14,2) DEFAULT 0 COMMENT '总毛利',
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ── 7. 销售出库单明细表 ──
CREATE TABLE IF NOT EXISTS sales_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sales_order_id INT NOT NULL,
    product_id INT NOT NULL,
    product_code VARCHAR(32) NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    unit VARCHAR(16),
    quantity INT NOT NULL COMMENT '出库数量',
    ref_sale_price DECIMAL(12,2) COMMENT '参考售价',
    ref_income DECIMAL(14,2) COMMENT '参考收入=数量*参考售价',
    actual_sale_price DECIMAL(12,2) COMMENT '实际售价',
    actual_income DECIMAL(14,2) COMMENT '实际收入=数量*实际售价',
    cost_price DECIMAL(12,2) COMMENT '成本单价（商品参考进价）',
    cost_amount DECIMAL(14,2) COMMENT '销售成本=数量*成本单价',
    profit DECIMAL(14,2) COMMENT '毛利=实际收入-销售成本',
    remark VARCHAR(256),
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── 8. 生产工单主表 ──
CREATE TABLE IF NOT EXISTS production_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(64) UNIQUE NOT NULL COMMENT '工单号',
    product_id INT NOT NULL COMMENT '生产成品ID',
    product_code VARCHAR(32) NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    plan_quantity INT NOT NULL COMMENT '计划产量',
    actual_quantity INT DEFAULT 0 COMMENT '实际产量',
    status ENUM('pending','in_progress','completed','cancelled') DEFAULT 'pending' COMMENT '工单状态',
    plan_start_date DATE,
    plan_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── 9. 生产领料单明细表 ──
CREATE TABLE IF NOT EXISTS production_materials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    production_order_id INT NOT NULL,
    product_id INT NOT NULL COMMENT '领料商品ID（原材料）',
    product_code VARCHAR(32) NOT NULL,
    product_name VARCHAR(128) NOT NULL,
    unit VARCHAR(16),
    plan_quantity INT NOT NULL COMMENT '计划领料数量',
    actual_quantity INT DEFAULT 0 COMMENT '实际领料数量',
    remark VARCHAR(256),
    FOREIGN KEY (production_order_id) REFERENCES production_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ── 10. 财务收支记录表 ──
CREATE TABLE IF NOT EXISTS finance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_no VARCHAR(64) UNIQUE NOT NULL COMMENT '凭证号',
    record_type ENUM('income','expense') NOT NULL COMMENT '收入/支出',
    category VARCHAR(64) COMMENT '类别：销售收入/采购支出/工资/租金/其他',
    related_type ENUM('sales','purchase','production','other') DEFAULT 'other' COMMENT '关联业务类型',
    related_id INT DEFAULT 0 COMMENT '关联业务ID',
    amount DECIMAL(14,2) NOT NULL COMMENT '金额',
    account VARCHAR(64) DEFAULT '现金' COMMENT '账户：现金/银行/微信/支付宝',
    record_date DATE NOT NULL COMMENT '业务日期',
    remark VARCHAR(256),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ── 索引优化 ──
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_purchase_order_date ON purchase_orders(order_date);
CREATE INDEX idx_sales_order_date ON sales_orders(order_date);
CREATE INDEX idx_production_status ON production_orders(status);
CREATE INDEX idx_finance_date ON finance_records(record_date);
CREATE INDEX idx_finance_type ON finance_records(record_type);
