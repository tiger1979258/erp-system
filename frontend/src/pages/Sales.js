import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Popconfirm, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getSales, getProducts, getCustomers, createSale, deleteSale } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function Sales() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sR, pR, cR] = await Promise.all([getSales(), getProducts(), getCustomers()]);
      setData(sR.data); setProducts(pR.data); setCustomers(cR.data);
    } catch { message.error('加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const generateOrderNo = () => `CK-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  const handleAdd = () => { form.resetFields(); form.setFieldsValue({ order_no: generateOrderNo(), order_date: dayjs(), items: [{ quantity: 0, ref_sale_price: 0, actual_sale_price: 0 }] }); setModalOpen(true); };

  const handleSubmit = async () => {
    try { const vals = await form.validateFields(); }
    catch { return; }
    const items = (vals.items || []).filter(it => it.product_id).map(it => {
      const prod = products.find(p => p.id === it.product_id || p.id === it._product_id);
      return { product_id: prod?.id || it.product_id, product_code: prod?.product_code || '', product_name: prod?.product_name || '', unit: prod?.unit || '', quantity: it.quantity, ref_sale_price: it.ref_sale_price, actual_sale_price: it.actual_sale_price, cost_price: prod?.purchase_price || 0, remark: it.remark || '' };
    });
    if (items.length === 0) { message.error('请至少添加一个商品'); return; }
    try {
      await createSale({ order_no: vals.order_no, customer_id: vals.customer_id, order_date: vals.order_date.format('YYYY-MM-DD'), items, remark: vals.remark || '' });
      message.success('创建成功'); setModalOpen(false); loadAll();
    } catch { message.error('创建失败'); }
  };

  const handleDelete = async (id) => { try { await deleteSale(id); message.success('删除成功'); loadAll(); } catch { message.error('删除失败'); } };

  const columns = [
    { title: '销售单号', dataIndex: 'order_no', width: 160 },
    { title: '日期', dataIndex: 'order_date', width: 120 },
    { title: '客户', dataIndex: ['customer', 'customer_name'], width: 160, render: (v, r) => r.customer?.customer_name || '-' },
    { title: '总收入', dataIndex: 'total_income', width: 120, align: 'right', render: (v) => <b style={{ color: '#3f8600' }}>¥{Number(v || 0).toFixed(2)}</b> },
    { title: '总成本', dataIndex: 'total_cost', width: 120, align: 'right', render: (v) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '毛利', dataIndex: 'total_profit', width: 120, align: 'right', render: (v) => <b style={{ color: '#cf1322' }}>¥{Number(v || 0).toFixed(2)}</b> },
    { title: '操作', width: 80, align: 'center', fixed: 'right', render: (_, r) => (
      <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="确定" cancelText="取消">
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Popconfirm>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>销售出库</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增销售单</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} expandable={{
        expandedRowRender: (record) => (
          <Table dataSource={record.items || []} rowKey="id" pagination={false} size="small"
            columns={[
              { title: '商品编码', dataIndex: 'product_code', width: 120 },
              { title: '商品名称', dataIndex: 'product_name', width: 160 },
              { title: '数量', dataIndex: 'quantity', width: 80, align: 'right' },
              { title: '参考售价', dataIndex: 'ref_sale_price', width: 100, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '实际售价', dataIndex: 'actual_sale_price', width: 100, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '实际收入', dataIndex: 'actual_income', width: 120, align: 'right', render: (v) => <b>¥{Number(v).toFixed(2)}</b> },
              { title: '成本单价', dataIndex: 'cost_price', width: 100, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '销售成本', dataIndex: 'cost_amount', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '毛利', dataIndex: 'profit', width: 120, align: 'right', render: (v) => <b style={{ color: Number(v) >= 0 ? '#3f8600' : '#cf1322' }}>¥{Number(v).toFixed(2)}</b> },
            ]}
            style={{ margin: '-8px 0' }}
          />
        ),
        rowExpandable: (record) => record.items && record.items.length > 0,
      }} scroll={{ x: 1100 }} />

      <Modal title="新增销售出库单" open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={900}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }}>
            <Form.Item name="order_no" label="销售单号" rules={[{ required: true }]} style={{ width: '35%' }}><Input /></Form.Item>
            <Form.Item name="customer_id" label="客户" style={{ width: '30%' }}>
              <Select placeholder="选择客户" allowClear><Option value="">散客</Option>{customers.map(c => <Option key={c.id} value={c.id}>{c.customer_name}</Option>)}</Select>
            </Form.Item>
            <Form.Item name="order_date" label="日期" rules={[{ required: true }]} style={{ width: '35%' }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.List name="items" initialValue={[{ quantity: 0, ref_sale_price: 0, actual_sale_price: 0 }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card size="small" key={key} style={{ marginBottom: 8 }} bodyStyle={{ padding: '8px 12px' }}>
                    <Space key={key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }} align="start">
                      <Form.Item {...rest} name={[name, 'product_id']} label="商品" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="选择商品" showSearch optionFilterProp="children" style={{ width: 220 }}>
                          {products.map(p => <Option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="数量" style={{ marginBottom: 0 }}><InputNumber min={1} style={{ width: 80 }} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'ref_sale_price']} label="参考售价" style={{ marginBottom: 0 }}><InputNumber min={0} precision={2} style={{ width: 110 }} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'actual_sale_price']} label="实际售价" style={{ marginBottom: 0 }}><InputNumber min={0} precision={2} style={{ width: 110 }} /></Form.Item>
                      <Button danger size="small" onClick={() => remove(name)}>删除</Button>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加商品行</Button>
              </>
            )}
          </Form.List>
          <Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
