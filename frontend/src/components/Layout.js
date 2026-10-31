import React, { useState } from 'react';
import { Layout, Menu, Button, theme, Modal, message } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, InboxOutlined, ShoppingOutlined,
  FactoryOutlined, DollarOutlined, AppstoreOutlined, ReloadOutlined
} from '@ant-design/icons';
import { seedDemoData } from '../api';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: '工作台' },
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
  { key: '/purchases', icon: <InboxOutlined />, label: '入库管理' },
  { key: '/sales', icon: <ShoppingOutlined />, label: '销售出库' },
  { key: '/inventory', icon: <AppstoreOutlined />, label: '库存台账' },
  { key: '/production', icon: <FactoryOutlined />, label: '生产工单' },
  { key: '/finance', icon: <DollarOutlined />, label: '财务管理' },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const handleSeed = () => {
    Modal.confirm({
      title: '初始化演示数据',
      content: '此操作将清空所有现有数据并重新生成演示数据，确定继续吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: async () => {
        try {
          await seedDemoData();
          message.success('演示数据初始化完成！');
          window.location.reload();
        } catch (e) {
          message.error('初始化失败：' + (e.response?.data?.error || e.message));
        }
      }
    });
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark" width={220}
        style={{ background: 'linear-gradient(180deg, #1f4e79 0%, #2e75b6 100%)' }}>
        <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: '#fff', fontSize: collapsed ? 16 : 18, fontWeight: 'bold', whiteSpace: 'nowrap' }}>
            {collapsed ? 'ERP' : 'ERP 管理系统'}
          </span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <Button type="text" icon={collapsed ? <DashboardOutlined /> : <DashboardOutlined />} onClick={() => setCollapsed(!collapsed)} style={{ fontSize: 16 }} />
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Button icon={<ReloadOutlined />} onClick={handleSeed}>初始化演示数据</Button>
            <span style={{ color: '#999', fontSize: 12 }}>进销存 + 生产 + 财务</span>
          </div>
        </Header>
        <Content style={{ margin: 16, overflow: 'auto' }}>
          <div style={{ padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, minHeight: '100%' }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
