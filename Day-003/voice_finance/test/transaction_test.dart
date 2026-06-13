import 'package:flutter_test/flutter_test.dart';
import 'package:voice_finance/features/record/domain/transaction.dart';

void main() {
  group('Transaction Entity', () {
    test('should create a transaction with given values', () {
      final transaction = Transaction(
        amount: 120.0,
        category: '餐飲',
        description: '午餐',
        date: DateTime(2024, 1, 15),
      );

      expect(transaction.amount, 120.0);
      expect(transaction.category, '餐飲');
      expect(transaction.description, '午餐');
      expect(transaction.date, DateTime(2024, 1, 15));
      expect(transaction.type, TransactionType.expense);
    });
  });
}
