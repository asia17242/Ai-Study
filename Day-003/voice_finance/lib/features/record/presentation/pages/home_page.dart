import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:responsive_framework/responsive_framework.dart';
import '../../../../core/di/injection.dart';
import '../../domain/transaction.dart';
import '../bloc/transaction_bloc.dart';
import '../widgets/voice_dialog.dart';
import '../widgets/expense_chart.dart';

IconData _getCategoryIcon(String category) {
  switch (category) {
    case '餐飲':
    case '餐飲食品':
      return Icons.fastfood;
    case '交通':
    case '交通出行':
      return Icons.directions_subway;
    case '購物':
      return Icons.shopping_bag;
    case '娛樂':
      return Icons.sports_esports;
    case '醫療':
      return Icons.local_hospital;
    case '教育':
      return Icons.school;
    case '居家':
      return Icons.home;
    case '薪資':
      return Icons.monetization_on;
    case '獎金':
      return Icons.card_membership;
    case '投資':
      return Icons.trending_up;
    default:
      return Icons.category;
  }
}

Color _getCategoryColor(String category) {
  switch (category) {
    case '餐飲':
    case '餐飲食品':
      return Colors.orange;
    case '交通':
    case '交通出行':
      return Colors.blue;
    case '購物':
      return Colors.green;
    case '娛樂':
      return Colors.purple;
    case '醫療':
      return Colors.red;
    case '教育':
      return Colors.indigo;
    case '居家':
      return Colors.teal;
    case '薪資':
      return Colors.green;
    case '獎金':
      return Colors.amber;
    case '投資':
      return Colors.blueAccent;
    default:
      return Colors.blueGrey;
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<TransactionBloc>()..add(LoadTransactions()),
      child: BlocListener<TransactionBloc, TransactionState>(
        listener: (context, state) {
          if (state is TransactionError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('錯誤: ${state.message}'),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
        },
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
      child: BlocBuilder<TransactionBloc, TransactionState>(
        builder: (context, state) {
          if (state is TransactionLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          if (state is TransactionsLoaded) {
            final list = state.transactions;

            // Calculate 收支
            double totalIncome = 0;
            double totalExpense = 0;
            final expenseList = list.where((tx) => tx.type == TransactionType.expense).toList();
            final incomeList = list.where((tx) => tx.type == TransactionType.income).toList();
            for (final tx in incomeList) {
              totalIncome += tx.amount;
            }
            for (final tx in expenseList) {
              totalExpense += tx.amount;
            }
            final balance = totalIncome - totalExpense;

            final totals = <String, double>{};
            for (final tx in expenseList) {
              totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
            }

            if (list.isEmpty) {
              return Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.receipt_long,
                      size: 64,
                      color: Colors.grey.withOpacity(0.5),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      '目前沒有記帳紀錄',
                      style: TextStyle(fontSize: 16, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      '點擊下方麥克風語音輸入記帳',
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                  ],
                ),
              );
            }

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildMobileDashboard(context, balance, totalIncome, totalExpense),
                const SizedBox(height: 12),
                if (expenseList.isNotEmpty) ...[
                  _ExpandableCategoryStats(totals: totals, totalExpense: totalExpense),
                  const SizedBox(height: 16),
                ],
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
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final tx = list[index];
                      return TransactionItemCard(tx: tx);
                    },
                  ),
                ),
              ],
            );
          }
          return const SizedBox.shrink();
        },
      ),
    );
  }

  Widget _buildMobileDashboard(BuildContext context, double balance, double totalIncome, double totalExpense) {
    final theme = Theme.of(context);
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withOpacity(0.06),
              theme.colorScheme.secondary.withOpacity(0.06),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '收支結餘',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Colors.blueGrey),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: balance >= 0 ? Colors.green.withOpacity(0.12) : Colors.red.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    balance >= 0 ? '盈餘' : '超支',
                    style: TextStyle(
                      fontSize: 12,
                      color: balance >= 0 ? Colors.green : Colors.red,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            Row(
              children: [
                Text(
                  '\$${balance.toStringAsFixed(0)}',
                  style: const TextStyle(fontSize: 30, fontWeight: FontWeight.bold),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(height: 1),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatItem('總收入', totalIncome, Colors.green, Icons.arrow_upward),
                _buildStatItem('總支出', totalExpense, Colors.redAccent, Icons.arrow_downward),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, double amount, Color color, IconData icon) {
    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: color.withOpacity(0.12),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            Text(
              '\$${amount.toStringAsFixed(0)}',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ],
    );
  }
}

class _ExpandableCategoryStats extends StatefulWidget {
  final Map<String, double> totals;
  final double totalExpense;

  const _ExpandableCategoryStats({
    required this.totals,
    required this.totalExpense,
  });

  @override
  State<_ExpandableCategoryStats> createState() => _ExpandableCategoryStatsState();
}

class _ExpandableCategoryStatsState extends State<_ExpandableCategoryStats> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final list = widget.totals.entries.toList();
    list.sort((a, b) => b.value.compareTo(a.value));

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          setState(() {
            _isExpanded = !_isExpanded;
          });
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.pie_chart, size: 20, color: Color(0xFF0072FF)),
                      SizedBox(width: 8),
                      Text(
                        '支出分類統計 (點擊展開)',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  Icon(
                    _isExpanded ? Icons.expand_less : Icons.expand_more,
                    color: Colors.grey,
                  ),
                ],
              ),
              if (_isExpanded) ...[
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                ...list.map((entry) {
                  final percentage = entry.value / widget.totalExpense;
                  final color = _getCategoryColor(entry.key);
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '${entry.key} (${(percentage * 100).toStringAsFixed(1)}%)',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                            ),
                            Text(
                              '\$${entry.value.toStringAsFixed(0)}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: percentage,
                            backgroundColor: Colors.grey[200],
                            color: color,
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ],
            ],
          ),
        ),
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
                child: BlocBuilder<TransactionBloc, TransactionState>(
                  builder: (context, state) {
                    if (state is TransactionLoading) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (state is TransactionsLoaded) {
                      final list = state.transactions;

                      // Calculate收支
                      double totalIncome = 0;
                      double totalExpense = 0;
                      final expenseList = list.where((tx) => tx.type == TransactionType.expense).toList();
                      final incomeList = list.where((tx) => tx.type == TransactionType.income).toList();
                      for (final tx in incomeList) {
                        totalIncome += tx.amount;
                      }
                      for (final tx in expenseList) {
                        totalExpense += tx.amount;
                      }
                      final balance = totalIncome - totalExpense;

                      return Column(
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
                          _buildDesktopDashboard(context, balance, totalIncome, totalExpense),
                          const SizedBox(height: 16),
                          Expanded(
                            child: list.isEmpty
                                ? Center(
                                    child: Column(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Icon(
                                          Icons.receipt_long,
                                          size: 64,
                                          color: Colors.grey.withOpacity(0.5),
                                        ),
                                        const SizedBox(height: 16),
                                        const Text(
                                          '目前沒有記帳紀錄',
                                          style: TextStyle(fontSize: 16, color: Colors.grey),
                                        ),
                                        const SizedBox(height: 4),
                                        const Text(
                                          '點擊右側麥克風語音輸入記帳',
                                          style: TextStyle(fontSize: 14, color: Colors.grey),
                                        ),
                                      ],
                                    ),
                                  )
                                : ListView.builder(
                                    itemCount: list.length,
                                    itemBuilder: (context, index) {
                                      final tx = list[index];
                                      return TransactionItemCard(tx: tx);
                                    },
                                  ),
                          ),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
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
                // Top Right: Chart or Placeholder Card
                Expanded(
                  flex: 5,
                  child: BlocBuilder<TransactionBloc, TransactionState>(
                    builder: (context, state) {
                      if (state is TransactionsLoaded) {
                        final list = state.transactions;
                        final expenseList = list.where((tx) => tx.type == TransactionType.expense).toList();
                        if (expenseList.isEmpty) {
                          return Card(
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
                                            color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                                          ),
                                          const SizedBox(height: 16),
                                          const Text(
                                            '無支出數據可供統計',
                                            style: TextStyle(
                                              fontSize: 15,
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
                          );
                        }
                        final totals = <String, double>{};
                        for (final tx in expenseList) {
                          totals[tx.category] = (totals[tx.category] ?? 0) + tx.amount;
                        }
                        return ExpenseChart(categoryTotals: totals);
                      }
                      return Card(
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
                                        color: Theme.of(context).colorScheme.primary.withOpacity(0.3),
                                      ),
                                      const SizedBox(height: 16),
                                      const Text(
                                        '載入中...',
                                        style: TextStyle(
                                          fontSize: 15,
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
                      );
                    },
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

  Widget _buildDesktopDashboard(BuildContext context, double balance, double totalIncome, double totalExpense) {
    final theme = Theme.of(context);
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            colors: [
              theme.colorScheme.primary.withOpacity(0.04),
              theme.colorScheme.secondary.withOpacity(0.04),
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('結餘', style: TextStyle(fontSize: 12, color: Colors.grey)),
                const SizedBox(height: 4),
                Text(
                  '\$${balance.toStringAsFixed(0)}',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                    color: balance >= 0 ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(width: 16),
            _buildStatItem('總收入', totalIncome, Colors.green, Icons.arrow_upward),
            const SizedBox(width: 16),
            _buildStatItem('總支出', totalExpense, Colors.redAccent, Icons.arrow_downward),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, double amount, Color color, IconData icon) {
    return Row(
      children: [
        CircleAvatar(
          radius: 16,
          backgroundColor: color.withOpacity(0.12),
          child: Icon(icon, size: 16, color: color),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
            Text(
              '\$${amount.toStringAsFixed(0)}',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: color),
            ),
          ],
        ),
      ],
    );
  }
}

// Shared List Item Card Component
class TransactionItemCard extends StatelessWidget {
  final Transaction tx;

  const TransactionItemCard({
    super.key,
    required this.tx,
  });

  @override
  Widget build(BuildContext context) {
    final color = _getCategoryColor(tx.category);
    final icon = _getCategoryIcon(tx.category);

    final now = DateTime.now();
    String dateStr;
    if (tx.date.year == now.year && tx.date.month == now.month && tx.date.day == now.day) {
      dateStr = '今日 ${tx.date.hour.toString().padLeft(2, '0')}:${tx.date.minute.toString().padLeft(2, '0')}';
    } else if (tx.date.year == now.year && tx.date.month == now.month && tx.date.day == now.day - 1) {
      dateStr = '昨日 ${tx.date.hour.toString().padLeft(2, '0')}:${tx.date.minute.toString().padLeft(2, '0')}';
    } else if (tx.date.year == now.year && tx.date.month == now.month && tx.date.day == now.day - 2) {
      dateStr = '前日 ${tx.date.hour.toString().padLeft(2, '0')}:${tx.date.minute.toString().padLeft(2, '0')}';
    } else {
      dateStr = '${tx.date.year}-${tx.date.month.toString().padLeft(2, '0')}-${tx.date.day.toString().padLeft(2, '0')}';
    }

    final isExpense = tx.type == TransactionType.expense;

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 8.0),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.15),
          child: Icon(
            icon,
            color: color,
          ),
        ),
        title: Text(
          tx.description,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
          ),
        ),
        subtitle: Text(
          '${tx.category} • $dateStr',
          style: const TextStyle(
            fontSize: 13,
            color: Colors.grey,
          ),
        ),
        trailing: Text(
          isExpense ? '-\$${tx.amount.toStringAsFixed(0)}' : '+\$${tx.amount.toStringAsFixed(0)}',
          style: TextStyle(
            color: isExpense ? Colors.redAccent : Colors.green,
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
