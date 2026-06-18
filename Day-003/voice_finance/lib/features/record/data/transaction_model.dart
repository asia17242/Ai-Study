import '../domain/transaction.dart';

class TransactionModel extends Transaction {
  const TransactionModel({
    super.id,
    required super.amount,
    required super.category,
    required super.description,
    required super.date,
    super.type,
    super.merchant,
    super.paymentMethod,
    super.tags,
    super.rawText,
    super.subCategory,
    super.items,
  });

  factory TransactionModel.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    try {
      parsedDate = DateTime.parse(json['date'] as String);
    } catch (_) {
      parsedDate = DateTime.now();
    }
    return TransactionModel(
      id: json['id'] as String?,
      amount: (json['amount'] as num).toDouble(),
      category: json['category'] as String,
      description: json['description'] as String,
      date: parsedDate,
      type: json['type'] == 'income'
          ? TransactionType.income
          : TransactionType.expense,
      merchant: json['merchant'] as String?,
      paymentMethod: json['payment_method'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.cast<String>() ?? const [],
      rawText: json['raw_text'] as String?,
      subCategory: json['sub_category'] as String?,
      items: (json['items'] as List<dynamic>?)?.cast<String>() ?? const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'amount': amount,
      'category': category,
      'description': description,
      'date': date.toIso8601String(),
      'type': type == TransactionType.income ? 'income' : 'expense',
      if (merchant != null) 'merchant': merchant,
      if (paymentMethod != null) 'payment_method': paymentMethod,
      if (tags.isNotEmpty) 'tags': tags,
      if (rawText != null) 'raw_text': rawText,
      if (subCategory != null) 'sub_category': subCategory,
      if (items.isNotEmpty) 'items': items,
    };
  }

  factory TransactionModel.fromEntity(Transaction transaction) {
    return TransactionModel(
      id: transaction.id,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
      type: transaction.type,
      merchant: transaction.merchant,
      paymentMethod: transaction.paymentMethod,
      tags: transaction.tags,
      rawText: transaction.rawText,
      subCategory: transaction.subCategory,
      items: transaction.items,
    );
  }
}
