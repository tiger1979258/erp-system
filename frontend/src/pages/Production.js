import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Popconfirm, Tag, Card, Steps, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined, SyncOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { getProductions, getProducts, createProduction, updateProduction, deleteProduction } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

const statusMap = { pending: { text: '待开工', color: 'default' }, in_progress: { text: '生产中', color: 'processing' }, completed: { text: '已完成', color: 'success' }, cancelled: { text: '已取消', color: 'error' } };

export default function Production() {
  const [data, setData] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const loadAll = async () => { setLoading(true); try { const [r, p] = await Promise.all([getProductions(), getProducts()]); setData(r.data); setProducts(p.data); } catch { message.error('加载失败'); } finally { setLoading(false); } };
  useEffect(() => { loadAll(); }, []);

  const generateOrderNo = () => `GC-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  const handleAdd = () => { setEditing(null); form.resetFields(); form.setFieldsValue({ order_no: generateOrderNo(), status: 'pending', materials: [{ plan_quantity: 0 }] }); setModalOpen(true); };
  const handleEdit = (record) => { setEditing(record); const mats = (record.materials || []).map(m => ({ ...m })); form.setFieldsValue({ ...record, materials: mats.length ? mats : [{ plan_quantity: 0 }] }); setModalOpen(true); };

  const handleSubmit = async () => {
    try { const vals = await form.validateFields(); } catch { return; }
    const materials = (vals.materials || []).filter(m => m.product_id).map(m => {
      const prod = products.find(p => p.id === m.product_id || p.id === m._product_id);
      return { product_id: prod?.id || m.product_id, product_code: prod?.product_code || '', product_name: prod?.product_name || '', unit: prod?.unit || '', plan_quantity: m.plan_quantity, actual_quantity: m.actual_quantity || 0, remark: m.remark || '' };
    });
    try {
      const payload = { order_no: vals.order_no, product_id: vals.product_id, product_code: vals.product_code, product_name: vals.product_name, plan_quantity: vals.plan_quantity, actual_quantity: vals.actual_quantity || 0, status: vals.status, plan_start_date: vals.plan_start_date?.format('YYYY-MM-DD'), plan_end_date: vals.plan_end_date?.format('YYYY-MM-DD'), actual_start_date: vals.actual_start_date?.format('YYYY-MM-DD'), actual_end_date: vals.actual_end_date?.format('YYYY-MM-DD'), materials, remark: vals.remark || '' };
      if (editing) await updateProduction(editing.id, payload); else await createProduction(payload);
      message.success(editing ? '更新成功' : '创建成功'); setModalOpen(false); loadAll();
    } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id) => { try { await deleteProduction(id); message.success('删除成功'); loadAll(); } catch { message.error('删除失败'); } };

  const columns = [
    { title: '工单号', dataIndex: 'order_no', width: 150 },
    { title: '成品', dataIndex: 'product_name', width: 150, render: (v, r) => `${r.product_code} - ${v}` },
    { title: '计划产量', dataIndex: 'plan_quantity', width: 100, align: 'center' },
    { title: '实际产量', dataIndex: 'actual_quantity', width: 100, align: 'center' },
    { title: '进度', dataIndex: 'actual_quantity', width: 150, align: 'center', render: (v, r) => {
      const pct = r.plan_quantity > 0 ? Math.round((v / r.plan_quantity) * 100) : 0;
      return <Tag color={pct >= 100 ? 'green' : pct > 0 ? 'blue' : 'default'}>{pct}%</Tag>;
    }},
    { title: '状态', dataIndex: 'status', width: 100, align: 'center', render: (v) => <Tag color={statusMap[v]?.color}>{statusMap[v]?.text}</Tag> },
    { title: '计划周期', dataIndex: 'plan_start_date', width: 200, render: (v, r) => `${v} ~ ${r.plan_end_date || '-'}` },
    { title: '操作', width: 120, align: 'center', fixed: 'right', render: (_, r) => (
      <Space>
        <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
        <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="确定" cancelText="取消"><Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button></Popconfirm>
      </Space>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>生产工单</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增工单</Button>
      </div>
      <Table columns={columns} dataSource={data} rowKey="id" loading={loading} expandable={{
        expandedRowRender: (record) => (
          <div>
            <Steps current={record.status === 'completed' ? 3 : record.status === 'in_progress' ? 2 : record.status === 'cancelled' ? -1 : 0} size="small" style={{ marginBottom: 16 }}>
              <Step title="待开工" status={record.status === 'cancelled' ? 'error' : 'finish'} />
              <Step title="生产中" status={record.status === 'in_progress' ? 'process' : record.status === 'completed' ? 'finish' : 'wait'} />
              <Step title="已完成" status={record.status === 'completed' ? 'finish' : 'wait'} />
            </Steps>
            <Table dataSource={record.materials || []} rowKey="id" pagination={false} size="small"
              columns={[
                { title: '物料编码', dataIndex: 'product_code', width: 120 },
                { title: '物料名称', dataIndex: 'product_name', width: 160 },
                { title: '单位', dataIndex: 'unit', width: 80, align: 'center' },
                { title: '计划领料', dataIndex: 'plan_quantity', width: 100, align: 'right' },
                { title: '实际领料', dataIndex: 'actual_quantity', width: 100, align: 'right' },
              ]}
            />
          </div>
        ),
      }} scroll={{ x: 900 }} />

      <Modal title={editing ? '编辑工单' : '新增工单'} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={800}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Space style={{ width: '100%' }}>
            <Form.Item name="order_no" label="工单号" rules={[{ required: true }]} style={{ width: '35%' }}><Input /></Form.Item>
            <Form.Item name="status" label="状态" style={{ width: '20%' }}>
              <Select><Option value="pending">待开工</Option><Option value="in_progress">生产中</Option><Option value="completed">已完成</Option><Option value="cancelled">已取消</Option></Select>
            </Form.Item>
          </Space>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="product_id" label="成品商品" rules={[{ required: true }]} style={{ marginBottom: 16 }}>
                <Select placeholder="选择成品" showSearch optionFilterProp="children" onChange={(id) => { const p = products.find(x => x.id === id); if (p) { form.setFieldsValue({ product_code: p.product_code, product_name: p.product_name, product_category: p.category }); } }}>
                  {products.map(p => <Option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="plan_quantity" label="计划产量" style={{ marginBottom: 16 }}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="plan_start_date" label="计划开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="plan_end_date" label="计划结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="actual_start_date" label="实际开始日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="actual_end_date" label="实际结束日期"><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="actual_quantity" label="实际产量"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <h4 style={{ marginTop: 16, marginBottom: 8 }}>领料清单</h4>
          <Form.List name="materials" initialValue={[{ plan_quantity: 0 }]}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Card size="small" key={key} style={{ marginBottom: 8 }} bodyStyle={{ padding: '8px 12px' }}>
                    <Space key={key} style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8 }} align="start">
                      <Form.Item {...rest} name={[name, 'product_id']} label="物料" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                        <Select placeholder="选择物料" showSearch optionFilterProp="children" style={{ width: 200 }}>
                          {products.map(p => <Option key={p.id} value={p.id}>{p.product_code} - {p.product_name}</Option>)}
                        </Select>
                      </Form.Item>
                      <Form.Item {...rest} name={[name, 'plan_quantity']} label="计划领料" style={{ marginBottom: 0 }}><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
                      <Form.Item {...rest} name={[name, 'actual_quantity']} label="实际领料" style={{ marginBottom: 0 }}><InputNumber min={0} style={{ width: 100 }} /></Form.Item>
                      <Button danger size="small" onClick={() => remove(name)}>删除</Button>
                    </Space>
                  </Card>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加领料行</Button>
              </>
            )}
          </Form.List>
          <Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
