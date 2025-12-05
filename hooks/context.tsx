import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

type OnboardingContextType = {
  hasOnboarded: boolean;
  isLoading: boolean;
  completeOnboarding: (hasOnboarded: boolean) => Promise<void>;
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const HAS_ONBOARDED_KEY = 'hasOnboarded';

  const [state, setState] = useState({ hasOnboarded: false, isLoading: true });

  useEffect(() => {
    AsyncStorage.getItem(HAS_ONBOARDED_KEY).then(value => {
      setState({ hasOnboarded: value === 'true', isLoading: false });
    });
  }, []);

  const completeOnboarding = async (hasOnboarded: boolean) => {
    await AsyncStorage.setItem(HAS_ONBOARDED_KEY, 'true');
    setState(prev => ({ ...prev, hasOnboarded }));
  };

  return (
    <OnboardingContext.Provider value={{ ...state, completeOnboarding }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) throw new Error('useOnboarding must be used within OnboardingProvider');
  return context;
}
