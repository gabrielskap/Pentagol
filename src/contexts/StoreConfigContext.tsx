import React, { createContext, useContext, useEffect, useState } from 'react';
import { getConfigLoja, initDb, resetToSeedData, saveConfigLoja } from '../lib/db';
import { ConfigLoja } from '../types';

interface StoreConfigContextData {
  config: ConfigLoja;
  updateConfig: (newConfig: ConfigLoja) => void;
  restaurarDadosDemonstracao: () => void;
}

const StoreConfigContext = createContext<StoreConfigContextData>({} as StoreConfigContextData);

export const StoreConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<ConfigLoja>(() => {
    initDb();
    return getConfigLoja();
  });

  const refreshConfig = () => {
    setConfig(getConfigLoja());
  };

  useEffect(() => {
    const handleDbUpdated = () => {
      refreshConfig();
    };
    window.addEventListener('pentagol:db-updated', handleDbUpdated);
    return () => {
      window.removeEventListener('pentagol:db-updated', handleDbUpdated);
    };
  }, []);

  const updateConfig = (newConfig: ConfigLoja) => {
    saveConfigLoja(newConfig);
    setConfig(newConfig);
  };

  const restaurarDadosDemonstracao = () => {
    resetToSeedData();
    refreshConfig();
  };

  return (
    <StoreConfigContext.Provider value={{ config, updateConfig, restaurarDadosDemonstracao }}>
      {children}
    </StoreConfigContext.Provider>
  );
};

export const useStoreConfig = () => useContext(StoreConfigContext);
