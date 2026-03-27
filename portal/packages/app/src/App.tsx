import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import { navModule } from './modules/nav';
import { secretsPlugin } from './modules/secrets';

export default createApp({
  features: [catalogPlugin, navModule, secretsPlugin],
});
