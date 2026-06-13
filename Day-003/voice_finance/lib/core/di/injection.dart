import 'package:get_it/get_it.dart';
import '../services/api_service.dart';
import '../../features/record/data/transaction_local_datasource.dart';
import '../../features/record/data/transaction_repository_impl.dart';
import '../../features/record/domain/transaction_repository.dart';
import '../../features/record/domain/add_transaction.dart';
import '../../features/record/domain/get_transactions.dart';
import '../../features/record/presentation/bloc/transaction_bloc.dart';

final sl = GetIt.instance;

Future<void> initDependencies() async {
  final localDataSource = TransactionLocalDataSource();
  await localDataSource.init();

  // Services
  sl.registerLazySingleton<ApiService>(() => ApiService());

  // Repositories
  sl.registerLazySingleton<TransactionRepository>(
    () => TransactionRepositoryImpl(localDataSource),
  );

  // UseCases
  sl.registerLazySingleton(() => GetTransactions(sl<TransactionRepository>()));
  sl.registerLazySingleton(() => AddTransaction(sl<TransactionRepository>()));

  // BLoCs
  sl.registerFactory(
    () => TransactionBloc(
      getTransactions: sl<GetTransactions>(),
      addTransaction: sl<AddTransaction>(),
      apiService: sl<ApiService>(),
    ),
  );
}
