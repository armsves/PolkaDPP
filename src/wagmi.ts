import { getDefaultConfig, Chain } from '@rainbow-me/rainbowkit';
import {
  sepolia,
} from 'wagmi/chains';

const westend = {
  id: 420420421,
  name: 'Westend Asset Hub',
  iconUrl: 'https://blockscout-asset-hub.parity-chains-scw.parity.io/assets/favicon/favicon-32x32.png',
  iconBackground: '#fff',
  nativeCurrency: { name: 'Westend', symbol: 'WND', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://westend-asset-hub-eth-rpc.polkadot.io'] },
  },
  blockExplorers: {
    default: { name: 'Westend Explorer', url: 'https://westend.subscan.io/' },
  },
} as const satisfies Chain;

export const config = getDefaultConfig({
  appName: 'PolkaDPP',
  projectId: 'POLKADPP',
  chains: [
    westend,
    ...(process.env.NEXT_PUBLIC_ENABLE_TESTNETS === 'true' ? [sepolia] : []),
  ],
  ssr: true,
});