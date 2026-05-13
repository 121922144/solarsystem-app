import { CustomRouteObject } from './types';
import ReactRouter from '@/pages/home/react-router';
import Hooks from '@/pages/home/react-router/hooks';
import List from '@/pages/home/react-router/list';
import Parameters from '@/pages/home/react-router/parameters';

export const homeRouters: CustomRouteObject[] = [
  {
    path: '/reactRouter',
    name: 'react-router',
    element: <ReactRouter />,
    children: [
      {
        path: '/reactRouter/parameters',
        name: '传参',
        element: <Parameters />,
      },
      {
        path: '/reactRouter/list/:paramsId',
        name: '测试传参',
        show: false,
        element: <List />,
      },
      {
        path: '/reactRouter/hooks',
        name: 'Hooks',
        element: <Hooks />,
      },
    ],
  },
];
