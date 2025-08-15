/**
 * Complete Integration Example: RoSaBank + PayFlow
 * 
 * This file demonstrates how to integrate RoSaBank with the PayFlow system
 * for production-ready ROSCA financial operations.
 */

import { createEnhancedWalletService } from './enhanced-wallet-service';
import type { 
  ContributionRequest, 
  PayoutRequest, 
  ROSCAGroupWallet,
  ROSCATransaction 
} from './enhanced-wallet-service';

// Example: Setting up the enhanced wallet service
const walletService = createEnhancedWalletService({
  payflowBaseUrl: 'http://localhost:7000', // Your PayFlow service URL
  payflowApiKey: 'your-api-key-here',      // API key from PayFlow
  defaultCurrency: 'USD',
  enableRealPayments: false, // Set to true for production Stripe payments
});

/**
 * Example 1: Creating a ROSCA Group with PayFlow Integration
 */
export async function createROSCAGroupExample(): Promise<void> {
  console.log('=== Creating ROSCA Group with PayFlow Integration ===');

  try {
    // Step 1: Create group wallet in PayFlow
    const groupWallet = await walletService.createGroupWallet(
      'rosca-group-001',           // Group ID from RoSaBank
      'Friends Savings Circle',     // Group name
      'USD',                       // Currency
      'user-123'                   // Creator user ID
    );

    console.log('✅ Group wallet created:', {
      walletId: groupWallet.id,
      groupName: groupWallet.groupName,
      balance: groupWallet.balance,
      currency: groupWallet.currency,
    });

    // Step 2: Create member wallets
    const members = [
      { id: 'user-123', name: 'Alice Johnson' },
      { id: 'user-456', name: 'Bob Smith' },
      { id: 'user-789', name: 'Carol Davis' },
      { id: 'user-101', name: 'David Wilson' },
    ];

    const memberWallets = [];
    for (const member of members) {
      const wallet = await walletService.createMemberWallet(
        member.id,
        member.name,
        'USD'
      );
      memberWallets.push({ ...member, walletId: wallet.id });
      console.log(`✅ Member wallet created for ${member.name}: ${wallet.id}`);
    }

    // Step 3: Store wallet IDs in your RoSaBank database
    // This would be your existing RoSaBank code to update the group and user records
    console.log('💾 Store wallet IDs in RoSaBank database:');
    console.log('- Update savingsGroups.walletId =', groupWallet.id);
    console.log('- Update users.personalWalletId for each member');

    return;
  } catch (error) {
    console.error('❌ Error creating ROSCA group:', error);
    throw error;
  }
}

/**
 * Example 2: Processing Monthly Contributions
 */
export async function processMonthlyContributionsExample(): Promise<void> {
  console.log('=== Processing Monthly ROSCA Contributions ===');

  try {
    const groupId = 'rosca-group-001';
    const groupWalletId = 'payflow-wallet-group-001';
    const contributionAmount = 100; // $100 per member
    const currentRound = 2;

    // Member contributions
    const contributions: ContributionRequest[] = [
      {
        groupId,
        memberId: 'user-123',
        memberWalletId: 'payflow-wallet-member-123',
        groupWalletId,
        amount: contributionAmount,
        round: currentRound,
        // paymentMethodId: 'pm_1234567890', // Stripe payment method for real payments
      },
      {
        groupId,
        memberId: 'user-456',
        memberWalletId: 'payflow-wallet-member-456',
        groupWalletId,
        amount: contributionAmount,
        round: currentRound,
      },
      {
        groupId,
        memberId: 'user-789',
        memberWalletId: 'payflow-wallet-member-789',
        groupWalletId,
        amount: contributionAmount,
        round: currentRound,
      },
      {
        groupId,
        memberId: 'user-101',
        memberWalletId: 'payflow-wallet-member-101',
        groupWalletId,
        amount: contributionAmount,
        round: currentRound,
      },
    ];

    // Process each contribution
    const results = [];
    for (const contribution of contributions) {
      try {
        const transaction = await walletService.processContribution(contribution);
        results.push({
          memberId: contribution.memberId,
          status: 'success',
          transactionId: transaction.id,
          amount: transaction.amount,
        });
        console.log(`✅ Contribution processed for member ${contribution.memberId}`);
      } catch (error) {
        results.push({
          memberId: contribution.memberId,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.log(`❌ Contribution failed for member ${contribution.memberId}:`, error);
      }
    }

    // Check final group balance
    const finalBalance = await walletService.getWalletBalance(groupWalletId);
    console.log('💰 Group wallet final balance:', finalBalance);

    console.log('📊 Contribution Results:', results);
    return;
  } catch (error) {
    console.error('❌ Error processing contributions:', error);
    throw error;
  }
}

/**
 * Example 3: Distributing Payout to Current Turn Member
 */
export async function distributePayoutExample(): Promise<void> {
  console.log('=== Distributing ROSCA Payout ===');

  try {
    const payoutRequest: PayoutRequest = {
      groupId: 'rosca-group-001',
      groupWalletId: 'payflow-wallet-group-001',
      memberWalletId: 'payflow-wallet-member-456', // Bob's turn
      memberId: 'user-456',
      memberName: 'Bob Smith',
      amount: 400, // $100 x 4 members
      round: 2,
    };

    // Distribute payout
    const transaction = await walletService.distributePayout(payoutRequest);

    console.log('✅ Payout distributed:', {
      recipient: payoutRequest.memberName,
      amount: transaction.amount,
      transactionId: transaction.id,
      status: transaction.status,
    });

    // Verify member wallet balance
    const memberBalance = await walletService.getWalletBalance(payoutRequest.memberWalletId);
    console.log('💰 Member wallet balance after payout:', memberBalance);

    return;
  } catch (error) {
    console.error('❌ Error distributing payout:', error);
    throw error;
  }
}

/**
 * Example 4: Getting Comprehensive Transaction History
 */
export async function getTransactionHistoryExample(): Promise<void> {
  console.log('=== Getting ROSCA Transaction History ===');

  try {
    const groupId = 'rosca-group-001';
    const groupWalletId = 'payflow-wallet-group-001';

    // Get group transaction history
    const groupTransactions = await walletService.getGroupTransactionHistory(
      groupWalletId,
      groupId,
      50
    );

    console.log('📊 Group Transaction History:');
    groupTransactions.forEach((tx) => {
      console.log(`- ${tx.transactionType} | $${tx.amount} | ${tx.description} | ${tx.status}`);
    });

    // Get member statistics
    const memberWalletId = 'payflow-wallet-member-123';
    const memberStats = await walletService.getMemberGroupStatistics(
      memberWalletId,
      groupId
    );

    console.log('📈 Member Statistics (Alice):', {
      totalContributions: memberStats.totalContributions,
      contributionCount: memberStats.contributionCount,
      totalPayouts: memberStats.totalPayouts,
      payoutCount: memberStats.payoutCount,
      netBalance: memberStats.netBalance,
    });

    return;
  } catch (error) {
    console.error('❌ Error getting transaction history:', error);
    throw error;
  }
}

/**
 * Example 5: Health Check and Service Validation
 */
export async function healthCheckExample(): Promise<void> {
  console.log('=== PayFlow Service Health Check ===');

  try {
    // Check if PayFlow service is available
    const isAvailable = await walletService.isServiceAvailable();
    console.log('🔍 PayFlow service available:', isAvailable);

    if (!isAvailable) {
      console.log('❌ PayFlow service is not responding');
      return;
    }

    // Validate wallet exists
    const walletId = 'payflow-wallet-group-001';
    const isValidWallet = await walletService.validateWallet(walletId);
    console.log(`🔍 Wallet ${walletId} is valid:`, isValidWallet);

    return;
  } catch (error) {
    console.error('❌ Error in health check:', error);
    throw error;
  }
}

/**
 * Example 6: Complete ROSCA Cycle Simulation
 */
export async function completeROSCACycleExample(): Promise<void> {
  console.log('=== Complete ROSCA Cycle Simulation ===');

  try {
    // This example simulates a complete 4-member ROSCA cycle
    const groupId = 'demo-rosca-cycle';
    const members = [
      { id: 'user-a', name: 'Alice', walletId: '', turnOrder: 1 },
      { id: 'user-b', name: 'Bob', walletId: '', turnOrder: 2 },
      { id: 'user-c', name: 'Carol', walletId: '', turnOrder: 3 },
      { id: 'user-d', name: 'David', walletId: '', turnOrder: 4 },
    ];

    // Step 1: Create group and member wallets
    console.log('🏗️ Creating wallets...');
    const groupWallet = await walletService.createGroupWallet(
      groupId,
      'Demo ROSCA Cycle',
      'USD',
      members[0].id
    );

    for (const member of members) {
      const wallet = await walletService.createMemberWallet(
        member.id,
        member.name,
        'USD'
      );
      member.walletId = wallet.id;

      // Add some initial funds for demo (in production, this would come from real payments)
      await walletService.depositToWallet(
        wallet.id,
        500, // $500 initial balance
        `Initial deposit for ${member.name}`
      );
    }

    // Step 2: Simulate 4 rounds (complete cycle)
    const contributionAmount = 100;
    
    for (let round = 1; round <= 4; round++) {
      console.log(`\n📅 Round ${round} - ${members[round - 1].name}'s turn:`);
      
      // Collect contributions from all members
      for (const member of members) {
        const transaction = await walletService.processContribution({
          groupId,
          memberId: member.id,
          memberWalletId: member.walletId,
          groupWalletId: groupWallet.id,
          amount: contributionAmount,
          round,
        });
        console.log(`  💰 ${member.name} contributed $${contributionAmount}`);
      }

      // Distribute payout to current turn member
      const currentTurnMember = members[round - 1];
      const totalPayout = contributionAmount * members.length;
      
      const payoutTransaction = await walletService.distributePayout({
        groupId,
        groupWalletId: groupWallet.id,
        memberWalletId: currentTurnMember.walletId,
        memberId: currentTurnMember.id,
        memberName: currentTurnMember.name,
        amount: totalPayout,
        round,
      });
      
      console.log(`  🎉 ${currentTurnMember.name} received payout of $${totalPayout}`);
      
      // Show group balance (should be close to 0 after payout)
      const balance = await walletService.getWalletBalance(groupWallet.id);
      console.log(`  📊 Group balance: $${balance.balance}`);
    }

    // Step 3: Final statistics
    console.log('\n📈 Final ROSCA Cycle Statistics:');
    for (const member of members) {
      const stats = await walletService.getMemberGroupStatistics(
        member.walletId,
        groupId
      );
      console.log(`  ${member.name}: Paid $${stats.totalContributions}, Received $${stats.totalPayouts}, Net: $${stats.netBalance}`);
    }

    console.log('✅ Complete ROSCA cycle simulation finished!');
    return;
  } catch (error) {
    console.error('❌ Error in ROSCA cycle simulation:', error);
    throw error;
  }
}

/**
 * Run all examples
 */
export async function runAllExamples(): Promise<void> {
  console.log('🚀 Running RoSaBank + PayFlow Integration Examples\n');

  try {
    await healthCheckExample();
    await createROSCAGroupExample();
    await processMonthlyContributionsExample();
    await distributePayoutExample();
    await getTransactionHistoryExample();
    await completeROSCACycleExample();
    
    console.log('\n🎉 All examples completed successfully!');
  } catch (error) {
    console.error('\n💥 Example execution failed:', error);
  }
}

// Uncomment to run examples
// runAllExamples();