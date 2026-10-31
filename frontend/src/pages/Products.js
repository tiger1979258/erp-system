import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Space, Popconfirm, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api';

const categories = ['电子产品', '配件', '原材料', '成品', '包装材料', '其他'];

export default function Products() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const load = async () => { setLoading(true); try { const r = await getProducts(); setData(r.data); } catch { message.error('加载失败'); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (record) => { setEditing(record); form.setFieldsValue(record); setModalOpen(true); };

  const handleSubmit = async () => {
    try { const vals = await form.validateFields(); }
    catch { return; }
    try {
      if (editing) await updateProduct(editing.id, vals);
      else await createProduct(vals);
      message.success(editing ? '更新成功' : '创建成功');
      setModalOpen(false); load();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id) => {
    try { await deleteProduct(id); message.success('删除成功'); load(); }
    catch { message.error('删除失败'); }
  };

  const columns = [
    { title: '商品编码', dataIndex: 'product_code', width: 120 },
    { title: '商品名称', dataIndex: 'product_name', width: 180 },
    { title: '分类', dataIndex: 'category', width: 120, render: (v) => v ? <Tag color="blue">{v}</Tag> : '-' },
    { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
    { title: '参考进价', dataIndex: 'purchase_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
    { title: '参考售价', dataIndex: 'sale_price', width: 120, align: 'right', render: (v) => `¥${Number(v).toFixed(2)}` },
    { title: '安全库存', dataIndex: 'safe_stock', width: 100, align: 'center' },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '操作', width: 120, align: 'center', fixed: 'right', render: (_, record) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)} okText="确定" cancelText="取消">
          <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>商品管理</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增商品</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 900 }} />
      <Modal title={editing ? '编辑商品' : '新增商品'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="product_code" label="商品编码" rules={[{ required: true }]}><Input placeholder="如 P001" /></Form.Item>
          <Form.Item name="product_name" label="商品名称" rules={[{ required: true }]}><Input placeholder="请输入商品名称" /></Form.Item>
          <Form.Item name="category" label="分类">
            <Select options={categories.map(c => ({ value: c, label: c }))} allowClear placeholder="请选择分类" />
          </Form.Item>
          <Form.Item name="unit" label="单位"><Input placeholder="如 个/台/箱/千克" /></Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="purchase_price" label="参考进价(¥)" style={{ width: '50%' }}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
            <Form.Item name="sale_price" label="参考售价(¥)" style={{ width: '50%' }}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="safe_stock" label="安全库存"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} placeholder="备注信息" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
