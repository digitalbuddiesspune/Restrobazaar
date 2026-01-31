import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/constants.dart';
import '../core/local_storage.dart';
import '../core/providers.dart';
import '../models/city.dart';
import '../repositories/city_repository.dart';
import '../repositories/repository_providers.dart';

class CityState {
  const CityState({
    this.selected,
    this.available = const [],
    this.loading = false,
  });

  final CityModel? selected;
  final List<CityModel> available;
  final bool loading;

  CityState copyWith({
    CityModel? selected,
    List<CityModel>? available,
    bool? loading,
  }) {
    return CityState(
      selected: selected ?? this.selected,
      available: available ?? this.available,
      loading: loading ?? this.loading,
    );
  }
}

final cityControllerProvider = StateNotifierProvider<CityController, CityState>(
  (ref) {
    return CityController(ref);
  },
);

class CityController extends StateNotifier<CityState> {
  CityController(this._ref) : super(const CityState());

  final Ref _ref;

  CityRepository get _repository => _ref.read(cityRepositoryProvider);
  LocalStorage get _storage => _ref.read(localStorageProvider);

  Future<void> loadCities() async {
    state = state.copyWith(loading: true);
    try {
      final cities = await _repository.getServiceableCities();
      state = state.copyWith(available: cities, loading: false);

      final savedCityId = _storage.getString(cityIdKey);
      if (savedCityId != null && savedCityId.isNotEmpty) {
        final existing = cities.firstWhere(
          (city) => city.id == savedCityId,
          orElse: () => cities.isNotEmpty
              ? cities.first
              : CityModel(id: '', displayName: ''),
        );
        if (existing.id.isNotEmpty) {
          state = state.copyWith(selected: existing);
        }
      }
    } catch (_) {
      state = state.copyWith(loading: false);
    }
  }

  Future<void> selectCity(CityModel city) async {
    await _storage.setString(cityIdKey, city.id);
    await _storage.setString(cityNameKey, city.displayName);
    state = state.copyWith(selected: city);
  }
}
