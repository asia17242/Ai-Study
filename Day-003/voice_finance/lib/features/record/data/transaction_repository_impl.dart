import 'package:dartz/dartz.dart';
import '../domain/transaction.dart';
import '../domain/transaction_repository.dart';
import 'transaction_local_datasource.dart';
import 'transaction_model.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  final TransactionLocalDataSource localDataSource;

  TransactionRepositoryImpl(this.localDataSource);

  @override
  Future<Either<String, List<Transaction>>> getTransactions() async {
    try {
      final models = await localDataSource.getTransactions();
      return Right(models);
    } catch (e) {
      return Left('Failed to load transactions: $e');
    }
  }

  @override
  Future<Either<String, Transaction>> getTransactionById(String id) async {
    try {
      final model = await localDataSource.getTransactionById(id);
      if (model == null) return Left('Transaction not found');
      return Right(model);
    } catch (e) {
      return Left('Failed to load transaction: $e');
    }
  }

  @override
  Future<Either<String, Transaction>> addTransaction(Transaction transaction) async {
    try {
      final model = TransactionModel.fromEntity(transaction);
      await localDataSource.addTransaction(model);
      return Right(model);
    } catch (e) {
      return Left('Failed to add transaction: $e');
    }
  }

  @override
  Future<Either<String, Transaction>> updateTransaction(Transaction transaction) async {
    try {
      final model = TransactionModel.fromEntity(transaction);
      await localDataSource.updateTransaction(model);
      return Right(model);
    } catch (e) {
      return Left('Failed to update transaction: $e');
    }
  }

  @override
  Future<Either<String, void>> deleteTransaction(String id) async {
    try {
      await localDataSource.deleteTransaction(id);
      return const Right(null);
    } catch (e) {
      return Left('Failed to delete transaction: $e');
    }
  }

  @override
  Future<Either<String, List<Transaction>>> getTransactionsByMonth(int year, int month) async {
    try {
      final all = await localDataSource.getTransactions();
      final filtered = all.where((t) {
        return t.date.year == year && t.date.month == month;
      }).toList();
      return Right(filtered);
    } catch (e) {
      return Left('Failed to load transactions: $e');
    }
  }
}
