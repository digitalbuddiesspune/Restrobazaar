import '../core/api_client.dart';
import '../core/shipping.dart';

class VendorRepository {
  VendorRepository(this._client);

  final ApiClient _client;

  Future<ShippingSettings> getShippingSettings(String vendorId) async {
    if (vendorId.isEmpty) return ShippingSettings.defaults;
    try {
      final response = await _client.requestJson(
        '/vendors/$vendorId/shipping-settings',
        method: 'GET',
      );
      if (response['success'] == true && response['data'] is Map<String, dynamic>) {
        final payload = response['data'] as Map<String, dynamic>;
        final settings = payload['shippingSettings'];
        if (settings is Map<String, dynamic>) {
          return ShippingSettings.fromJson(settings);
        }
      }
    } catch (_) {
      // Fall back to defaults
    }
    return ShippingSettings.defaults;
  }
}
