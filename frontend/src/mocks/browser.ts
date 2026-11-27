import { setupWorker } from 'msw/browser';
import { vergersHandlers } from './vergers';
import { recoltesHandlers } from './recoltes';
import { alertesHandlers } from './alertes';
import { tourneesHandlers } from './tournees';

export const worker = setupWorker(...vergersHandlers, ...recoltesHandlers, ...alertesHandlers, ...tourneesHandlers);