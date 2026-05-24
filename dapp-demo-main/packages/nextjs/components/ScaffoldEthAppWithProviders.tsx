"use client";

import { useEffect, useState } from "react";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { useAccount, WagmiProvider } from "wagmi";
import { Footer } from "~~/components/Footer";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/scaffold-eth";
import { useInitializeNativeCurrencyPrice } from "~~/hooks/scaffold-eth";
import { wagmiConfig } from "~~/services/web3/wagmiConfig";

const BURNER_WALLET_PK_KEY = "burnerWallet.pk";
const CHAIRPERSON_PK = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const CHAIRPERSON_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const RELOAD_FLAG_KEY = "burnerChairpersonReloaded";

const ensureChairpersonBurner = () => {
  if (typeof window === "undefined") {
    return;
  }

  const currentLocalPk = window.localStorage.getItem(BURNER_WALLET_PK_KEY);
  const currentSessionPk = window.sessionStorage.getItem(BURNER_WALLET_PK_KEY);

  if (currentLocalPk !== CHAIRPERSON_PK || currentSessionPk !== CHAIRPERSON_PK) {
    window.localStorage.setItem(BURNER_WALLET_PK_KEY, CHAIRPERSON_PK);
    window.sessionStorage.setItem(BURNER_WALLET_PK_KEY, CHAIRPERSON_PK);
  }
};

const ScaffoldEthApp = ({ children }: { children: React.ReactNode }) => {
  useInitializeNativeCurrencyPrice();

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="relative flex flex-col flex-1">{children}</main>
        <Footer />
      </div>
      <Toaster />
    </>
  );
};

const ChairpersonBootstrap = () => {
  const { address } = useAccount();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (address && address.toLowerCase() !== CHAIRPERSON_ADDRESS.toLowerCase()) {
      if (!window.sessionStorage.getItem(RELOAD_FLAG_KEY)) {
        window.sessionStorage.setItem(RELOAD_FLAG_KEY, "1");
        window.location.reload();
      }
    }
  }, [address]);

  return null;
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

export const ScaffoldEthAppWithProviders = ({ children }: { children: React.ReactNode }) => {
  ensureChairpersonBurner();

  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ProgressBar height="3px" color="#2299dd" />
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={mounted ? (isDarkMode ? darkTheme() : lightTheme()) : lightTheme()}
        >
          <ChairpersonBootstrap />
          <ScaffoldEthApp>{children}</ScaffoldEthApp>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};
