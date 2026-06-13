part of 'transaction_bloc.dart';

abstract class TransactionEvent extends Equatable {
  const TransactionEvent();

  @override
  List<Object?> get props => [];
}

class LoadTransactions extends TransactionEvent {}

class AddTransactionEvent extends TransactionEvent {
  final Transaction transaction;

  const AddTransactionEvent(this.transaction);

  @override
  List<Object?> get props => [transaction];
}

class ParseVoiceTransactionEvent extends TransactionEvent {
  final String text;

  const ParseVoiceTransactionEvent(this.text);

  @override
  List<Object?> get props => [text];
}
