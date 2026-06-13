import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:responsive_framework/responsive_framework.dart';
import '../../../../core/di/injection.dart';
import '../bloc/transaction_bloc.dart';
import '../widgets/voice_dialog.dart';

class MockTransaction {
  final String category;
  final String description;
  final double amount;
  final String date;
  final IconData icon;
  final Color color;

  const MockTransaction({
    required this.category,
    required this.description,
    required this.amount,
    required this.date,
    required this.icon,
    required this.color,
  });
}

const List<MockTransaction> mockTransactions = [
  MockTransaction(
    category: '餐飲食品',
    description: '美味午餐便當',
    amount: 120.0,
    date: '今日 12:30',
    icon: Icons.fastfood,
    color: Colors.orange,
  ),
  MockTransaction(
    category: '交通出行',
    description: '搭乘捷運上班',
    amount: 35.0,
    date: '今日 08:15',
    icon: Icons.directions_subway,
    color: Colors.blue,
  ),
];

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<TransactionBloc>()..add(LoadTransactions()),
      child: Builder(
        builder: (context) {
          final double screenWidth = MediaQuery.sizeOf(context).width;
          final bool isMobile = screenWidth < 600;

          return Scaffold(
            appBar: AppBar(
              title: const Text('Voice Finance'),
              elevation: 0,
              backgroundColor: Theme.of(context).colorScheme.inversePrimary,
            ),
            body: isMobile
                ? const MobileLayout()
                : const DesktopLayout(),
            floatingActionButton: isMobile
                ? FloatingActionButton.large(
                    onPressed: () async {
                      final recognizedText = await showDialog<String>(
                        context: context,
                        builder: (context) => const VoiceDialog(),
                      );

                      if (recognizedText != null && recognizedText.trim().isNotEmpty && context.mounted) {
                        context.read<TransactionBloc>().add(
                          ParseVoiceTransactionEvent(recognizedText),
                        );
                      }
                    },
                    backgroundColor: const Color(0xFF0072FF),
                    foregroundColor: Colors.white,
                    shape: const CircleBorder(),
                    child: const Icon(Icons.mic, size: 36),
                  )
                : null,
          );
        },
      ),
    );
  }
}

// Mobile layout view (< 600px)
class MobileLayout extends StatelessWidget {
  const MobileLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(left: 4.0, bottom: 12.0),
            child: Text(
              '今日記帳明細列表',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: mockTransactions.length,
              itemBuilder: (context, index) {
                final tx = mockTransactions[index];
                return TransactionItemCard(tx: tx);
              },
            ),
          ),
        ],
      ),
    );
  }
}

// Desktop / Tablet layout view (>= 600px)
class DesktopLayout extends StatelessWidget {
  const DesktopLayout({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left Column (60% Width)
          Expanded(
            flex: 6,
            child: Card(
              elevation: 2,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '記帳明細列表與歷史紀錄',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.builder(
                        itemCount: mockTransactions.length,
                        itemBuilder: (context, index) {
                          final tx = mockTransactions[index];
                          return TransactionItemCard(tx: tx);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 24),
          // Right Column (40% Width)
          Expanded(
            flex: 4,
            child: Column(
              children: [
                // Top Right: Chart Placeholder Card
                Expanded(
                  flex: 5,
                  child: Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '支出統計分析',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 12),
                          const Divider(),
                          Expanded(
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    Icons.pie_chart,
                                    size: 80,
                                    color: Theme.of(context).colorScheme.primary.withOpacity(0.6),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    '統計圖表佔位區',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                      color: Colors.grey,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                // Bottom Right: Voice Control Panel
                Expanded(
                  flex: 5,
                  child: Card(
                    elevation: 2,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: LinearGradient(
                          colors: [
                            Theme.of(context).colorScheme.primary.withOpacity(0.05),
                            Theme.of(context).colorScheme.secondary.withOpacity(0.05),
                          ],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(20.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              '智能語音輸入控制面板',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            const Divider(),
                            Expanded(
                              child: Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      decoration: const BoxDecoration(
                                        shape: BoxShape.circle,
                                        gradient: LinearGradient(
                                          colors: [Color(0xFF00F0FF), Color(0xFF0072FF)],
                                        ),
                                      ),
                                      child: IconButton(
                                        iconSize: 56,
                                        icon: const Icon(
                                          Icons.mic,
                                          color: Colors.white,
                                        ),
                                        onPressed: () async {
                                          final recognizedText = await showDialog<String>(
                                            context: context,
                                            builder: (context) => const VoiceDialog(),
                                          );

                                          if (recognizedText != null && recognizedText.trim().isNotEmpty && context.mounted) {
                                            context.read<TransactionBloc>().add(
                                              ParseVoiceTransactionEvent(recognizedText),
                                            );
                                          }
                                        },
                                      ),
                                    ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      '點擊麥克風按鈕開始錄音',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.blueGrey,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    const Text(
                                      '語音輸入狀態：準備就緒',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Shared List Item Card Component
class TransactionItemCard extends StatelessWidget {
  final MockTransaction tx;

  const TransactionItemCard({
    super.key,
    required this.tx,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: tx.color.withOpacity(0.15),
          child: Icon(
            tx.icon,
            color: tx.color,
          ),
        ),
        title: Text(
          tx.description,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          '${tx.category} • ${tx.date}',
          style: const TextStyle(
            fontSize: 13,
            color: Colors.grey,
          ),
        ),
        trailing: Text(
          '-\$${tx.amount.toStringAsFixed(0)}',
          style: const TextStyle(
            color: Colors.redAccent,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
