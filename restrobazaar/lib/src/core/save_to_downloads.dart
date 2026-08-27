import 'dart:io';
import 'dart:typed_data';

import 'package:media_store_plus/media_store_plus.dart';
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';

/// Saves [bytes] as [fileName] into the device Downloads folder (Android).
/// On iOS (no public Downloads folder), opens the system share sheet.
Future<String> savePdfToDownloads({
  required Uint8List bytes,
  required String fileName,
}) async {
  final safeName = fileName.endsWith('.pdf') ? fileName : '$fileName.pdf';

  final tempDir = await getTemporaryDirectory();
  final tempFile = File('${tempDir.path}/$safeName');
  await tempFile.writeAsBytes(bytes, flush: true);

  if (Platform.isAndroid) {
    try {
      await MediaStore.ensureInitialized();
      if (MediaStore.appFolder.isEmpty) {
        MediaStore.appFolder = 'RestroBazaar';
      }

      final saveInfo = await MediaStore().saveFile(
        tempFilePath: tempFile.path,
        dirType: DirType.download,
        dirName: DirName.download,
        relativePath: '',
      );

      if (saveInfo != null) {
        return 'Downloads/$safeName';
      }
    } catch (_) {
      // Fall through to share sheet.
    }

    // MediaStore deletes the temp file after a successful copy; recreate if needed.
    if (!await tempFile.exists()) {
      await tempFile.writeAsBytes(bytes, flush: true);
    }

    await SharePlus.instance.share(
      ShareParams(
        files: [XFile(tempFile.path, mimeType: 'application/pdf')],
        subject: safeName,
      ),
    );
    return tempFile.path;
  }

  await SharePlus.instance.share(
    ShareParams(
      files: [XFile(tempFile.path, mimeType: 'application/pdf')],
      subject: safeName,
    ),
  );
  return tempFile.path;
}
