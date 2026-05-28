import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/foundation.dart';
import 'package:firebase_core/firebase_core.dart';

class FirebasePhoneAuthService {
  FirebasePhoneAuthService({FirebaseAuth? auth}) : _authOverride = auth;

  final FirebaseAuth? _authOverride;
  String _verificationId = '';
  int? _resendToken;

  bool get hasPendingVerification => _verificationId.isNotEmpty;

  FirebaseAuth get _auth {
    final auth = _authOverride;
    if (auth != null) {
      return auth;
    }
    if (Firebase.apps.isEmpty) {
      throw Exception(
        'Firebase is not initialized. Add valid Firebase mobile keys before using real OTP mode.',
      );
    }
    return FirebaseAuth.instance;
  }

  Future<void> requestOtp({
    required String phoneNumber,
    required VoidCallback onCodeSent,
  }) async {
    if (kIsWeb) {
      throw Exception(
        'Web Firebase phone auth is not configured in this mobile starter. Use Android or switch OTP mode to demo until Firebase keys are added.',
      );
    }

    final completer = Completer<void>();

    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      forceResendingToken: _resendToken,
      timeout: const Duration(seconds: 90),
      verificationCompleted: (credential) async {
        try {
          await _auth.signInWithCredential(credential);
          if (!completer.isCompleted) {
            completer.complete();
          }
        } catch (error) {
          if (!completer.isCompleted) {
            completer.completeError(error);
          }
        }
      },
      verificationFailed: (error) {
        if (!completer.isCompleted) {
          completer.completeError(
            Exception(error.message ?? 'Firebase phone verification failed.'),
          );
        }
      },
      codeSent: (verificationId, resendToken) {
        _verificationId = verificationId;
        _resendToken = resendToken;
        onCodeSent();
        if (!completer.isCompleted) {
          completer.complete();
        }
      },
      codeAutoRetrievalTimeout: (verificationId) {
        _verificationId = verificationId;
      },
    );

    return completer.future;
  }

  Future<String> confirmOtp(String smsCode) async {
    if (_verificationId.isEmpty) {
      throw Exception('Request an OTP first.');
    }

    final credential = PhoneAuthProvider.credential(
      verificationId: _verificationId,
      smsCode: smsCode.trim(),
    );
    final userCredential = await _auth.signInWithCredential(credential);
    final token = await userCredential.user?.getIdToken();

    if (token == null || token.isEmpty) {
      throw Exception('Firebase did not return a valid ID token.');
    }

    return token;
  }

  Future<void> signOut() async {
    try {
      if (Firebase.apps.isNotEmpty || _authOverride != null) {
        await _auth.signOut();
      }
    } catch (_) {}
  }
}
