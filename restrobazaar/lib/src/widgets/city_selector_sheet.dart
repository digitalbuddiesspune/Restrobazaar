import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../controllers/city_controller.dart';
import '../models/city.dart';
import '../services/location_service.dart';

class CitySelectorSheet extends ConsumerStatefulWidget {
  const CitySelectorSheet({super.key, this.onSelected});

  final void Function(CityModel)? onSelected;

  @override
  ConsumerState<CitySelectorSheet> createState() => _CitySelectorSheetState();
}

class _CitySelectorSheetState extends ConsumerState<CitySelectorSheet> {
  String? _pendingCityId;
  bool _checkingLocation = false;
  String? _locationError;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(cityControllerProvider.notifier).loadCities();
    });
  }

  Future<void> _confirmCity(CityModel city) async {
    setState(() {
      _checkingLocation = true;
      _locationError = null;
    });

    final result = await LocationService.instance.verifyDeliveryForSelectedCity(
      city.displayName,
    );

    if (!mounted) return;

    if (!result.ok && result.reason == 'city_mismatch') {
      setState(() => _checkingLocation = false);
      await showDialog<void>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Not deliverable in your current location'),
          content: Text(
            result.locationCity != null
                ? 'You are currently in ${result.locationCity}, but selected ${city.displayName}. Please choose a matching city.'
                : result.message,
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
      return;
    }

    if (!result.ok && result.reason == 'location_error') {
      // Allow selecting city for browsing; checkout will re-check.
      setState(() {
        _checkingLocation = false;
        _locationError = result.message;
      });
      final continueAnyway = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Location unavailable'),
          content: Text(
            '${result.message}\n\nYou can continue browsing, but location will be required to place an order.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Continue'),
            ),
          ],
        ),
      );
      if (continueAnyway != true) return;
    }

    await ref.read(cityControllerProvider.notifier).selectCity(city);
    widget.onSelected?.call(city);
    if (!mounted) return;
    Navigator.of(context).pop();
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
                if (state.loading || _checkingLocation)
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
            const SizedBox(height: 8),
            Text(
              'We use your location to confirm delivery is available in the selected city.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (_locationError != null) ...[
              const SizedBox(height: 8),
              Text(
                _locationError!,
                style: TextStyle(fontSize: 12, color: Colors.red.shade700),
              ),
            ],
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
                      onChanged: _checkingLocation
                          ? null
                          : (value) {
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
                    onPressed: _checkingLocation
                        ? null
                        : () => Navigator.of(context).pop(),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton(
                    onPressed: selectedId == null || _checkingLocation
                        ? null
                        : () {
                            final city = state.available.firstWhere(
                              (element) => element.id == selectedId,
                            );
                            _confirmCity(city);
                          },
                    child: Text(
                      _checkingLocation ? 'Checking location…' : 'Confirm',
                    ),
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
