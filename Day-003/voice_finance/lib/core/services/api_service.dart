import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import '../utils/date_utils.dart';

class ApiService {
  final http.Client client;

  ApiService({http.Client? client}) : this.client = client ?? http.Client();

  String get _baseUrl => dotenv.env[AppConstants.apiBaseUrlKey] ?? AppConstants.baseUrl;

  Future<Map<String, dynamic>> parseVoice(String text) async {
    final url = Uri.parse('$_baseUrl/api/parse');
    final formattedDate = AppDateUtils.format(DateTime.now(), pattern: 'yyyy-MM-dd');

    try {
      final response = await client.post(
        url,
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({
          'text': text,
          'current_date': formattedDate,
        }),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(utf8.decode(response.bodyBytes));
        return decoded as Map<String, dynamic>;
      } else {
        throw Exception('Failed to parse voice transaction: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('API Server Error: $e');
    }
  }
}
