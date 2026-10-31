import React, { useEffect, useState } from 'react';
import { Table, Tag, Statistic, Row, Col, Card } from 'antd';
import { InboxOutlined, ShoppingOutlined, WarningOutlined } from '@ant-design/icons';
import { getInventoryDetail } from '../api';

export default function Inventory() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try { const r = await getInventoryDetail(); setData(r.data); }
    catch { } finally { setLoading(false); }
  };

  const outOfStock = data.filter(d => d.current_stock <= 0).length;
  const lowStock = data.filter(d => d.current_stock > 0 && d.current_stock <= d.safe_stock).length;
  const totalValue = data.reduce((sum, d) => sum + d.current_stock * (d.purchase_price || 0), 0);

  const columns = [
    { title: '商品编码', dataIndex: 'product_code', width: 120 },
    { title: '商品名称', dataIndex: 'product_name', width: 160 },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
    { title: '累计入库', dataIndex: 'total_in', width: 100, align: 'right' },
    { title: '累计出库', dataIndex: 'total_out', width: 100, align: 'right' },
    { title: '当前库存', dataIndex: 'current_stock', width: 100, align: 'right', render: (v, r) => <b style={{ color: v <= 0 ? '#f5222d' : v <= r.safe_stock ? '#fa8c16' : '#3f8600' }}>{v}</b> },
    { title: '安全库存', dataIndex: 'safe_stock', width: 100, align: 'center' },
    { title: '库存状态', dataIndex: 'current_stock', width: 120, align: 'center', render: (v, r) => {
      if (v <= 0) return <Tag color="red" icon={<WarningOutlined />}>缺货</Tag>;
      if (v <= r.safe_stock) return <Tag color="orange" icon={<WarningOutlined />}>库存不足</Tag>;
      return <Tag color="green">正常</Tag>;
    }},
    { title: '参考进价', dataIndex: 'purchase_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
    { title: '参考售价', dataIndex: 'sale_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
    { title: '库存价值', dataIndex: 'current_stock', width: 120, align: 'right', render: (v, r) => `¥${(v * (r.purchase_price || 0)).toFixed(2)}` },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>库存台账</h2>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}><Card><Statistic title="总SKU数" value={data.length} prefix={<InboxOutlined />} valueStyle={{ color: '#1890ff' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="缺货商品" value={outOfStock} prefix={<WarningOutlined />} valueStyle={{ color: '#f5222d' }} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title="库存总价值" value={totalValue} prefix="¥" precision={2} valueStyle={{ color: '#3f8600' }} /></Card></Col>
      </Row>
      <Card>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} scroll={{ x: 1200 }} />
      </Card>
    </div>
  );
}
