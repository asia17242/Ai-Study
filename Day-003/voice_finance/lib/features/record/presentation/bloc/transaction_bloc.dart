import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:equatable/equatable.dart';
import '../../../../core/services/api_service.dart';
import '../../domain/transaction.dart';
import '../../domain/add_transaction.dart';
import '../../domain/get_transactions.dart';

part 'transaction_event.dart';
part 'transaction_state.dart';

class TransactionBloc extends Bloc<TransactionEvent, TransactionState> {
  final GetTransactions getTransactions;
  final AddTransaction addTransaction;
  final ApiService apiService;

  TransactionBloc({
    required this.getTransactions,
    required this.addTransaction,
    required this.apiService,
  }) : super(TransactionInitial()) {
    on<LoadTransactions>(_onLoadTransactions);
    on<AddTransactionEvent>(_onAddTransaction);
    on<ParseVoiceTransactionEvent>(_onParseVoiceTransaction);
  }

  Future<void> _onLoadTransactions(
    LoadTransactions event,
    Emitter<TransactionState> emit,
  ) async {
    emit(TransactionLoading());
    final result = await getTransactions();
    result.fold(
      (error) => emit(TransactionError(error)),
      (transactions) => emit(TransactionsLoaded(transactions)),
    );
  }

  Future<void> _onAddTransaction(
    AddTransactionEvent event,
    Emitter<TransactionState> emit,
  ) async {
    final currentState = state;
    if (currentState is TransactionsLoaded) {
      emit(TransactionLoading());
      final result = await addTransaction(event.transaction);
      await result.fold(
        (error) async => emit(TransactionError(error)),
        (_) async {
          final loadResult = await getTransactions();
          loadResult.fold(
            (error) => emit(TransactionError(error)),
            (transactions) => emit(TransactionsLoaded(transactions)),
          );
        },
      );
    }
  }

  Future<void> _onParseVoiceTransaction(
    ParseVoiceTransactionEvent event,
    Emitter<TransactionState> emit,
  ) async {
    emit(TransactionLoading());
    try {
      final result = await apiService.parseVoice(event.text);
      final transaction = Transaction(
        amount: (result['amount'] as num).toDouble(),
        category: result['category'] as String? ?? '其他',
        description: result['description'] as String? ?? event.text,
        date: DateTime.now(),
        type: result['type'] == 'income' ? TransactionType.income : TransactionType.expense,
      );

      final saveResult = await addTransaction(transaction);
      await saveResult.fold(
        (error) async => emit(TransactionError(error)),
        (_) async {
          final loadResult = await getTransactions();
          loadResult.fold(
            (error) => emit(TransactionError(error)),
            (transactions) => emit(TransactionsLoaded(transactions)),
          );
        },
      );
    } catch (e) {
      emit(TransactionError(e.toString()));
    }
  }
}
