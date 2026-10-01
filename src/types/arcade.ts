export interface DogeCoreConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  priceDoge: number;
  minConfirmations: number;
  network: 'mainnet' | 'testnet' | 'regtest';
}

export interface NodeStatus {
  connected: boolean;
  version?: number;
  subversion?: string;
  protocolversion?: number;
  blocks?: number;
  headers?: number;
  difficulty?: number;
  connections?: number;
  balance?: number;
  network?: string;
  error?: string;
  lastChecked: number;
}

export interface ArcadeSession {
  id: string;
  address: string;
  amountRequired: number;
  amountReceived: number;
  status: 'WAITING' | 'PAID' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  gameAssigned?: SwfGame;
  isSimulated?: boolean;
}

export interface SwfGame {
  id: string;
  title: string;
  filename: string;
  url: string;
  category: string;
  year: string;
  description: string;
  controls: string;
  isBuiltIn?: boolean;
}

export interface PaymentLog {
  id: string;
  timestamp: number;
  address: string;
  amount: number;
  txid?: string;
  gameTitle: string;
  status: 'CONFIRMED' | 'SIMULATED';
}
