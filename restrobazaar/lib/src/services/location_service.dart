import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';

class LocationInfo {
  const LocationInfo({
    required this.city,
    this.locality = '',
    this.region = '',
    this.candidates = const [],
  });

  final String city;
  final String locality;
  final String region;
  final List<String> candidates;
}

class DeliveryLocationResult {
  const DeliveryLocationResult({
    required this.ok,
    required this.reason,
    required this.message,
    this.selectedCity,
    this.locationCity,
  });

  final bool ok;
  final String reason;
  final String message;
  final String? selectedCity;
  final String? locationCity;
}

class LocationService {
  LocationService._();
  static final LocationService instance = LocationService._();

  String _normalize(String value) {
    return value
        .toLowerCase()
        .replaceAll(RegExp(r'[^a-z0-9\s]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  Future<Position> requestPosition() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled. Please enable GPS.');
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception(
        'Location permission denied. Please allow location access to place orders.',
      );
    }
    if (permission == LocationPermission.deniedForever) {
      throw Exception(
        'Location permission permanently denied. Enable it from app settings.',
      );
    }

    return Geolocator.getCurrentPosition(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        timeLimit: Duration(seconds: 15),
      ),
    );
  }

  Future<LocationInfo> reverseGeocode(Position position) async {
    final placemarks = await placemarkFromCoordinates(
      position.latitude,
      position.longitude,
    );
    if (placemarks.isEmpty) {
      throw Exception('Failed to detect your city from location');
    }

    final place = placemarks.first;
    final candidates = <String>[
      if ((place.locality ?? '').isNotEmpty) place.locality!,
      if ((place.subAdministrativeArea ?? '').isNotEmpty)
        place.subAdministrativeArea!,
      if ((place.administrativeArea ?? '').isNotEmpty) place.administrativeArea!,
      if ((place.subLocality ?? '').isNotEmpty) place.subLocality!,
    ];

    return LocationInfo(
      city: place.locality?.isNotEmpty == true
          ? place.locality!
          : (place.subAdministrativeArea ?? place.administrativeArea ?? ''),
      locality: place.locality ?? '',
      region: place.administrativeArea ?? '',
      candidates: candidates,
    );
  }

  bool isLocationInSelectedCity(LocationInfo info, String selectedCityName) {
    final selected = _normalize(selectedCityName);
    if (selected.isEmpty) return false;

    final candidates = <String>[
      info.city,
      info.locality,
      info.region,
      ...info.candidates,
    ].map(_normalize).where((value) => value.isNotEmpty);

    return candidates.any(
      (candidate) =>
          candidate == selected ||
          candidate.contains(selected) ||
          selected.contains(candidate),
    );
  }

  Future<DeliveryLocationResult> verifyDeliveryForSelectedCity(
    String? selectedCityName,
  ) async {
    final selectedCity = selectedCityName?.trim();
    if (selectedCity == null || selectedCity.isEmpty) {
      return const DeliveryLocationResult(
        ok: false,
        reason: 'no_selected_city',
        message: 'Please select a city before placing an order.',
      );
    }

    try {
      final position = await requestPosition();
      final locationInfo = await reverseGeocode(position);
      final locationCity = locationInfo.city.isNotEmpty
          ? locationInfo.city
          : (locationInfo.locality.isNotEmpty
              ? locationInfo.locality
              : locationInfo.region);

      final matches = isLocationInSelectedCity(locationInfo, selectedCity);
      if (!matches) {
        return DeliveryLocationResult(
          ok: false,
          reason: 'city_mismatch',
          message: 'Not deliverable in your current location',
          selectedCity: selectedCity,
          locationCity: locationCity.isEmpty ? 'your area' : locationCity,
        );
      }

      return DeliveryLocationResult(
        ok: true,
        reason: 'match',
        message: '',
        selectedCity: selectedCity,
        locationCity: locationCity,
      );
    } catch (error) {
      return DeliveryLocationResult(
        ok: false,
        reason: 'location_error',
        message: error.toString().replaceFirst('Exception: ', ''),
        selectedCity: selectedCity,
      );
    }
  }
}
