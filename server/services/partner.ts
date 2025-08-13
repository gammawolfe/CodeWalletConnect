import { generateApiKeyPair } from "../auth-api";
import type { InsertPartner } from "@shared/schema";
import { partnersRepository, apiKeysRepository, walletsRepository } from "../repositories";

export class PartnerService {
  async createPartner(partnerData: InsertPartner) {
    const partner = await partnersRepository.create(partnerData);
    const { secretKey: rawKey, keyHash } = generateApiKeyPair(partner.id, 'sandbox');
    await apiKeysRepository.create({
      partnerId: partner.id,
      keyHash,
      environment: 'sandbox',
      permissions: ['wallets:read', 'wallets:write', 'transactions:read', 'transactions:write']
    } as any);
    return { partner, sandboxApiKey: rawKey };
  }

  async getPartnerDashboard(partnerId: string) {
    const partner = await partnersRepository.getById(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    const [wallets, apiKeys] = await Promise.all([
      walletsRepository.listByPartnerId(partnerId),
      apiKeysRepository.listByPartner(partnerId)
    ]);

    // Calculate total balance across all wallets
    let totalBalance = '0.00';
    if (wallets.length > 0) {
      const balances = await Promise.all(
        wallets.map(w => '0.00')
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
    const partner = await partnersRepository.getById(partnerId);
    if (!partner) {
      throw new Error('Partner not found');
    }

    // Production keys require approved status
    if (environment === 'production' && partner.status !== 'approved') {
      throw new Error('Partner must be approved for production API keys');
    }

    const { secretKey: rawKey, keyHash } = generateApiKeyPair(partnerId, environment);

    const apiKey = await apiKeysRepository.create({
      partnerId,
      keyHash,
      environment,
      permissions: permissions || ['wallets:read', 'transactions:read']
    } as any);

    return {
      apiKey: {
        ...apiKey,
        keyHash: undefined // Never expose hash
      },
      rawKey // Only return once during creation
    };
  }

  async revokeApiKey(partnerId: string, apiKeyId: string) {
    const apiKeys = await apiKeysRepository.listByPartner(partnerId);
    const apiKey = apiKeys.find(k => k.id === apiKeyId);
    
    if (!apiKey) {
      throw new Error('API key not found or does not belong to partner');
    }

    await apiKeysRepository.deactivate(apiKeyId);
    return { success: true };
  }

  async updatePartnerStatus(partnerId: string, status: string, reviewNotes?: string) {
    const partner = await partnersRepository.updateStatus(partnerId, status);
    
    // If approved, can generate production keys
    // If rejected, deactivate all production keys
    if (status === 'rejected') {
      const apiKeys = await apiKeysRepository.listByPartner(partnerId);
      const productionKeys = apiKeys.filter(k => k.environment === 'production');
      
      await Promise.all(
        productionKeys.map(k => apiKeysRepository.deactivate(k.id))
      );
    }

    return partner;
  }
}

export const partnerService = new PartnerService();