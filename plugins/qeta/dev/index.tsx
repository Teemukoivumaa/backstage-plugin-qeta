import React from 'react';
import { createDevApp } from '@backstage/dev-utils';
import { QetaPage } from '../src/plugin';
import {
  createPlugin,
  createRoutableExtension,
} from '@backstage/core-plugin-api';
import { qetaRouteRef } from '@drodil/backstage-plugin-qeta-react';
import { entityRouteRef } from '@backstage/plugin-catalog-react';
import { TablePage } from './TablePage';
import { HomePage } from './HomePage';
import { StatisticsPage } from './StatisticsPage';
import { TagPage } from './TagPage';
import {
  NotificationsPage,
  notificationsPlugin,
  NotificationsSidebarItem,
} from '@backstage/plugin-notifications';
import { catalogPlugin } from '@backstage/plugin-catalog';
import { signalsPlugin } from '@backstage/plugin-signals';

export const CatalogEntityPage: () => JSX.Element = catalogPlugin.provide(
  createRoutableExtension({
    name: 'CatalogEntityPage',
    component: () => import('./ComponentPage').then(m => m.ComponentPage),
    mountPoint: entityRouteRef,
  }),
);

const qetaDevPlugin = createPlugin({
  id: 'qetaDev',
  routes: {
    root: qetaRouteRef,
  },
  externalRoutes: {},
});

createDevApp()
  .registerPlugin(catalogPlugin)
  .registerPlugin(qetaDevPlugin)
  .registerPlugin(notificationsPlugin)
  .registerPlugin(signalsPlugin)
  .addPage({
    element: (
      <QetaPage
        title="Questions and answers"
        subtitle="We have answers to everything!"
      />
    ),
    title: 'Root Page',
    path: '/qeta',
  })
  .addPage({
    element: <CatalogEntityPage />,
    title: 'Component',
    path: '/catalog/default/component/test-component',
  })
  .addPage({
    element: <TagPage />,
    title: 'Tag container',
    path: '/tag-container',
  })
  .addPage({
    element: <TablePage />,
    title: 'Table',
    path: '/table',
  })
  .addPage({
    element: <HomePage />,
    title: 'Home Page',
    path: '/home',
  })
  .addPage({
    element: <StatisticsPage />,
    title: 'Statistics Components',
    path: '/statistics',
  })
  .addPage({ element: <NotificationsPage />, path: '/notifications' })
  .addSidebarItem(<NotificationsSidebarItem />)
  .render();
