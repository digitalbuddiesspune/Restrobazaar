import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/providers.dart';
import 'address_repository.dart';
import 'auth_repository.dart';
import 'catalog_repository.dart';
import 'city_repository.dart';
import 'coupon_repository.dart';
import 'notification_repository.dart';
import 'order_repository.dart';
import 'testimonial_repository.dart';
import 'wishlist_repository.dart';

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(ref.read(apiClientProvider)),
);

final cityRepositoryProvider = Provider<CityRepository>(
  (ref) => CityRepository(ref.read(apiClientProvider)),
);

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.read(apiClientProvider)),
);

final wishlistRepositoryProvider = Provider<WishlistRepository>(
  (ref) => WishlistRepository(ref.read(apiClientProvider)),
);

final addressRepositoryProvider = Provider<AddressRepository>(
  (ref) => AddressRepository(ref.read(apiClientProvider)),
);

final orderRepositoryProvider = Provider<OrderRepository>(
  (ref) => OrderRepository(ref.read(apiClientProvider)),
);

final couponRepositoryProvider = Provider<CouponRepository>(
  (ref) => CouponRepository(ref.read(apiClientProvider)),
);

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(ref.read(apiClientProvider)),
);

final testimonialRepositoryProvider = Provider<TestimonialRepository>(
  (ref) => TestimonialRepository(ref.read(apiClientProvider)),
);
