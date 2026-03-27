import {
  NavItemBlueprint,
  PageBlueprint,
  createFrontendPlugin,
} from '@backstage/frontend-plugin-api';
import VpnKeyIcon from '@material-ui/icons/VpnKey';
import { rootRouteRef } from './routes';

const secretsPage = PageBlueprint.make({
  params: {
    path: '/secrets',
    routeRef: rootRouteRef,
    title: 'Secrets Self-Service',
    icon: <VpnKeyIcon />,
    loader: () => import('./SecretsPage').then(m => <m.SecretsPage />),
  },
});

const secretsNavItem = NavItemBlueprint.make({
  params: {
    routeRef: rootRouteRef,
    title: 'Secrets',
    icon: VpnKeyIcon,
  },
});

export const secretsPlugin = createFrontendPlugin({
  pluginId: 'secrets',
  extensions: [secretsPage, secretsNavItem],
  routes: {
    root: rootRouteRef,
  },
});
