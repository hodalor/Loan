import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import '../config/mobile_env.dart';

class SpeedCashApiService {
  SpeedCashApiService({http.Client? client}) : _client = client ?? http.Client();

  static const String _defaultHostedCustomerApiBase =
      'https://loan-htqt.onrender.com/users';
  final http.Client _client;
  String? _resolvedBaseUrl;

  List<String> get _baseUrls {
    final configured = <String>[];

    void addBase(String? value) {
      final trimmed = value?.trim();
      if (trimmed == null || trimmed.isEmpty) {
        return;
      }
      configured.add(_normalizeUsersBase(trimmed));
    }

    addBase(MobileEnv.customerAuthBaseUrl);
    addBase(MobileEnv.apiBaseUrl);

    if (kIsWeb) {
      configured.addAll(['http://localhost:9000/users', _defaultHostedCustomerApiBase]);
      return configured.toSet().toList();
    }

    addBase(MobileEnv.hostedCustomerAuthBaseUrl);
    addBase(MobileEnv.hostedApiBaseUrl);
    addBase(MobileEnv.lanCustomerAuthBaseUrl);
    addBase(MobileEnv.lanApiBaseUrl);
    configured.add(_defaultHostedCustomerApiBase);

    return configured.toSet().toList();
  }

  String get currentBaseUrl => _resolvedBaseUrl ?? _baseUrls.first;

  String resolveMediaUrl(String value) {
    final normalized = value.trim().replaceAll('\\', '/');
    if (normalized.isEmpty) {
      return '';
    }

    if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
      return Uri.encodeFull(normalized);
    }

    if (normalized.startsWith('data:') || normalized.startsWith('blob:')) {
      return normalized;
    }

    final apiBaseUrl = currentBaseUrl.replaceFirst(RegExp(r'/users$'), '');
    final uploadMatch = RegExp(r'/upload/([^?#]+)', caseSensitive: false).firstMatch(normalized);
    if (uploadMatch != null) {
      return '$apiBaseUrl/upload/${Uri.encodeComponent(uploadMatch.group(1)!)}';
    }

    if (normalized.startsWith('/upload/')) {
      return '$apiBaseUrl$normalized';
    }

    if (!normalized.contains('/')) {
      return '$apiBaseUrl/upload/${Uri.encodeComponent(normalized)}';
    }

    return normalized;
  }

  Future<Map<String, dynamic>> fetchPortalContent() {
    return _request(
      path: '/portal/content',
      method: 'GET',
    );
  }

  Future<Map<String, dynamic>> requestOtp(Map<String, dynamic> payload) {
    return _request(path: '/auth/request-otp', body: payload);
  }

  Future<Map<String, dynamic>> verifyOtp(Map<String, dynamic> payload) {
    return _request(path: '/auth/verify-otp', body: payload);
  }

  Future<Map<String, dynamic>> setPin(Map<String, dynamic> payload) {
    return _request(path: '/auth/set-pin', body: payload);
  }

  Future<Map<String, dynamic>> login(Map<String, dynamic> payload) {
    return _request(path: '/auth/login', body: payload);
  }

  Future<Map<String, dynamic>> fetchPortalSummary(String phone) {
    return _request(
      path: '/portal/summary',
      body: {
        'phone': phone,
      },
    );
  }

  Future<Map<String, dynamic>> saveDraft(Map<String, dynamic> payload) {
    return _request(path: '/application/save-draft', body: payload);
  }

  Future<Map<String, dynamic>> submitProfile({
    required String phone,
    required Map<String, dynamic> application,
    required String countryCode,
    File? frontPhoto,
    File? backPhoto,
    File? selfiePhoto,
  }) async {
    return _multipartRequest(
      path: '/application/submit-profile',
      fields: {
        'phone': phone,
        'countryCode': countryCode,
        'application': jsonEncode(application),
      },
      files: {
        'frontPhoto': frontPhoto,
        'backPhoto': backPhoto,
        'selfiePhoto': selfiePhoto,
      },
    );
  }

  Future<Map<String, dynamic>> applyLoan(Map<String, dynamic> payload) {
    return _request(path: '/portal/apply-loan', body: payload);
  }

  Future<Map<String, dynamic>> fetchRepaymentSummary(Map<String, dynamic> payload) {
    return _request(path: '/portal/repayment-summary', body: payload);
  }

  Future<Map<String, dynamic>> payLoan(Map<String, dynamic> payload) {
    return _request(path: '/portal/pay-loan', body: payload);
  }

  Future<Map<String, dynamic>> fetchExtensionSummary(Map<String, dynamic> payload) {
    return _request(path: '/portal/extension-summary', body: payload);
  }

  Future<Map<String, dynamic>> extendLoan(Map<String, dynamic> payload) {
    return _request(path: '/portal/extend-loan', body: payload);
  }

  Future<Map<String, dynamic>> verifyGateway(String reference) {
    return _request(
      path: '/portal/gateway/verify',
      body: {
        'reference': reference,
      },
    );
  }

  String _normalizeUsersBase(String value) {
    final trimmed = value.replaceAll(RegExp(r'/+$'), '');
    if (trimmed.toLowerCase().endsWith('/users')) {
      return trimmed;
    }
    return '$trimmed/users';
  }

  Uri _buildUri(String baseUrl, String path) {
    final normalizedBase = baseUrl.endsWith('/') ? baseUrl : '$baseUrl/';
    final normalizedPath = path.startsWith('/') ? path.substring(1) : path;
    return Uri.parse('$normalizedBase$normalizedPath');
  }

  bool _shouldRetry(Object error) {
    final message = error.toString().toLowerCase();
    return message.contains('socketexception') ||
        message.contains('timed out') ||
        message.contains('connection refused') ||
        message.contains('failed host lookup') ||
        message.contains('clientexception');
  }

  Duration _timeoutFor(String baseUrl, {required bool isMultipart}) {
    final host = Uri.tryParse(baseUrl)?.host.toLowerCase() ?? '';
    final isLocalHost = host == 'localhost' ||
        host == '127.0.0.1' ||
        host == '10.0.2.2' ||
        host.startsWith('192.168.') ||
        host.startsWith('10.') ||
        host.startsWith('172.16.') ||
        host.startsWith('172.17.') ||
        host.startsWith('172.18.') ||
        host.startsWith('172.19.') ||
        host.startsWith('172.2') ||
        host.startsWith('172.30.') ||
        host.startsWith('172.31.');

    if (isLocalHost) {
      return isMultipart ? const Duration(seconds: 10) : const Duration(seconds: 4);
    }

    return isMultipart ? const Duration(seconds: 45) : const Duration(seconds: 20);
  }

  Future<Map<String, dynamic>> _request({
    required String path,
    String method = 'POST',
    Map<String, dynamic>? body,
  }) async {
    Object? lastError;

    for (final baseUrl in _baseUrls) {
      final uri = _buildUri(baseUrl, path);

      try {
        http.Response response;
        if (method == 'GET') {
          response = await _client.get(uri).timeout(_timeoutFor(baseUrl, isMultipart: false));
        } else {
          response = await _client
              .post(
                uri,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: jsonEncode(body ?? <String, dynamic>{}),
              )
              .timeout(_timeoutFor(baseUrl, isMultipart: false));
        }

        _resolvedBaseUrl = baseUrl;
        return _decodeResponse(response);
      } catch (error) {
        lastError = error;
        if (!_shouldRetry(error) || baseUrl == _baseUrls.last) {
          break;
        }
      }
    }

    throw Exception(lastError?.toString() ?? 'Unable to reach SpeedCash backend.');
  }

  Future<Map<String, dynamic>> _multipartRequest({
    required String path,
    required Map<String, String> fields,
    required Map<String, File?> files,
  }) async {
    Object? lastError;

    for (final baseUrl in _baseUrls) {
      final uri = _buildUri(baseUrl, path);

      try {
        final request = http.MultipartRequest('POST', uri);
        request.fields.addAll(fields);

        for (final entry in files.entries) {
          final file = entry.value;
          if (file == null) {
            continue;
          }

          request.files.add(
            await http.MultipartFile.fromPath(entry.key, file.path),
          );
        }

        final streamed = await request
            .send()
            .timeout(_timeoutFor(baseUrl, isMultipart: true));
        final response = await http.Response.fromStream(streamed);
        _resolvedBaseUrl = baseUrl;
        return _decodeResponse(response);
      } catch (error) {
        lastError = error;
        if (!_shouldRetry(error) || baseUrl == _baseUrls.last) {
          break;
        }
      }
    }

    throw Exception(lastError?.toString() ?? 'Unable to submit profile.');
  }

  Map<String, dynamic> _decodeResponse(http.Response response) {
    final body = response.body.trim();
    final isHtml = response.headers['content-type']?.contains('text/html') == true ||
        body.startsWith('<!DOCTYPE html') ||
        body.startsWith('<html');

    if (isHtml) {
      throw Exception(
        'The mobile app reached an HTML page instead of the customer API. Check the hosted customer API URL in mobile/.env.',
      );
    }

    final decoded = body.isEmpty ? <String, dynamic>{} : jsonDecode(body);
    if (decoded is! Map<String, dynamic>) {
      throw Exception('Unexpected response from SpeedCash backend.');
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw Exception(
        decoded['message']?.toString() ?? 'Request failed with status ${response.statusCode}.',
      );
    }

    return decoded;
  }
}
