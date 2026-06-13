import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../bloc/transaction_bloc.dart';
import 'voice_dialog.dart';

class VoiceInputButton extends StatelessWidget {
  const VoiceInputButton({super.key});

  @override
  Widget build(BuildContext context) {
    return FloatingActionButton(
      onPressed: () async {
        final recognizedText = await showDialog<String>(
          context: context,
          builder: (context) => const VoiceDialog(),
        );

        if (recognizedText != null && recognizedText.trim().isNotEmpty && context.mounted) {
          context.read<TransactionBloc>().add(
            ParseVoiceTransactionEvent(recognizedText),
          );
        }
      },
      child: const Icon(Icons.mic),
    );
  }
}
