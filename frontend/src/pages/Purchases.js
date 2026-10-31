import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Popconfirm, Tag, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getPurchases, getProducts, getSuppliers, createPurchase, updatePurchase, deletePurchase } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

export default function Purchases() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pR, prR, sR] = await Promise.all([getPurchases(), getProducts(), getSuppliers()]);
      setData(pR.data); setProducts(prR.data); setSuppliers(sR.data);
    } catch { message.error('加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { loadAll(); }, []);

  const generateOrderNo = () => `RK-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  const handleAdd = () => {
    setEditing(null);
    form.setFieldsValue({ order_no: generateOrderNo(), order_date: dayjs(), items: [{ quantity: 0, ref_purchase_price: 0, actual_purchase_price: 0 }] });
    setModalOpen(true);
  };

  const handleEdit = (record) => {
    setEditing(record);
    const items = (record.items || []).map(it => ({ ...it, _product_id: it.product_id }));
    form.setFieldsValue({ ...record, order_date: dayjs(record.order_date), items });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try { const vals = await form.validateFields(); }
    catch { return; }
    const items = (vals.items || []).filter(it => it.product_id).map(it => {
      const prod = products.find(p => p.id === it.product_id || p.id === it._product_id);
      return { product_id: prod?.id || it.product_id, product_code: prod?.product_code || '', product_name: prod?.product_name || '', unit: prod?.unit || '', quantity: it.quantity, ref_purchase_price: it.ref_purchase_price, actual_purchase_price: it.actual_purchase_price, remark: it.remark || '' };
    });
    if (items.length === 0) { message.error('请至少添加一个商品'); return; }
    const payload = { order_no: vals.order_no, supplier_id: vals.supplier_id, order_date: vals.order_date.format('YYYY-MM-DD'), items, remark: vals.remark || '' };
    try {
      if (editing) await updatePurchase(editing.id, payload); else await createPurchase(payload);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); loadAll();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id) => { try { await deletePurchase(id); message.success('删除成功'); loadAll(); } catch { message.error('删除失败'); } };

  const columns = [
    { title: '入库单号', dataIndex: 'order_no', width: 160 },
    { title: '日期', dataIndex: 'order_date', width: 120, render: (v) => v },
    { title: '供应商', dataIndex: ['supplier', 'supplier_name'], width: 180, render: (v, r) => r.supplier?.supplier_name || '-' },
    { title: '总金额', dataIndex: 'total_amount', width: 120, align: 'right', render: (v) => `¥${Number(v || 0).toFixed(2)}` },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '操作', width: 120, align: 'center', fixed: 'right', render: (_, r) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="确定" cancelText="取消">
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>入库管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增入库单</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} expandable={{
        expandedRowRender: (record) => (
          <Table
            dataSource={record.items || []}
            rowKey="id"
            pagination={false}
            size="small"
            columns={[
              { title: '商品编码', dataIndex: 'product_code', width: 120 },
              { title: '商品名称', dataIndex: 'product_name', width: 160 },
              { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
              { title: '入库数量', dataIndex: 'quantity', width: 100, align: 'right' },
              { title: '参考进价', dataIndex: 'ref_purchase_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '实际进价', dataIndex: 'actual_purchase_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
              { title: '实际金额', dataIndex: 'actual_amount', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
            ]}
            style={{ margin: '-8px 0' }}
          />
        ),
        rowExpandable: (record) => record.items && record.items.length > 0,
      }} scroll={{ x: 900 }} />

      <Modal title={editing ? '编辑入库单' : '新增入库单'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={800}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }}>
            <Form.Item name="order_no" label="入库单号" rules={[{ required: true }]} style={{ width: '40%' }}><Input /></Form.Item>
            <Form.Item name="supplier_id" label="供应商" style={{ width: '30%' }}>
              <Select placeholder="选择供应商" allowClear>
                {suppliers.map(s => <Option key={s.id} value={s.id}>{s.supplier_name}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="order_date" label="日期" rules={[{ required: true }]} style={{ width: '30%' }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.List name="items" initialValue={[{ quantity: 0, ref_purchase_price: 0, actual_purchase_price: 0 }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card size="small" key={key} style={{ marginBottom: 8 }} bodyStyle={{ padding: '8px 12px' }}>
                    <Space key={key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }} align="start">
                      <Form.Item {...rest} name={[name, 'product_id']} label="商品" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="选择商品" showSearch optionFilterProp="children" style={{ width: 200 }}>
                          {products.map(p => <Option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'quantity']} label="数量" style={{ marginBottom: 0 }}><InputNumber min={1} style={{ width: 80 }} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'ref_purchase_price']} label="参考进价" style={{ marginBottom: 0 }}><InputNumber min={0} precision={2} style={{ width: 120 }} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'actual_purchase_price']} label="实际进价" style={{ marginBottom: 0 }}><InputNumber min={0} precision={2} style={{ width: 120 }} /></Form.Item>
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
