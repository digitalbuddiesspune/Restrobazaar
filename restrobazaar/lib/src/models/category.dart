class CategoryModel {
  const CategoryModel({
    required this.id,
    required this.name,
    required this.slug,
    this.image,
    this.description,
    this.subCategories = const [],
  });

  final String id;
  final String name;
  final String slug;
  final String? image;
  final String? description;
  final List<String> subCategories;

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    final rawSubs = json['subcategories'] ?? json['subCategories'] ?? [];
    return CategoryModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: (json['name'] ?? '').toString(),
      slug: (json['slug'] ?? _slugify(json['name']?.toString() ?? ''))
          .toString(),
      image: json['image']?.toString(),
      description: json['description']?.toString(),
      subCategories: rawSubs is List
          ? rawSubs.map((e) => e.toString()).toList()
          : const [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'slug': slug,
      'image': image,
      'description': description,
      'subcategories': subCategories,
    };
  }
}

String _slugify(String value) {
  return value
      .toLowerCase()
      .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
      .replaceAll(RegExp(r'^-+|-+$'), '');
}
