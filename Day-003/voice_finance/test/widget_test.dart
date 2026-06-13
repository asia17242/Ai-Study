import 'package:flutter_test/flutter_test.dart';

import 'package:voice_finance/main.dart';

void main() {
  testWidgets('App renders home page', (WidgetTester tester) async {
    await tester.pumpWidget(const VoiceFinanceApp());
    expect(find.text('Voice Finance'), findsOneWidget);
  });
}
