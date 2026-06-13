import 'package:dartz/dartz.dart';
import 'transaction.dart';

abstract class TransactionRepository {
  Future<Either<String, List<Transaction>>> getTransactions();
  Future<Either<String, Transaction>> getTransactionById(String id);
  Future<Either<String, Transaction>> addTransaction(Transaction transaction);
  Future<Either<String, Transaction>> updateTransaction(Transaction transaction);
  Future<Either<String, void>> deleteTransaction(String id);
  Future<Either<String, List<Transaction>>> getTransactionsByMonth(int year, int month);
}
