import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/testimonial.dart';
import '../repositories/repository_providers.dart';

final testimonialsProvider = FutureProvider<List<TestimonialModel>>((ref) async {
  final repo = ref.read(testimonialRepositoryProvider);
  return repo.getTestimonials(status: true, limit: 100);
});
