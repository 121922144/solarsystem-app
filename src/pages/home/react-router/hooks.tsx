import { Button, Card, Space } from '@arco-design/web-react';
import Paragraph from '@arco-design/web-react/es/Typography/paragraph';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export default function Hooks() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <div>
      <h1>Hooks</h1>
      <h2 className="mb-4">useNavigate</h2>
      <Paragraph>
        返回一个函数，该函数允许你在浏览器中以编程方式导航，以响应用户交互或效果。
      </Paragraph>
      <Card className="mb-4" title="参数是 string">
        <pre className="mb-4">
          <code>
            {`const navigate = useNavigate()'
navigate('/reactRouter/list/123')`}
          </code>
        </pre>
        <Space>
          <Button
            type="primary"
            onClick={() => navigate('/reactRouter/list/123')}
          >
            navigate('/reactRouter/list/123')
          </Button>
        </Space>
      </Card>
      <Card className="mb-4" title="参数是 Path 对象">
        <pre className="mb-4">
          <code>
            {`const navigate = useNavigate()'
navigate({
  pathname: "/reactRouter/list/123",
  search: "?taskId=123",
})`}
          </code>
        </pre>
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate({
                pathname: '/reactRouter/list/123',
                search: '?taskId=123',
              })
            }
          >
            navigate('/reactRouter/list/123')
          </Button>
        </Space>
      </Card>
      <Card className="mb-4" title="参数是 number">
        <pre className="mb-4">
          <code>
            {`const navigate = useNavigate()'
navigate(-1)
navigate(1)`}
          </code>
        </pre>
        <Space>
          <Button type="primary" onClick={() => navigate(-1)}>
            navigate(-1)
          </Button>
        </Space>
      </Card>
      <Card className="mb-4" title="参数是 string 和 NavigateOptions ">
        <pre className="mb-4">
          <code>
            {`const navigate = useNavigate()'
navigate('/reactRouter/list/123', {
  state: { taskId: 123 }
})`}
          </code>
        </pre>
        <Space>
          <Button
            type="primary"
            onClick={() =>
              navigate('/reactRouter/list/123', {
                state: { taskId: 123 },
              })
            }
          >
            {`navigate('/reactRouter/list/123', {
                state: { taskId: 123 }
              })`}
          </Button>
        </Space>
      </Card>

      <h2 className="mb-4">useLocation</h2>
      <Paragraph>
        返回当前url的各种信息，例如pathname、search、state等
      </Paragraph>
      <Card className="mb-4" title="useLocation">
        <pre className="mb-4">
          <code>{`const location = useLocation()`}</code>
        </pre>
        <p className="text-rose">location：{JSON.stringify(location)}</p>
      </Card>

      <h2 className="mb-4">useSearchParams</h2>
      <Paragraph>
        返回当前url的search参数，以及一个函数，该函数允许你以编程方式更新search参数。
      </Paragraph>
      <Card className="mb-4" title="参数是 string">
        <pre className="mb-4">
          <code>{`const [searchParams, setSearchParams] = useSearchParams()
setSearchParams('taskId=123')`}</code>
        </pre>
        <p className="text-rose mb-4">
          searchParams：{`{`}
          {[...searchParams.entries()].map(([key, value]) => (
            <span key={key} className="block">
              &emsp;{key}: {value}
            </span>
          ))}
          {`}`}
        </p>
        <Space>
          <Button type="primary" onClick={() => setSearchParams('taskId=123')}>
            {`setSearchParams('taskId=123')`}
          </Button>
        </Space>
      </Card>
      <Card className="mb-4" title="参数是 object">
        <pre className="mb-4">
          <code>{`setSearchParams({ tab1: '1', tab2: '2' })`}</code>
        </pre>
        <p className="text-rose mb-4">
          searchParams：{`{`}
          {[...searchParams.entries()].map(([key, value]) => (
            <span key={key} className="block">
              &emsp;{key}: {value}
            </span>
          ))}
          {`}`}
        </p>
        <Space>
          <Button
            type="primary"
            onClick={() => setSearchParams({ tab1: '1', tab2: '2' })}
          >
            {`setSearchParams({ tab1: '1', tab2: '2' })`}
          </Button>
        </Space>
      </Card>
      <Card className="mb-4" title="参数是 array">
        <pre className="mb-4">
          <code>{`setSearchParams([['tab3', '3'], ['tab4', '4']])`}</code>
        </pre>
        <p className="text-rose mb-4">
          searchParams：{`{`}
          {[...searchParams.entries()].map(([key, value]) => (
            <span key={key} className="block">
              &emsp;{key}: {value}
            </span>
          ))}
          {`}`}
        </p>
        <Space>
          <Button
            type="primary"
            onClick={() =>
              setSearchParams([
                ['tab3', '3'],
                ['tab4', '4'],
              ])
            }
          >
            {`setSearchParams([['tab3', '3'], ['tab4', '4']])`}
          </Button>
        </Space>
      </Card>
    </div>
  );
}
