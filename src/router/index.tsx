import { createBrowserRouter, Navigate } from 'react-router-dom';
import Game from '@/pages/game';
import { CustomRouteObject } from './types';

const routers: CustomRouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/game" />,
  },
  {
    path: '/game',
    element: <Game />,
  },
  {
    path: '/game/:mode',
    element: <Game />,
  },
];

export const router = createBrowserRouter(routers);
