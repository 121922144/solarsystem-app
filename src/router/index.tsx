import Home from '@/pages/home';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { homeRouters } from '@/router/home-router';
import Game from '@/pages/game';
import { CustomRouteObject } from './types';

const routers: CustomRouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/game" />,
  },
  {
    path: '/',
    element: <Home />,
    children: homeRouters,
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
