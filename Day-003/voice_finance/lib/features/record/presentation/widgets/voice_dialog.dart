import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;

class VoiceDialog extends StatefulWidget {
  const VoiceDialog({super.key});

  @override
  State<VoiceDialog> createState() => _VoiceDialogState();
}

class _VoiceDialogState extends State<VoiceDialog> with SingleTickerProviderStateMixin {
  late stt.SpeechToText _speech;
  late AnimationController _pulsateController;
  late Animation<double> _pulseAnimation;
  
  bool _isAvailable = false;
  bool _isListening = false;
  String _recognizedText = '';
  String _statusText = '正在初始化語音識別...';

  @override
  void initState() {
    super.initState();
    _speech = stt.SpeechToText();
    
    _pulsateController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.25).animate(
      CurvedAnimation(parent: _pulsateController, curve: Curves.easeInOut),
    );

    _initSpeech();
  }

  @override
  void dispose() {
    _speech.stop();
    _pulsateController.dispose();
    super.dispose();
  }

  Future<void> _initSpeech() async {
    try {
      final available = await _speech.initialize(
        onStatus: (status) {
          if (status == 'listening') {
            setState(() {
              _isListening = true;
              _statusText = '請開始說話，如：「今天午餐吃了一百二十元」';
            });
            _pulsateController.repeat(reverse: true);
          } else if (status == 'notListening' || status == 'done') {
            setState(() {
              _isListening = false;
              _statusText = '語音識別完成';
            });
            _pulsateController.stop();
            // If we have recognized text, wait a moment and return it
            if (_recognizedText.trim().isNotEmpty) {
              Future.delayed(const Duration(milliseconds: 800), () {
                if (mounted) Navigator.pop(context, _recognizedText);
              });
            }
          }
        },
        onError: (errorNotification) {
          setState(() {
            _isListening = false;
            _statusText = '錯誤: ${errorNotification.errorMsg}';
          });
          _pulsateController.stop();
        },
      );

      setState(() {
        _isAvailable = available;
        if (available) {
          _startListening();
        } else {
          _statusText = '本裝置不支援語音識別功能';
        }
      });
    } catch (e) {
      setState(() {
        _statusText = '語音初始化失敗: $e';
      });
    }
  }

  void _startListening() async {
    if (_isAvailable && !_isListening) {
      _recognizedText = '';
      await _speech.listen(
        onResult: (result) {
          setState(() {
            _recognizedText = result.recognizedWords;
          });
        },
        localeId: 'zh_TW', // Default to traditional Chinese
      );
    }
  }

  void _stopListening() async {
    if (_isListening) {
      await _speech.stop();
      setState(() {
        _isListening = false;
      });
      _pulsateController.stop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 24),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [const Color(0xFF1F1C2C), const Color(0xFF928DAB).withOpacity(0.9)]
                : [Colors.white, const Color(0xFFE0EAFC)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 20,
              spreadRadius: 5,
              offset: const Offset(0, 10),
            )
          ],
        ),
        padding: const EdgeInsets.all(28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle bar
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: (isDark ? Colors.white30 : Colors.black12),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 24),
            
            // Pulsing Mic Icon container
            AnimatedBuilder(
              animation: _pulseAnimation,
              builder: (context, child) {
                return Container(
                  height: 100,
                  width: 100,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      if (_isListening)
                        BoxShadow(
                          color: const Color(0xFF00F0FF).withOpacity(0.4),
                          blurRadius: 25 * _pulseAnimation.value,
                          spreadRadius: 8 * _pulseAnimation.value,
                        )
                    ],
                  ),
                  child: ScaleTransition(
                    scale: _isListening ? _pulseAnimation : const AlwaysStoppedAnimation(1.0),
                    child: Container(
                      height: 80,
                      width: 80,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [Color(0xFF00F0FF), Color(0xFF0072FF)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: IconButton(
                        icon: Icon(
                          _isListening ? Icons.mic : Icons.mic_none,
                          color: Colors.white,
                          size: 38,
                        ),
                        onPressed: () {
                          if (_isListening) {
                            _stopListening();
                          } else {
                            _startListening();
                          }
                        },
                      ),
                    ),
                  ),
                );
              },
            ),
            
            const SizedBox(height: 28),
            
            // Status Text (Actionable Hint)
            Text(
              _statusText,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
                color: isDark ? const Color(0xFF00F0FF) : const Color(0xFF0072FF),
              ),
            ),
            
            const SizedBox(height: 20),
            
            // Real-time Recognized Text Box
            Container(
              width: double.infinity,
              constraints: const BoxConstraints(
                minHeight: 100,
                maxHeight: 180,
              ),
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.06) : Colors.black.withOpacity(0.03),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? Colors.white12 : Colors.black12,
                ),
              ),
              child: SingleChildScrollView(
                child: Text(
                  _recognizedText.isEmpty ? '您說的話將顯示在這裡...' : _recognizedText,
                  style: TextStyle(
                    fontSize: 18,
                    height: 1.4,
                    color: _recognizedText.isEmpty 
                        ? (isDark ? Colors.white38 : Colors.black38) 
                        : (isDark ? Colors.white : Colors.black87),
                    fontWeight: _recognizedText.isEmpty ? FontWeight.normal : FontWeight.w600,
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Action Buttons
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                  },
                  child: Text(
                    '取消',
                    style: TextStyle(
                      color: isDark ? Colors.white60 : Colors.black54,
                      fontSize: 16,
                    ),
                  ),
                ),
                ElevatedButton(
                  onPressed: _recognizedText.trim().isNotEmpty
                      ? () => Navigator.pop(context, _recognizedText)
                      : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0072FF),
                    foregroundColor: Colors.white,
                    disabledBackgroundColor: isDark ? Colors.white12 : Colors.black12,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: const Text('確定', style: TextStyle(fontSize: 16)),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }
}
