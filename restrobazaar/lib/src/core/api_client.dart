import 'dart:io';

import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:flutter/foundation.dart';

class ApiClient {
  ApiClient({required String baseUrl, required PersistCookieJar cookieJar})
    : _baseUrl = baseUrl.endsWith('/')
          ? baseUrl.substring(0, baseUrl.length - 1)
          : baseUrl,
      _cookieJar = cookieJar {
    final options = BaseOptions(
      baseUrl: _baseUrl,
      connectTimeout: const Duration(seconds: 20),
      receiveTimeout: const Duration(seconds: 20),
      headers: {HttpHeaders.contentTypeHeader: 'application/json'},
      validateStatus: (status) => status != null && status < 600,
    );

    _dio = Dio(options);
    _dio.interceptors.add(CookieManager(_cookieJar));

    if (kDebugMode) {
      _dio.interceptors.add(
        LogInterceptor(
          responseBody: false,
          requestBody: true,
          requestHeader: false,
          responseHeader: false,
        ),
      );
    }
  }

  final String _baseUrl;
  final PersistCookieJar _cookieJar;
  late final Dio _dio;

  void setBearerToken(String? token) {
    if (token == null || token.isEmpty) {
      _dio.options.headers.remove(HttpHeaders.authorizationHeader);
    } else {
      _dio.options.headers[HttpHeaders.authorizationHeader] = 'Bearer $token';
    }
  }

  Future<Response<dynamic>> request(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? queryParameters,
    dynamic data,
    Options? options,
  }) async {
    final mergedOptions =
        options?.copyWith(method: method) ?? Options(method: method);

    try {
      final response = await _dio.request<dynamic>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: mergedOptions,
      );

      final statusCode = response.statusCode ?? 500;
      if (statusCode >= 200 && statusCode < 300) {
        return response;
      }

      throw ApiException(
        statusCode: statusCode,
        message:
            _extractErrorMessage(response.data) ??
            'Request failed with status code $statusCode',
      );
    } on DioException catch (error) {
      final response = error.response;
      throw ApiException(
        statusCode: response?.statusCode,
        message:
            _extractErrorMessage(response?.data) ??
            error.message ??
            'Network error',
      );
    }
  }

  Future<Map<String, dynamic>> requestJson(
    String path, {
    String method = 'GET',
    Map<String, dynamic>? queryParameters,
    dynamic data,
    Options? options,
  }) async {
    final response = await request(
      path,
      method: method,
      queryParameters: queryParameters,
      data: data,
      options: options,
    );

    if (response.data is Map<String, dynamic>) {
      return response.data as Map<String, dynamic>;
    }

    if (response.data is String) {
      return {'data': response.data};
    }

    throw ApiException(
      statusCode: response.statusCode,
      message: 'Unexpected response format',
    );
  }

  String? _extractErrorMessage(dynamic data) {
    if (data == null) return null;
    if (data is String) return data;
    if (data is Map<String, dynamic>) {
      return data['message']?.toString() ??
          data['error']?.toString() ??
          data['data']?.toString();
    }
    return null;
  }
}

class ApiException implements Exception {
  ApiException({this.statusCode, required this.message});

  final int? statusCode;
  final String message;

  @override
  String toString() =>
      'ApiException(statusCode: $statusCode, message: $message)';
}
