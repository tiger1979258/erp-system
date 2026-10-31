# ERP 管理系统 — 部署指南

## 项目结构

```
erp-system/
├── backend/              # Node.js + Express 后端
│   ├── config/
│   │   └── database.js
│   ├── routes/
│   │   ├── products.js
│   │   ├── suppliers.js
│   │   ├── customers.js
│   │   ├── purchases.js
│   │   ├── sales.js
│   │   ├── production.js
│   │   ├── finance.js
│   │   ├── dashboard.js
│   │   └── seed.js       # 演示数据初始化
│   ├── server.js
│   └── package.json
├── frontend/             # React + Ant Design 前端
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/          # API 调用
│   │   ├── components/   # 布局组件
│   │   └── pages/        # 页面组件
│   ├── package.json
│   └── nginx.conf
├── init.sql             # 数据库初始化脚本
├── docker-compose.yml   # Docker 一键启动
├── Dockerfile.backend
├── Dockerfile.frontend
└── render.yaml          # Render 部署配置
```

## 功能模块

| 模块 | 功能 |
|------|------|
| 工作台 | 关键指标卡片、库存概览、预警 |
| 商品管理 | SKU增删改查、分类管理 |
| 入库管理 | 采购入库单、多商品明细、实际进价核算 |
| 销售出库 | 销售单、自动计算收入/成本/毛利 |
| 库存台账 | 实时库存、安全库存预警（红/黄/绿） |
| 生产工单 | 工单创建/跟踪、领料出库、进度管理 |
| 财务管理 | 收支记录、分类统计、净收益计算 |

## 方式一：Docker Compose 本地一键启动（推荐）

### 前置要求
- 安装 Docker Desktop

### 启动步骤

```bash
cd erp-system
docker-compose up -d
```

访问地址：
- **前端系统**：http://localhost
- **后端API**：http://localhost:3001/api/health

### 初始化演示数据

打开浏览器访问：
```
http://localhost/api/seed
```

或在后端容器中执行：
```bash
docker exec -it <backend-container-id> curl -X POST http://localhost:3001/api/seed
```

### 停止服务

```bash
docker-compose down
```

数据持久化存储在 Docker Volume `mysql_data` 中，重新启动不会丢失。

---

## 方式二：部署到 Render 免费托管

### 步骤 1：准备代码

将 `erp-system` 文件夹推送到 GitHub 仓库。

### 步骤 2：创建 MySQL 数据库

1. 登录 [Render](https://render.com) 并创建账户
2. 点击 **New +** → **PostgreSQL**（或使用外部 MySQL）
3. 记录数据库连接信息（Host、Port、User、Password、Database）
4. 在 Render Shell 中执行 `init.sql` 创建表结构

### 步骤 3：部署后端

1. 点击 **New +** → **Web Service**
2. 连接 GitHub 仓库，选择 `backend` 目录
3. 运行时选 **Node**，构建命令留空，启动命令：`node server.js`
4. 环境变量：
   - `DB_HOST` = 你的数据库主机
   - `DB_PORT` = 3306
   - `DB_USER` = 数据库用户名
   - `DB_PASSWORD` = 数据库密码
   - `DB_NAME` = erp_system
   - `PORT` = 10000
5. 点击 **Create Web Service**

### 步骤 4：部署前端

1. 点击 **New +** → **Static Site**
2. 连接 GitHub 仓库，选择 `frontend` 目录
3. 构建命令：`npm install && npm run build`
4. 发布目录：`build`
5. 重写规则添加：`/api/*` → `https://你的后端域名.onrender.com/api/:splat`

### 步骤 5：初始化数据

访问：`https://你的后端域名.onrender.com/api/seed`

---

## 方式三：部署到 Railway

### 步骤 1：准备代码

将项目推送到 GitHub。

### 步骤 2：部署

1. 登录 [Railway](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. 选择整个 `erp-system` 目录
3. Railway 会自动识别 `docker-compose.yml`，一键部署所有服务
4. 等待部署完成，获得公开访问地址

### 步骤 3：初始化数据

访问：`https://你的域名/api/seed`

---

## API 接口列表

### 基础
- `GET  /api/health` — 健康检查

### 商品
- `GET    /api/products` — 商品列表
- `POST   /api/products` — 创建商品
- `PUT    /api/products/:id` — 更新商品
- `DELETE /api/products/:id` — 删除商品

### 入库
- `GET    /api/purchases` — 入库单列表（含明细）
- `POST   /api/purchases` — 创建入库单
- `PUT    /api/purchases/:id` — 更新入库单
- `DELETE /api/purchases/:id` — 删除入库单

### 销售
- `GET    /api/sales` — 销售单列表（含明细）
- `POST   /api/sales` — 创建销售单
- `DELETE /api/sales/:id` — 删除销售单

### 生产
- `GET    /api/production` — 工单列表（含领料明细）
- `POST   /api/production` — 创建工单
- `PUT    /api/production/:id` — 更新工单
- `DELETE /api/production/:id` — 删除工单

### 财务
- `GET    /api/finance` — 收支记录
- `GET    /api/finance/summary/stats` — 财务汇总
- `POST   /api/finance` — 创建收支记录
- `PUT    /api/finance/:id` — 更新记录
- `DELETE /api/finance/:id` — 删除记录

### 看板
- `GET    /api/dashboard/overview` — 看板总览
- `GET    /api/dashboard/inventory` — 库存明细

### 演示数据
- `POST   /api/seed` — 初始化演示数据（清空重建）

---

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + Ant Design 5 + React Router 6 |
| 后端 | Node.js + Express + mysql2 |
| 数据库 | MySQL 8.0 |
| 部署 | Docker Compose / Render / Railway |

---

## 注意事项

- 数据库密码建议在生产环境中修改为强密码
- Render 免费版服务在 15 分钟无请求后会休眠，首次访问需要等待约 30 秒冷启动
- 演示数据包含 6 个月的采购/销售/生产/财务记录，可直接体验全流程
