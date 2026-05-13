import { Layout, Menu } from '@arco-design/web-react';
import Sider from '@arco-design/web-react/es/Layout/sider';
import { Outlet } from 'react-router-dom';
import { homeRouters } from '@/router/home-router';
import { CustomRouteObject } from '@/router/types';
import { useLocation, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';

const SubMenu = Menu.SubMenu;
const MenuItem = Menu.Item;

export default function Home() {
  const navigator = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([
    '/reactRouter/parameters',
  ]);

  const handleMenuClick = (path: string) => {
    setSelectedKeys([path]);
    navigator(path);
  };

  useEffect(() => {
    setSelectedKeys([location.pathname]);
  }, [location]);

  return (
    <Layout className="h-full">
      <Sider>
        <Menu defaultOpenKeys={['/reactRouter']} selectedKeys={selectedKeys}>
          {homeRouters.map(router => (
            <SubMenu key={router.path!} title={router.name}>
              {router.children &&
                router.children
                  .filter(
                    (childRouter: CustomRouteObject) =>
                      childRouter.show !== false
                  )
                  .map((childRouter: CustomRouteObject) => {
                    return (
                      <MenuItem
                        key={childRouter.path!}
                        onClick={() => handleMenuClick(childRouter.path!)}
                      >
                        {childRouter.name}
                      </MenuItem>
                    );
                  })}
            </SubMenu>
          ))}
        </Menu>
      </Sider>
      <Layout className="h-full p-4 overflow-auto">
        {/* 使用 Outlet 渲染嵌套路由 */}
        <Outlet />
      </Layout>
    </Layout>
  );
}
