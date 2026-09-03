import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/services.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

const _downloadsChannel = MethodChannel(
  'com.akenterprises.restrobazaar/downloads',
);

/// Sanitize for filesystem / MediaStore. Never include `#` — Uri/MediaStore
/// treat it as a fragment and truncate the name (dropping `.pdf`).
String sanitizeDownloadFileName(String fileName) {
  var name = fileName.trim();
  if (name.isEmpty) name = 'invoice';

  if (name.toLowerCase().endsWith('.pdf')) {
    name = name.substring(0, name.length - 4);
  }

  name = name
      .replaceAll('#', '')
      .replaceAll(RegExp(r'[\\/:*?"<>|]'), '_')
      .replaceAll(RegExp(r'\s+'), '_')
      .replaceAll(RegExp(r'_+'), '_')
      .replaceAll(RegExp(r'^_+|_+$'), '');

  if (name.isEmpty) name = 'invoice';
  return '$name.pdf';
}

/// Saves [bytes] as [fileName] into the device Downloads folder (Android).
/// On iOS, opens the system share sheet so the user can save to Files.
Future<String> savePdfToDownloads({
  required Uint8List bytes,
  required String fileName,
}) async {
  final safeName = sanitizeDownloadFileName(fileName);

  if (Platform.isAndroid) {
    try {
      final path = await _downloadsChannel.invokeMethod<String>(
        'saveToDownloads',
        <String, dynamic>{
          'fileName': safeName,
          'bytes': bytes,
        },
      );
      if (path != null && path.isNotEmpty) {
        return path;
      }
    } on MissingPluginException {
      // Native channel not registered yet (hot reload). Fall back to share.
    } on PlatformException {
      // Fall back to share sheet.
    }
  }

  final tempDir = await getTemporaryDirectory();
  final tempFile = File('${tempDir.path}/$safeName');
  await tempFile.writeAsBytes(bytes, flush: true);

  await SharePlus.instance.share(
    ShareParams(
      files: [
        XFile(
          tempFile.path,
          mimeType: 'application/pdf',
          name: safeName,
        ),
      ],
      subject: safeName,
    ),
  );
  return tempFile.path;
}
