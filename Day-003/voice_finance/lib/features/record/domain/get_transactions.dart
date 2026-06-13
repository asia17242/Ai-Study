import 'package:dartz/dartz.dart';
import 'transaction.dart';
import 'transaction_repository.dart';

class GetTransactions {
  final TransactionRepository repository;

  GetTransactions(this.repository);

  Future<Either<String, List<Transaction>>> call() {
    return repository.getTransactions();
  }
}
