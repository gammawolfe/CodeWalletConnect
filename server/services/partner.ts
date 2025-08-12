import { storage } from "../storage";
import { generateApiKeyPair } from "../auth-api";
import type { InsertPartner, InsertApiKey } from "@shared/schema";

export class PartnerService {
  async createPartner(partnerData: InsertPartner) {
    // Create partner
    const partner = await storage.createPartner(partnerData);

    // Generate initial sandbox API key
    const { secretKey: rawKey, keyHash } = generateApiKeyPair(partner.id, 'sandbox');
    
    await storage.createApiKey({
      partnerId: partner.id,
      keyHash,
      environment: 'sandbox',
      permissions: ['wallets:read', 'wallets:write', 'transactions:read', 'transactions:write']
    });

    return {
      partner,
      sandboxApiKey: rawKey // Only return once during creation
    };
  }

  async getPartnerDashboard(partnerId: string) {
    const partner = await storage.getPartner(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    const [wallets, apiKeys] = await Promise.all([
      storage.getWalletsByPartnerId(partnerId),
      storage.getApiKeysByPartnerId(partnerId)
    ]);

    // Calculate total balance across all wallets
    let totalBalance = '0.00';
    if (wallets.length > 0) {
      const balances = await Promise.all(
        wallets.map(w => storage.getWalletBalance(w.id))
      );
      totalBalance = balances.reduce((sum, balance) => 
        (parseFloat(sum) + parseFloat(balance)).toFixed(2), '0.00'
      );
    }

    return {
      partner,
      stats: {
        totalWallets: wallets.length,
        totalBalance,
        activeApiKeys: apiKeys.filter(k => k.isActive).length
      },
      wallets: wallets.slice(0, 5), // Recent wallets
      apiKeys: apiKeys.map(k => ({
        ...k,
        keyHash: undefined, // Never expose hashes
        keyPreview: `${k.environment}_...${k.id.slice(-4)}`
      }))
    };
  }

  async generateApiKey(partnerId: string, environment: 'sandbox' | 'production', permissions?: string[]) {
    const partner = await storage.getPartner(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Production keys require approved status
    if (environment === 'production' && partner.status !== 'approved') {
      throw new Error('Partner must be approved for production API keys');
    }

    const { secretKey: rawKey, keyHash } = generateApiKeyPair(partnerId, environment);

    const apiKey = await storage.createApiKey({
      partnerId,
      keyHash,
      environment,
      permissions: permissions || ['wallets:read', 'transactions:read']
    });

    return {
      apiKey: {
        ...apiKey,
        keyHash: undefined // Never expose hash
      },
      rawKey // Only return once during creation
    };
  }

  async revokeApiKey(partnerId: string, apiKeyId: string) {
    const apiKeys = await storage.getApiKeysByPartnerId(partnerId);
    const apiKey = apiKeys.find(k => k.id === apiKeyId);
    
    if (!apiKey) {
      throw new Error('API key not found or does not belong to partner');
    }

    await storage.deactivateApiKey(apiKeyId);
    return { success: true };
  }

  async updatePartnerStatus(partnerId: string, status: string, reviewNotes?: string) {
    const partner = await storage.updatePartnerStatus(partnerId, status);
    
    // If approved, can generate production keys
    // If rejected, deactivate all production keys
    if (status === 'rejected') {
      const apiKeys = await storage.getApiKeysByPartnerId(partnerId);
      const productionKeys = apiKeys.filter(k => k.environment === 'production');
      
      await Promise.all(
        productionKeys.map(k => storage.deactivateApiKey(k.id))
      );
    }

    return partner;
  }
}

export const partnerService = new PartnerService();