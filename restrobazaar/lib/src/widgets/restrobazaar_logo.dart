import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

const _logoAsset = 'assets/images/restrobazaar_logo.png';
const _logoUrl =
    'https://res.cloudinary.com/debhhnzgh/image/upload/v1767956041/RestroLogo_vmcnsl.png?v=2';

class RestroBazaarLogo extends StatelessWidget {
  const RestroBazaarLogo({super.key, this.height = 28});

  final double height;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(height * 0.2),
      child: Image.asset(
        _logoAsset,
        height: height,
        fit: BoxFit.contain,
        errorBuilder: (_, __, ___) => CachedNetworkImage(
          imageUrl: _logoUrl,
          height: height,
          fit: BoxFit.contain,
          errorWidget: (_, __, ___) => Text(
            'RestroBazaar',
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w700,
              fontSize: height * 0.4,
            ),
          ),
        ),
      ),
    );
  }
}
