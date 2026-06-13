import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';

class ApiService {
  final http.Client client;

  ApiService({http.Client? client}) : this.client = client ?? http.Client();

  Future<Map<String, dynamic>> parseVoice(String text) async {
    final url = Uri.parse('${AppConstants.baseUrl}/api/parse');
    
    try {
      final response = await client.post(
        url,
        headers: {'Content-Type': 'application/json; charset=UTF-8'},
        body: jsonEncode({'text': text}),
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
