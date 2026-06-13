import 'dart:convert';
import 'package:hive/hive.dart';
import 'transaction_model.dart';

class TransactionLocalDataSource {
  static const _boxName = 'transactions';
  late Box<String> _box;

  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);
  }

  Future<List<TransactionModel>> getTransactions() async {
    final values = _box.values;
    return values
        .map((json) => TransactionModel.fromJson(jsonDecode(json)))
        .toList();
  }

  Future<TransactionModel?> getTransactionById(String id) async {
    final json = _box.get(id);
    if (json == null) return null;
    return TransactionModel.fromJson(jsonDecode(json));
  }

  Future<void> addTransaction(TransactionModel transaction) async {
    final id = transaction.id ?? DateTime.now().millisecondsSinceEpoch.toString();
    await _box.put(id, jsonEncode(transaction.toJson()..['id'] = id));
  }

  Future<void> updateTransaction(TransactionModel transaction) async {
    if (transaction.id != null) {
      await _box.put(transaction.id!, jsonEncode(transaction.toJson()));
    }
  }

  Future<void> deleteTransaction(String id) async {
    await _box.delete(id);
  }
}
