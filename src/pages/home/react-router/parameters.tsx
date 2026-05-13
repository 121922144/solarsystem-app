import { Button, Card, Space } from '@arco-design/web-react';
import { Link, NavLink, useNavigate } from 'react-router';

export default function Parameters() {
  const navigate = useNavigate();

  return (
    <div>
      <h1>传参</h1>
      <h2 className="mb-4">1、Params 传参</h2>
      <Card className="mb-4" title="NavLink 跳转">
        <Space>
          <NavLink to="/reactRouter/list/123">
            跳转到/reactRouter/list/123
          </NavLink>
          <NavLink to="/reactRouter/parameters">
            跳转到/reactRouter/parameters
          </NavLink>
        </Space>
      </Card>
      <Card className="mb-4" title="Link 跳转">
        <Space>
          <Link to="/reactRouter/list/456">/reactRouter/list/456</Link>
          <Link to="/reactRouter/parameters">/reactRouter/parameters</Link>
        </Space>
      </Card>
      <Card className="mb-4" title="useNavigate 跳转">
        <Space>
          <Button
            type="primary"
            onClick={() => navigate('/reactRouter/list/789')}
          >
            跳转到/reactRouter/list/789
          </Button>
        </Space>
      </Card>

      <h2 className="mb-4">2、Query 传参</h2>
      <Card className="mb-4" title="NavLink 跳转">
        <Space>
          <NavLink to="/reactRouter/list/123?queryId=123">
            跳转到/reactRouter/list/123?queryId=123
          </NavLink>
        </Space>
      </Card>
      <Card className="mb-4" title="Link 跳转">
        <Space>
          <Link
            to={{
              pathname: '/reactRouter/list/456',
              search: '?queryId=456',
            }}
          >
            跳转到/reactRouter/list/456?queryId=456
          </Link>
        </Space>
      </Card>
      <Card className="mb-4" title="useNavigate 跳转">
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate({
                pathname: '/reactRouter/list/789',
                search: '?queryId=789',
              })
            }
          >
            跳转到/reactRouter/list/789?queryId=789
          </Button>
        </Space>
      </Card>

      <h2 className="mb-4">3、State 传参</h2>
      <Card className="mb-4" title="NavLink 跳转">
        <Space>
          <NavLink to="/reactRouter/list/123" state={{ stateId: 123 }}>
            跳转到/reactRouter/list/123
          </NavLink>
        </Space>
      </Card>
      <Card className="mb-4" title="Link 跳转">
        <Space>
          <Link to="/reactRouter/list/456" state={{ stateId: 456 }}>
            /reactRouter/list/456
          </Link>
        </Space>
      </Card>
      <Card className="mb-4" title="useNavigate 跳转">
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate('/reactRouter/list/789', { state: { stateId: 789 } })
            }
          >
            跳转到/reactRouter/list/789
          </Button>
        </Space>
      </Card>
    </div>
  );
}
