import '../core/api_client.dart';
import '../models/address.dart';

class AddressRepository {
  AddressRepository(this._client);

  final ApiClient _client;

  Future<List<AddressModel>> getAddresses() async {
    final response = await _client.requestJson('/addresses', method: 'GET');

    if (response['success'] == true && response['data'] is List) {
      final data = response['data'] as List;
      return data
          .whereType<Map<String, dynamic>>()
          .map(AddressModel.fromJson)
          .toList();
    }
    return [];
  }

  Future<AddressModel?> createAddress(AddressModel address) async {
    final response = await _client.requestJson(
      '/addresses',
      method: 'POST',
      data: {
        'name': address.name,
        'phone': address.phone,
        'addressLine1': address.addressLine1,
        'addressLine2': address.addressLine2,
        'city': address.city,
        'state': address.state,
        'pincode': address.pincode,
        'landmark': address.landmark,
        'addressType': address.addressType,
      },
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return AddressModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<AddressModel?> updateAddress(AddressModel address) async {
    final response = await _client.requestJson(
      '/addresses/${address.id}',
      method: 'PUT',
      data: {
        'name': address.name,
        'phone': address.phone,
        'addressLine1': address.addressLine1,
        'addressLine2': address.addressLine2,
        'city': address.city,
        'state': address.state,
        'pincode': address.pincode,
        'landmark': address.landmark,
        'addressType': address.addressType,
      },
    );

    if (response['success'] == true &&
        response['data'] is Map<String, dynamic>) {
      return AddressModel.fromJson(response['data'] as Map<String, dynamic>);
    }
    return null;
  }

  Future<void> deleteAddress(String id) async {
    await _client.request('/addresses/$id', method: 'DELETE');
  }
}
