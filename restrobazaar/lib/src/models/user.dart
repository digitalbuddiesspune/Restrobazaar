class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    this.email,
    this.role = 'user',
  });

  final String id;
  final String name;
  final String? email;
  final String role;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: (json['id'] ?? json['_id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      email: json['email']?.toString(),
      role: (json['role'] ?? 'user').toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'name': name, 'email': email, 'role': role};
  }
}
