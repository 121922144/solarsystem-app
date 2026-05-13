import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@arco-design/web-react';

interface ListItem {
  id: number;
  name: string;
  description: string;
}

const ListPage: React.FC = () => {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  console.log('navigate', navigate.state);
  const [listData, setListData] = useState<ListItem[]>([]);

  useEffect(() => {
    // 模拟获取列表数据
    const fetchData = async () => {
      // 根据 targetId 获取不同的数据
      const mockData = [
        { id: 1, name: `Item 1 for ${targetId}`, description: 'Description 1' },
        { id: 2, name: `Item 2 for ${targetId}`, description: 'Description 2' },
        { id: 3, name: `Item 3 for ${targetId}`, description: 'Description 3' },
      ];
      setListData(mockData);
    };

    fetchData();
  }, [targetId]);

  return (
    <div className="list-page p-4">
      <h1>List Page</h1>
      <h2>Target ID: {targetId}</h2>

      <div className="mb-4">
        <Button type="primary" onClick={() => navigate('/')} className="mr-2">
          Go Home
        </Button>
        <Link to="/about">
          <Button type="secondary" className="mr-2">
            Go to About
          </Button>
        </Link>
      </div>

      <div className="list-container">
        <h3>List Items:</h3>
        {listData.length > 0 ? (
          <ul>
            {listData.map(item => (
              <li key={item.id} className="p-2 border-b border-gray-200">
                <strong>{item.name}</strong>
                <p>{item.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
};

export default ListPage;
