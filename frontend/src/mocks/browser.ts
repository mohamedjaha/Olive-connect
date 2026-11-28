import { setupWorker } from 'msw/browser';
import { vergersHandlers } from './vergers';
import { recoltesHandlers } from './recoltes';
import { alertesHandlers } from './alertes';
import { tourneesHandlers } from './tournees';
import { utilisateursHandlers } from './utilisateurs';

export const worker = setupWorker(
  ...utilisateursHandlers,
  ...vergersHandlers,
  ...recoltesHandlers,
  ...alertesHandlers,
  ...tourneesHandlers,
);
