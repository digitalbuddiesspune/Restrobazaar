class CityModel {
  const CityModel({required this.id, required this.displayName, this.state});

  final String id;
  final String displayName;
  final String? state;

  factory CityModel.fromJson(Map<String, dynamic> json) {
    return CityModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      displayName: (json['displayName'] ?? json['name'] ?? '').toString(),
      state: json['state']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {'id': id, 'displayName': displayName, 'state': state};
  }
}
