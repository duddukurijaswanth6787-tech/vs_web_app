import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../types';
export declare const loggerContextStorage: AsyncLocalStorage<RequestContext>;
