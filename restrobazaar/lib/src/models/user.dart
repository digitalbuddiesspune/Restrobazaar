class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    this.email,
    this.phone,
    this.restaurantName,
    this.gstNumber,
    this.city,
    this.createdAt,
    this.updatedAt,
    this.role = 'user',
  });

  final String id;
  final String name;
  final String? email;
  final String? phone;
  final String? restaurantName;
  final String? gstNumber;
  final String? city;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String role;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      restaurantName: json['restaurantName']?.toString(),
      gstNumber: json['gstNumber']?.toString(),
      city: json['city']?.toString(),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'].toString())
          : null,
      role: (json['role'] ?? 'user').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'phone': phone,
      'restaurantName': restaurantName,
      'gstNumber': gstNumber,
      'city': city,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
      'role': role,
    };
  }
}
