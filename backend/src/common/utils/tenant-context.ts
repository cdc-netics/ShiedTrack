import { AsyncLocalStorage } from 'async_hooks';

type TenantStore = {
  tenantId?: string;
};

const storage = new AsyncLocalStorage<TenantStore>();

export const runWithTenant = <T>(tenantId: string | undefined, fn: () => T): T => {
  return storage.run({ tenantId }, fn);
};

export const setTenant = (tenantId?: string) => {
  const store = storage.getStore();
  if (store) store.tenantId = tenantId;
};

export const getTenant = (): string | undefined => {
  const store = storage.getStore();
  return store?.tenantId;
};