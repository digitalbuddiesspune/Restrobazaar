import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/city_controller.dart';
import '../models/city.dart';

class CitySelectorSheet extends ConsumerStatefulWidget {
  const CitySelectorSheet({super.key, this.onSelected});

  final void Function(CityModel)? onSelected;

  @override
  ConsumerState<CitySelectorSheet> createState() => _CitySelectorSheetState();
}

class _CitySelectorSheetState extends ConsumerState<CitySelectorSheet> {
  String? _pendingCityId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cityControllerProvider.notifier).loadCities();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(cityControllerProvider);
    final selectedId = _pendingCityId ?? state.selected?.id;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Select your city',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                ),
                if (state.loading)
                  const Padding(
                    padding: EdgeInsets.only(left: 10),
                    child: SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            if (state.available.isEmpty && !state.loading)
              const Text('No serviceable cities found'),
            if (state.available.isNotEmpty)
              Flexible(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: state.available.length,
                  itemBuilder: (context, index) {
                    final city = state.available[index];
                    return RadioListTile<String>(
                      value: city.id,
                      groupValue: selectedId,
                      onChanged: (value) {
                        setState(() => _pendingCityId = value);
                      },
                      title: Text(city.displayName),
                      subtitle: city.state != null ? Text(city.state!) : null,
                    );
                  },
                ),
              ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: selectedId == null
                        ? null
                        : () {
                            final city = state.available.firstWhere(
                              (element) => element.id == selectedId,
                            );
                            ref
                                .read(cityControllerProvider.notifier)
                                .selectCity(city);
                            widget.onSelected?.call(city);
                            Navigator.of(context).pop();
                          },
                    child: const Text('Confirm'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
