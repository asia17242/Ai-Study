import 'package:equatable/equatable.dart';

class Transaction extends Equatable {
  final String? id;
  final double amount;
  final String category;
  final String description;
  final DateTime date;
  final TransactionType type;

  const Transaction({
    this.id,
    required this.amount,
    required this.category,
    required this.description,
    required this.date,
    this.type = TransactionType.expense,
  });

  @override
  List<Object?> get props => [id, amount, category, description, date, type];
}

enum TransactionType { income, expense }
