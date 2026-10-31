import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, DatePicker, message, Space, Popconfirm, Tag, Card, Row, Col, Statistic } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { getFinanceRecords, getFinanceSummary, createFinanceRecord, deleteFinanceRecord } from '../api';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const typeMap = { income: { text: '收入', color: 'green' }, expense: { text: '支出', color: 'red' } };
const categoryMap = { '销售收入': 'income', '采购支出': 'expense', '工资': 'expense', '租金': 'expense', '其他': 'other' };

export default function Finance() {
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [form] = Form.useForm();

  const loadData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterType) params.record_type = filterType;
      const [r, s] = await Promise.all([getFinanceRecords(params), getFinanceSummary()]);
      setData(r.data); setSummary(s.data);
    } catch { message.error('加载失败'); } finally { setLoading(false); }
  };
  useEffect(() => { loadData(); }, [filterType]);

  const generateRecordNo = () => `PZ-${dayjs().format('YYYYMMDD')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`;

  const handleAdd = () => { form.resetFields(); form.setFieldsValue({ record_no: generateRecordNo(), record_date: dayjs() }); setModalOpen(true); };

  const handleSubmit = async () => {
    try { const vals = await form.validateFields(); } catch { return; }
    try { await createFinanceRecord({ ...vals, record_date: vals.record_date.format('YYYY-MM-DD') }); message.success('创建成功'); setModalOpen(false); loadData(); }
    catch { message.error('创建失败'); }
  };

  const handleDelete = async (id) => { try { await deleteFinanceRecord(id); message.success('删除成功'); loadData(); } catch { message.error('删除失败'); } };

  const columns = [
    { title: '凭证号', dataIndex: 'record_no', width: 150 },
    { title: '类型', dataIndex: 'record_type', width: 80, align: 'center', render: (v) => <Tag color={typeMap[v]?.color}>{typeMap[v]?.text}</Tag> },
    { title: '类别', dataIndex: 'category', width: 120 },
    { title: '关联业务', dataIndex: 'related_type', width: 100, render: (v) => v === 'sales' ? '销售' : v === 'purchase' ? '采购' : v === 'production' ? '生产' : '其他' },
    { title: '金额', dataIndex: 'amount', width: 120, align: 'right', render: (v, r) => <b style={{ color: r.record_type === 'income' ? '#3f8600' : '#cf1322' }}>¥{Number(v).toFixed(2)}</b> },
    { title: '账户', dataIndex: 'account', width: 100 },
    { title: '日期', dataIndex: 'record_date', width: 120 },
    { title: '备注', dataIndex: 'remark', ellipsis: true },
    { title: '操作', width: 80, align: 'center', fixed: 'right', render: (_, r) => (
      <Popconfirm title="确定删除？" onConfirm={() => handleDelete(r.id)} okText="确定" cancelText="取消">
        <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
      </Popconfirm>
    )},
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>财务管理</h2>
        <Space>
          <Select value={filterType} onChange={setFilterType} style={{ width: 120 }} allowClear placeholder="筛选类型">
            <Option value="income">收入</Option>
            <Option value="expense">支出</Option>
          </Select>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>记一笔</Button>
        </Space>
      </div>

      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}><Card><Statistic title="总收入" value={summary.total_income} prefix="¥" precision={2} valueStyle={{ color: '#3f8600' }} /></Card></Col>
          <Col xs={24} sm={8}><Card><Statistic title="总支出" value={summary.total_expense} prefix="¥" precision={2} valueStyle={{ color: '#cf1322' }} /></Card></Col>
          <Col xs={24} sm={8}><Card><Statistic title="净收益" value={summary.net_profit} prefix="¥" precision={2} valueStyle={{ color: summary.net_profit >= 0 ? '#1890ff' : '#cf1322' }} /></Card></Col>
        </Row>
      )}

      <Card>
        <Table columns={columns} dataSource={data} rowKey="id" loading={loading} scroll={{ x: 1000 }} />
      </Card>

      <Modal title="记一笔" open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="record_no" label="凭证号" rules={[{ required: true }]}><Input /></Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="record_type" label="类型" rules={[{ required: true }]} style={{ width: '30%' }}>
              <Select onChange={(v) => form.setFieldsValue({ category: undefined })}>
                <Option value="income">收入</Option>
                <Option value="expense">支出</Option>
              </Select>
            </Form.Item>
            <Form.Item name="category" label="类别" rules={[{ required: true }]} style={{ width: '40%' }}>
              <Select placeholder="选择类别">
                {(form.getFieldValue('record_type') === 'income' ? ['销售收入', '其他收入'] : ['采购支出', '工资', '租金', '其他支出']).map(c => <Option key={c} value={c}>{c}</Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="amount" label="金额(¥)" rules={[{ required: true }]} style={{ width: '30%' }}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="account" label="账户" style={{ width: '30%' }}>
              <Select placeholder="账户" allowClear><Option value="现金">现金</Option><Option value="银行">银行</Option><Option value="微信">微信</Option><Option value="支付宝">支付宝</Option></Select>
            </Form.Item>
            <Form.Item name="record_date" label="日期" rules={[{ required: true }]} style={{ width: '70%' }}><DatePicker style={{ width: '100%' }} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
