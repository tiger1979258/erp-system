import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Spin, message } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, InboxOutlined, FactoryOutlined, WarningOutlined } from '@ant-design/icons';
import { getDashboardOverview, getInventoryDetail } from '../api';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ov, inv] = await Promise.all([getDashboardOverview(), getInventoryDetail()]);
      setOverview(ov.data);
      setInventory(inv.data);
    } catch (e) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const invColumns = [
    { title: '编码', dataIndex: 'product_code', width: 100 },
    { title: '名称', dataIndex: 'product_name', width: 150 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '安全库存', dataIndex: 'safe_stock', width: 100, align: 'center' },
    { title: '累计入库', dataIndex: 'total_in', width: 100, align: 'right' },
    { title: '累计出库', dataIndex: 'total_out', width: 100, align: 'right' },
    { title: '当前库存', dataIndex: 'current_stock', width: 100, align: 'right', render: (v) => <b>{v}</b> },
    { title: '状态', dataIndex: 'current_stock', width: 120, align: 'center', render: (v, row) => {
      if (v <= 0) return <Tag color="red">缺货</Tag>;
      if (v <= row.safe_stock) return <Tag color="orange">库存不足</Tag>;
      return <Tag color="green">正常</Tag>;
    }},
  ];

  if (loading || !overview) return <Spin size="large" style={{ display: 'flex', justifyContent: 'center', marginTop: 100 }} />;

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>工作台</h2>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="总商品数" value={overview.inventory?.total_products || 0} prefix={<InboxOutlined />} valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月销售收入" value={overview.sales?.month_income || 0} prefix="¥" precision={2} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月毛利润" value={overview.sales?.month_profit || 0} prefix="¥" precision={2} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="进行中生产工单" value={overview.production?.pending_orders || 0} prefix={<FactoryOutlined />} valueStyle={{ color: '#722ed1' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月采购支出" value={overview.purchase?.month_purchase || 0} prefix="¥" precision={2} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="本月净收益" value={(overview.finance?.month_finance_income || 0) - (overview.finance?.month_finance_expense || 0)} prefix="¥" precision={2} valueStyle={{ color: '#389e0d' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="缺货商品" value={overview.inventory?.out_of_stock || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#f5222d' }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><Statistic title="低库存预警" value={overview.inventory?.low_stock || 0} prefix={<WarningOutlined />} valueStyle={{ color: '#fa8c16' }} /></Card>
        </Col>
      </Row>

      <Card title="库存概览" style={{ marginTop: 24 }}>
        <Table columns={invColumns} dataSource={inventory} rowKey="id" size="middle" pagination={{ pageSize: 10 }} scroll={{ x: 900 }} />
      </Card>
    </div>
  );
}
