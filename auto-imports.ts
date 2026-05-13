// Auto-import configurations
// This file defines commonly used modules that should be auto-imported

const autoImports = {
  // React core APIs
  react: [
    'useState',
    'useEffect',
    'useRef',
    'useCallback',
    'useMemo',
    'useContext',
    'useReducer',
    'useLayoutEffect',
    'useDebugValue',
    'useDeferredValue',
    'useTransition',
    'useId',
  ],

  // React Router DOM APIs
  'react-router-dom': [
    'useNavigate',
    'useLocation',
    'useParams',
    'useSearchParams',
    'Link',
    'NavLink',
    'Outlet',
    'useRoutes',
  ],

  // Arco Design components
  '@arco-design/web-react': [
    'Button',
    'Input',
    'Form',
    'Card',
    'Typography',
    'Grid',
    'Menu',
    'Layout',
  ],
} as const;

export default autoImports;

// Type definitions
export type AutoImportModules = typeof autoImports;
