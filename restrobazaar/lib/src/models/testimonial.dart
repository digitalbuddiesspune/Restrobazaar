class TestimonialModel {
  const TestimonialModel({
    required this.id,
    required this.name,
    required this.role,
    required this.location,
    required this.review,
    required this.status,
    this.rating = 5,
  });

  final String id;
  final String name;
  final String role;
  final String location;
  final String review;
  final bool status;
  final int rating;

  factory TestimonialModel.fromJson(Map<String, dynamic> json) {
    return TestimonialModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      role: (json['businessType'] ?? json['role'] ?? '').toString(),
      location: (json['location'] ?? '').toString(),
      review: (json['review'] ?? json['text'] ?? '').toString(),
      status: json['status'] is bool
          ? json['status'] as bool
          : json['status']?.toString().toLowerCase() == 'true',
      rating: (json['rating'] is num)
          ? (json['rating'] as num).toInt()
          : 5,
    );
  }

  String get imageUrl {
    final encoded = Uri.encodeComponent(name);
    return 'https://ui-avatars.com/api/?name=$encoded&background=ef4444&color=fff&size=128';
  }
}
