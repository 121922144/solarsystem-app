import { Card, Divider } from '@arco-design/web-react';
import { useParams } from 'react-router';
import { useSearchParams, useLocation } from 'react-router';

export default function List() {
  const { paramsId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  return (
    <div>
      <h3 className="mb-4">获取参数</h3>
      <Card className="mb-4" title="获取 Params 参数">
        <pre>
          <code>
            {`import { useParams } from 'react-router'
const { paramsId } = useParams()`}
          </code>
        </pre>
        <p className="text-rose">paramsId：{paramsId}</p>
      </Card>
      <Card className="mb-4" title="获取 Query 参数">
        <pre>
          <code>
            {`import { useSearchParams } from 'react-router'
const [searchParams] = useSearchParams()`}
          </code>
        </pre>
        <p className="text-rose">queryId：{searchParams.get('stateId')}</p>
        <Divider />
        <pre>
          <code>
            {`import { useLocation } from 'react-router'
const { search } = useLocation()`}
          </code>
        </pre>
        <p className="text-rose">search：{location.search}</p>
      </Card>
      <Card className="mb-4" title="获取 State 参数">
        <pre>
          <code>
            {`import { useLocation } from 'react-router'
const { state } = useLocation()`}
          </code>
        </pre>
        <p className="text-rose">state：{location.state?.stateId}</p>
      </Card>
    </div>
  );
}
