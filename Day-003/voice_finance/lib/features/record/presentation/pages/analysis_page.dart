import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/transaction_bloc.dart';
import '../../domain/transaction.dart';
import '../widgets/expense_chart.dart';

class AnalysisPage extends StatelessWidget {
  const AnalysisPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('分析與報表')),
      body: BlocBuilder<TransactionBloc, TransactionState>(
        builder: (context, state) {
          if (state is TransactionLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (state is TransactionsLoaded) {
            final transactions = state.transactions;
            final categoryTotals = <String, double>{};
            
            for (var t in transactions) {
              if (t.type == TransactionType.expense) {
                categoryTotals[t.category] = 
                    (categoryTotals[t.category] ?? 0.0) + t.amount;
              }
            }

            if (categoryTotals.isEmpty) {
              return const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.pie_chart_outline, size: 64, color: Colors.grey),
                    SizedBox(height: 16),
                    Text('尚未有支出資料進行分析'),
                  ],
                ),
              );
            }

            return Padding(
              padding: const EdgeInsets.all(16),
              child: ListView(
                children: [
                  ExpenseChart(categoryTotals: categoryTotals),
                  const SizedBox(height: 24),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '支出明細明細',
                            style: Theme.of(context).textTheme.titleMedium,
                          ),
                          const Divider(),
                          ...categoryTotals.entries.map((entry) {
                            return ListTile(
                              title: Text(entry.key),
                              trailing: Text(
                                '\$${entry.value.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                            );
                          }).toList(),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            );
          }

          if (state is TransactionError) {
            return Center(child: Text('錯誤: ${state.message}'));
          }

          return const SizedBox.shrink();
        },
      ),
    );
  }
}
