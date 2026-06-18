import 'package:intl/intl.dart';

class AppDateUtils {
  static String format(DateTime date, {String pattern = 'yyyy/MM/dd'}) {
    return DateFormat(pattern).format(date);
  }

  static String formatMonth(DateTime date) {
    return DateFormat('yyyy/MM').format(date);
  }

  static String formatTime(DateTime date) {
    return DateFormat('HH:mm').format(date);
  }

  static DateTime get startOfMonth {
    final now = DateTime.now();
    return DateTime(now.year, now.month, 1);
  }

  static DateTime get endOfMonth {
    final now = DateTime.now();
    return DateTime(now.year, now.month + 1, 0);
  }
}
