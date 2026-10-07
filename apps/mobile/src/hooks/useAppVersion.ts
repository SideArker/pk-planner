import { useAppUpdate } from '@/context/UpdateContext';

export function useAppVersion() {
  const update = useAppUpdate();

  return {
    ...update,
    openUpdate: update.openModal,
  };
}
