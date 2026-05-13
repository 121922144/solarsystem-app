import { RouteObject } from 'react-router';

export type CustomRouteObject = RouteObject & {
  name?: string;
  show?: boolean;
  children?: CustomRouteObject[];
};
