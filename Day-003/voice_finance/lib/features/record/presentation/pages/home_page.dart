import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../../core/di/injection.dart';
import '../bloc/transaction_bloc.dart';
import '../widgets/transaction_list.dart';
import '../widgets/voice_input_button.dart';
import 'analysis_page.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocProvider(
      create: (_) => sl<TransactionBloc>()..add(LoadTransactions()),
      child: Builder(
        builder: (context) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Voice Finance'),
              actions: [
                IconButton(
                  icon: const Icon(Icons.bar_chart),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => BlocProvider.value(
                          value: context.read<TransactionBloc>(),
                          child: const AnalysisPage(),
                        ),
                      ),
                    );
                  },
                ),
              ],
            ),
            body: const TransactionList(),
            floatingActionButton: const VoiceInputButton(),
          );
        }
      ),
    );
  }
}
