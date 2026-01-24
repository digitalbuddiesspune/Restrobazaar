import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/constants.dart';
import '../core/api_client.dart';
import '../core/local_storage.dart';
import '../core/providers.dart';
import '../models/user.dart';
import '../repositories/auth_repository.dart';
import '../repositories/repository_providers.dart';

class AuthState {
  const AuthState({this.user, this.loading = false, this.error});

  final UserModel? user;
  final bool loading;
  final String? error;

  AuthState copyWith({UserModel? user, bool? loading, String? error}) {
    return AuthState(
      user: user ?? this.user,
      loading: loading ?? this.loading,
      error: error,
    );
  }

  bool get isAuthenticated => user != null;
}

final authControllerProvider = StateNotifierProvider<AuthController, AuthState>(
  (ref) {
    return AuthController(ref);
  },
);

class AuthController extends StateNotifier<AuthState> {
  AuthController(this._ref) : super(const AuthState());

  final Ref _ref;

  AuthRepository get _repository => _ref.read(authRepositoryProvider);
  LocalStorage get _storage => _ref.read(localStorageProvider);
  ApiClient get _apiClient => _ref.read(apiClientProvider);

  Future<void> restoreSession() async {
    final token = _storage.getString(authTokenKey);
    _apiClient.setBearerToken(token);

    final savedUser = _storage.getJson<UserModel>(
      userInfoKey,
      UserModel.fromJson,
    );
    if (savedUser != null) {
      state = state.copyWith(user: savedUser);
      return;
    }

    try {
      state = state.copyWith(loading: true, error: null);
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        await _storage.setJson(userInfoKey, user.toJson());
        state = state.copyWith(user: user, loading: false);
      } else {
        state = state.copyWith(loading: false);
      }
    } catch (error) {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> refreshUser({bool force = false}) async {
    try {
      final existing = state.user;
      final hasProfileDetails = existing?.phone?.isNotEmpty == true &&
          existing?.createdAt != null;

      if (!force && hasProfileDetails) return;

      state = state.copyWith(loading: true, error: null);
      final user = await _repository.fetchCurrentUser();
      if (user != null) {
        await _storage.setJson(userInfoKey, user.toJson());
        state = state.copyWith(user: user, loading: false);
      } else {
        state = state.copyWith(loading: false);
      }
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
    }
  }

  Future<bool> signIn({required String email, required String password}) async {
    try {
      state = state.copyWith(loading: true, error: null);
      final result = await _repository.signIn(
        email: email,
        password: password,
      );
      await _storage.setJson(userInfoKey, result.user.toJson());
      if (result.token != null && result.token!.isNotEmpty) {
        await _storage.setString(authTokenKey, result.token!);
        _apiClient.setBearerToken(result.token);
      } else {
        await _storage.remove(authTokenKey);
        _apiClient.setBearerToken(null);
      }
      state = state.copyWith(user: result.user, loading: false);
      return true;
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
      return false;
    }
  }

  Future<bool> sendOtpLogin({required String phone}) async {
    try {
      state = state.copyWith(loading: true, error: null);
      await _repository.sendOtpForLogin(phone: phone);
      state = state.copyWith(loading: false);
      return true;
    } catch (error) {
      state = state.copyWith(
        loading: false,
        error: error is ApiException ? error.message : error.toString(),
      );
      return false;
    }
  }

  Future<bool> verifyOtpLogin({
    required String phone,
    required String otp,
  }) async {
    try {
      state = state.copyWith(loading: true, error: null);
      final result = await _repository.verifyOtpLogin(
        phone: phone,
        otp: otp,
      );
      await _storage.setJson(userInfoKey, result.user.toJson());
      if (result.token != null && result.token!.isNotEmpty) {
        await _storage.setString(authTokenKey, result.token!);
        _apiClient.setBearerToken(result.token);
      } else {
        await _storage.remove(authTokenKey);
        _apiClient.setBearerToken(null);
      }
      state = state.copyWith(user: result.user, loading: false);
      return true;
    } catch (error) {
      state = state.copyWith(
        loading: false,
        error: error is ApiException ? error.message : error.toString(),
      );
      return false;
    }
  }

  Future<bool> signUp({
    required String name,
    required String email,
    required String password,
    String? phone,
  }) async {
    try {
      state = state.copyWith(loading: true, error: null);
      final result = await _repository.signUp(
        name: name,
        email: email,
        password: password,
        phone: phone,
      );
      await _storage.setJson(userInfoKey, result.user.toJson());
      if (result.token != null && result.token!.isNotEmpty) {
        await _storage.setString(authTokenKey, result.token!);
        _apiClient.setBearerToken(result.token);
      } else {
        await _storage.remove(authTokenKey);
        _apiClient.setBearerToken(null);
      }
      state = state.copyWith(user: result.user, loading: false);
      return true;
    } catch (error) {
      state = state.copyWith(loading: false, error: error.toString());
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _repository.logout();
    } catch (_) {
      // ignore network errors during logout
    } finally {
      await _storage.remove(userInfoKey);
      await _storage.remove(authTokenKey);
      _apiClient.setBearerToken(null);
      state = const AuthState();
    }
  }
}
