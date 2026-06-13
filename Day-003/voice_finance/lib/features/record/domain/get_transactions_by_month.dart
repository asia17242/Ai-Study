import 'package:dartz/dartz.dart';
import 'transaction.dart';
import 'transaction_repository.dart';

class GetTransactionsByMonth {
  final TransactionRepository repository;

  GetTransactionsByMonth(this.repository);

  Future<Either<String, List<Transaction>>> call(int year, int month) {
    return repository.getTransactionsByMonth(year, month);
  }
}
