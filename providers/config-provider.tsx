"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from "react";

interface AppConfig {
  appName: string;
  features: {
    walletEnabled: boolean;
  };
  isLoading: boolean;
}

const defaultConfig: AppConfig = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "Kimlik.az",
  features: {
    walletEnabled: process.env.NEXT_PUBLIC_WALLET_ENABLED === "true",
  },
  isLoading: true,
};

const ConfigContext = createContext<AppConfig>(defaultConfig);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AppConfig>(defaultConfig);

  useEffect(() => {
    // Fetch config from backend API
    const fetchConfig = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://100.89.150.50:8011/api";
        const response = await fetch(`${API_URL}/config`);
        if (response.ok) {
          const data = await response.json();
          if (data.status === "success" && data.data) {
            setConfig({
              appName: data.data.app_name || defaultConfig.appName,
              features: {
                walletEnabled: data.data.features?.wallet_enabled ?? defaultConfig.features.walletEnabled,
              },
              isLoading: false,
            });
            return;
          }
        }
      } catch (error) {
        console.warn("Failed to fetch config from API, using defaults:", error);
      }
      // Fallback to env defaults
      setConfig({ ...defaultConfig, isLoading: false });
    };

    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={config}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  return useContext(ConfigContext);
}

export function useAppName() {
  const config = useConfig();
  return config.appName;
}

export function useWalletEnabled() {
  const config = useConfig();
  return config.features.walletEnabled;
}
