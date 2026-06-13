import 'package:dartz/dartz.dart';
import 'transaction.dart';
import 'transaction_repository.dart';

class AddTransaction {
  final TransactionRepository repository;

  AddTransaction(this.repository);

  Future<Either<String, Transaction>> call(Transaction transaction) {
    return repository.addTransaction(transaction);
  }
}
