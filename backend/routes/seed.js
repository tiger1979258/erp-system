const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Seed demo data
router.post('/', async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Clear existing data
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await conn.query('TRUNCATE TABLE sales_order_items');
    await conn.query('TRUNCATE TABLE sales_orders');
    await conn.query('TRUNCATE TABLE purchase_order_items');
    await conn.query('TRUNCATE TABLE purchase_orders');
    await conn.query('TRUNCATE TABLE production_materials');
    await conn.query('TRUNCATE TABLE production_orders');
    await conn.query('TRUNCATE TABLE finance_records');
    await conn.query('TRUNCATE TABLE products');
    await conn.query('TRUNCATE TABLE suppliers');
    await conn.query('TRUNCATE TABLE customers');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    // Products
    const products = [
      ['P001','无线鼠标','电子产品','个',35.00,79.00,20,'USB接收器'],
      ['P002','机械键盘','电子产品','个',120.00,249.00,15,'青轴'],
      ['P003','USB-C数据线','配件','根',8.50,25.00,50,'1.5米编织线'],
      ['P004','笔记本支架','配件','个',28.00,68.00,10,'铝合金散热'],
      ['P005','蓝牙耳机','电子产品','个',65.00,159.00,25,'入耳式'],
      ['P006','高清摄像头','电子产品','个',45.00,128.00,15,'1080P'],
      ['P007','Type-C扩展坞','配件','个',55.00,149.00,20,'七合一款'],
      ['P008','显示器支架臂','配件','个',38.00,99.00,10,'可旋转'],
    ];
    for (const p of products) {
      await conn.query('INSERT INTO products (product_code, product_name, category, unit, purchase_price, sale_price, safe_stock, remark) VALUES (?,?,?,?,?,?,?,?)', p);
    }

    // Suppliers
    const suppliers = [
      ['S001','深圳数码科技有限公司','张经理','138-0000-1111','深圳市南山区科技园',''],
      ['S002','广州外设批发商','李女士','139-0000-2222','广州市天河区石牌桥',''],
      ['S003','东莞配件工厂','王总','137-0000-3333','东莞市长安镇','工厂直供'],
    ];
    for (const s of suppliers) {
      await conn.query('INSERT INTO suppliers (supplier_code, supplier_name, contact_person, phone, address, remark) VALUES (?,?,?,?,?,?)', s);
    }

    // Customers
    const customers = [
      ['C001','京东商城','刘经理','138-1111-0000','北京市亦庄经济开发区','平台客户'],
      ['C002','天猫旗舰店','陈女士','139-2222-0000','杭州市余杭区文一西路','平台客户'],
      ['C003','线下零售店A','赵老板','137-3333-0000','上海市浦东新区张江',''],
      ['C004','企业采购部','周主管','136-4444-0000','深圳市福田区','批量采购'],
    ];
    for (const c of customers) {
      await conn.query('INSERT INTO customers (customer_code, customer_name, contact_person, phone, address, remark) VALUES (?,?,?,?,?,?)', c);
    }

    // Purchase Orders (3 months of data)
    const purchases = [
      ['RK-2026-001', 1, '2026-01-15', [[1,50,35.00,35.00],[2,30,120.00,118.00],[3,200,8.50,8.20],[4,40,28.00,28.00],[5,60,65.00,63.00]], '1月首批进货'],
      ['RK-2026-002', 2, '2026-02-10', [[1,30,35.00,35.00],[6,40,45.00,44.00],[7,50,55.00,54.00]], '2月补货'],
      ['RK-2026-003', 3, '2026-03-05', [[2,20,120.00,119.00],[3,150,8.50,8.30],[8,30,38.00,37.50],[5,40,65.00,64.00]], '3月进货'],
      ['RK-2026-004', 1, '2026-04-12', [[1,40,35.00,34.50],[4,30,28.00,27.80],[6,30,45.00,44.50]], '4月进货'],
      ['RK-2026-005', 2, '2026-05-08', [[2,25,120.00,120.00],[7,40,55.00,55.00],[8,25,38.00,38.00]], '5月补货'],
      ['RK-2026-006', 3, '2026-06-15', [[1,60,35.00,35.00],[3,300,8.50,8.10],[5,50,65.00,65.00]], '6月大批量进货'],
    ];
    for (const po of purchases) {
      const [r] = await conn.query('INSERT INTO purchase_orders (order_no, supplier_id, order_date, remark) VALUES (?,?,?,?)', [po[0], po[1], po[2], po[4]]);
      const poId = r.insertId;
      let total = 0;
      for (const item of po[3]) {
        const [pid, qty, refP, actualP] = item;
        const prod = products.find(x => x[0] === `P${String(pid).padStart(3,'0')}`) || products[pid-1];
        const amt = qty * refP;
        const actualAmt = qty * actualP;
        total += actualAmt;
        await conn.query('INSERT INTO purchase_order_items (purchase_order_id, product_id, product_code, product_name, unit, quantity, ref_purchase_price, amount, actual_purchase_price, actual_amount) VALUES (?,?,?,?,?,?,?,?,?,?)',
          [poId, pid, prod[0], prod[1], prod[3], qty, refP, amt, actualP, actualAmt]);
      }
      await conn.query('UPDATE purchase_orders SET total_amount = ? WHERE id = ?', [total, poId]);
    }

    // Sales Orders
    const sales = [
      ['CK-2026-001', 1, '2026-01-25', [[1,10,79.00,78.00],[3,80,25.00,24.50],[5,20,159.00,155.00]], ''],
      ['CK-2026-002', 2, '2026-02-15', [[2,15,249.00,245.00],[4,20,68.00,66.00]], ''],
      ['CK-2026-003', 3, '2026-03-20', [[1,20,79.00,79.00],[6,15,128.00,126.00],[7,25,149.00,148.00]], ''],
      ['CK-2026-004', 4, '2026-04-18', [[2,10,249.00,249.00],[3,100,25.00,25.00],[8,12,99.00,98.00]], '批量采购'],
      ['CK-2026-005', 1, '2026-05-22', [[5,30,159.00,158.00],[6,20,128.00,127.00]], ''],
      ['CK-2026-006', 2, '2026-06-25', [[1,40,79.00,78.50],[2,20,249.00,248.00],[3,150,25.00,24.80],[4,15,68.00,67.50],[5,25,159.00,157.00],[7,30,149.00,148.00],[8,18,99.00,98.50]], '618大促'],
    ];
    for (const so of sales) {
      const [r] = await conn.query('INSERT INTO sales_orders (order_no, customer_id, order_date, remark) VALUES (?,?,?,?)', [so[0], so[1], so[2], so[4]]);
      const soId = r.insertId;
      let totalIncome = 0, totalCost = 0;
      for (const item of so[3]) {
        const [idx, qty, refPrice, actualPrice] = item;
        const prod = products[idx - 1];
        const income = qty * actualPrice;
        const cost = qty * prod[4]; // purchase_price
        totalIncome += income;
        totalCost += cost;
        await conn.query('INSERT INTO sales_order_items (sales_order_id, product_id, product_code, product_name, unit, quantity, ref_sale_price, ref_income, actual_sale_price, actual_income, cost_price, cost_amount, profit) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [soId, idx, prod[0], prod[1], prod[3], qty, refPrice, qty * refPrice, actualPrice, income, prod[4], cost, income - cost]);
      }
      await conn.query('UPDATE sales_orders SET total_income=?, total_cost=?, total_profit=? WHERE id=?', [totalIncome, totalCost, totalIncome - totalCost, soId]);
    }

    // Production Orders
    const productions = [
      ['GC-2026-001', 2, 'P002', '机械键盘', 100, 95, 'completed', '2026-01-01', '2026-01-15', '2026-01-01', '2026-01-14', '1月生产计划', [[3,50,'根','P003',50,50],[6,10,'个','P006',10,10]]],
      ['GC-2026-002', 5, 'P005', '蓝牙耳机', 200, 180, 'completed', '2026-02-01', '2026-02-20', '2026-02-01', '2026-02-18', '2月生产计划', [[3,200,'根','P003',200,180],[6,200,'个','P006',200,180]]],
      ['GC-2026-003', 1, 'P001', '无线鼠标', 150, 120, 'in_progress', '2026-06-01', '2026-06-30', '2026-06-01', null, '6月生产计划', [[3,150,'根','P003',150,120],[6,150,'个','P006',150,120]]],
    ];
    for (const po of productions) {
      const [r] = await conn.query('INSERT INTO production_orders (order_no, product_id, product_code, product_name, plan_quantity, actual_quantity, status, plan_start_date, plan_end_date, actual_start_date, actual_end_date, remark) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)',
        [po[0], po[1], po[2], po[3], po[4], po[5], po[6], po[7], po[8], po[9], po[10], po[11]]);
      for (const mat of po[12]) {
        await conn.query('INSERT INTO production_materials (production_order_id, product_id, product_code, product_name, unit, plan_quantity, actual_quantity) VALUES (?,?,?,?,?,?,?)',
          [r.insertId, mat[0], mat[2], mat[3], mat[4], mat[5], mat[6]]);
      }
    }

    // Finance Records
    const finances = [
      ['SR-2026-001','income','销售收入','sales',1,12500.00,'银行','2026-01-25','1月销售收入'],
      ['SR-2026-002','income','销售收入','sales',2,18900.00,'银行','2026-02-15','2月销售收入'],
      ['SR-2026-003','income','销售收入','sales',3,21500.00,'银行','2026-03-20','3月销售收入'],
      ['SR-2026-004','income','销售收入','sales',4,31200.00,'银行','2026-04-18','4月销售收入'],
      ['SR-2026-005','income','销售收入','sales',5,27800.00,'银行','2026-05-22','5月销售收入'],
      ['SR-2026-006','income','销售收入','sales',6,89500.00,'银行','2026-06-25','618大促收入'],
      ['ZC-2026-001','expense','采购支出','purchase',1,15000.00,'银行','2026-01-15','1月采购付款'],
      ['ZC-2026-002','expense','采购支出','purchase',2,12000.00,'银行','2026-02-10','2月采购付款'],
      ['ZC-2026-003','expense','采购支出','purchase',3,18000.00,'银行','2026-03-05','3月采购付款'],
      ['ZC-2026-004','expense','租金','other',0,8000.00,'银行','2026-01-01','1季度房租'],
      ['ZC-2026-005','expense','工资','other',0,35000.00,'银行','2026-01-31','1月工资'],
      ['ZC-2026-006','expense','工资','other',0,35000.00,'银行','2026-02-28','2月工资'],
      ['ZC-2026-007','expense','工资','other',0,35000.00,'银行','2026-03-31','3月工资'],
      ['ZC-2026-008','expense','采购支出','purchase',4,14000.00,'银行','2026-04-12','4月采购'],
      ['ZC-2026-009','expense','采购支出','purchase',5,11000.00,'银行','2026-05-08','5月采购'],
      ['ZC-2026-010','expense','采购支出','purchase',6,32000.00,'银行','2026-06-15','6月采购'],
      ['ZC-2026-011','expense','工资','other',0,35000.00,'银行','2026-06-30','6月工资'],
      ['ZC-2026-012','expense','租金','other',0,8000.00,'银行','2026-04-01','2季度房租'],
    ];
    for (const f of finances) {
      await conn.query('INSERT INTO finance_records (record_no, record_type, category, related_type, related_id, amount, account, record_date, remark) VALUES (?,?,?,?,?,?,?,?,?)', f);
    }

    await conn.commit();
    res.json({ message: '演示数据初始化完成！', count: { products: products.length, suppliers: suppliers.length, customers: customers.length, purchases: purchases.length, sales: sales.length, productions: productions.length, finances: finances.length } });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally { conn.release(); }
});

module.exports = router;
