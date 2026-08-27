/// Default shipping tiers (aligned with web Store Settings).
class ShippingTier {
  const ShippingTier({
    required this.minAmount,
    this.maxAmount,
    required this.charge,
  });

  final double minAmount;
  final double? maxAmount; // null = no upper limit
  final double charge;

  factory ShippingTier.fromJson(Map<String, dynamic> json) {
    return ShippingTier(
      minAmount: _toDouble(json['minAmount'], 0),
      maxAmount: json['maxAmount'] == null
          ? null
          : _toDouble(json['maxAmount'], 0),
      charge: _toDouble(json['charge'], 0),
    );
  }

  static double _toDouble(dynamic value, double fallback) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }
}

class ShippingSettings {
  const ShippingSettings({
    this.enabled = true,
    this.tiers = const [],
  });

  final bool enabled;
  final List<ShippingTier> tiers;

  static final defaults = ShippingSettings(
    enabled: true,
    tiers: const [
      ShippingTier(minAmount: 0, maxAmount: 2999, charge: 250),
      ShippingTier(minAmount: 3000, maxAmount: 5999, charge: 150),
      ShippingTier(minAmount: 6000, maxAmount: null, charge: 0),
    ],
  );

  factory ShippingSettings.fromJson(Map<String, dynamic>? json) {
    if (json == null) return defaults;

    final enabled = json['enabled'] != false;
    final rawTiers = json['tiers'];

    if (rawTiers is List && rawTiers.isNotEmpty) {
      final tiers = rawTiers
          .whereType<Map<String, dynamic>>()
          .map(ShippingTier.fromJson)
          .toList()
        ..sort((a, b) => a.minAmount.compareTo(b.minAmount));
      return ShippingSettings(enabled: enabled, tiers: tiers);
    }

    // Legacy threshold fields → ranges
    final baseCharge = _legacyDouble(json['baseCharge'], 250);
    final midTierThreshold = _legacyDouble(json['midTierThreshold'], 3000);
    final midTierCharge = _legacyDouble(json['midTierCharge'], 150);
    final freeShippingThreshold =
        _legacyDouble(json['freeShippingThreshold'], 6000);

    return ShippingSettings(
      enabled: enabled,
      tiers: [
        ShippingTier(
          minAmount: 0,
          maxAmount: (midTierThreshold - 1).clamp(0, double.infinity),
          charge: baseCharge,
        ),
        ShippingTier(
          minAmount: midTierThreshold,
          maxAmount: (freeShippingThreshold - 1).clamp(midTierThreshold, double.infinity),
          charge: midTierCharge,
        ),
        ShippingTier(
          minAmount: freeShippingThreshold,
          maxAmount: null,
          charge: 0,
        ),
      ],
    );
  }

  static double _legacyDouble(dynamic value, double fallback) {
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? fallback;
    return fallback;
  }
}

/// Calculate shipping from cart total (excl. GST) using vendor settings.
double calculateShippingCharges(
  double orderAmount, [
  ShippingSettings? settings,
]) {
  final cfg = settings ?? ShippingSettings.defaults;
  if (!cfg.enabled) return 0;

  final amount = orderAmount;
  for (final tier in cfg.tiers) {
    final minOk = amount >= tier.minAmount;
    final maxOk = tier.maxAmount == null || amount <= tier.maxAmount!;
    if (minOk && maxOk) return tier.charge;
  }

  if (cfg.tiers.isNotEmpty) return cfg.tiers.last.charge;
  return 0;
}
