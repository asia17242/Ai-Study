import 'package:equatable/equatable.dart';

class Transaction extends Equatable {
  final String? id;
  final double amount;
  final String category;
  final String description;
  final DateTime date;
  final TransactionType type;
  final String? merchant;
  final String? paymentMethod;
  final List<String> tags;
  final String? rawText;
  final String? subCategory;
  final List<String> items;

  const Transaction({
    this.id,
    required this.amount,
    required this.category,
    required this.description,
    required this.date,
    this.type = TransactionType.expense,
    this.merchant,
    this.paymentMethod,
    this.tags = const [],
    this.rawText,
    this.subCategory,
    this.items = const [],
  });

  @override
  List<Object?> get props => [
        id,
        amount,
        category,
        description,
        date,
        type,
        merchant,
        paymentMethod,
        tags,
        rawText,
        subCategory,
        items,
      ];
}

enum TransactionType { income, expense }
