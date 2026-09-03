package com.akenterprises.restrobazaar

import android.content.ContentValues
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileOutputStream

class MainActivity : FlutterActivity() {
    private val channelName = "com.akenterprises.restrobazaar/downloads"

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, channelName)
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "saveToDownloads" -> {
                        val fileName = call.argument<String>("fileName")
                        val bytes = call.argument<ByteArray>("bytes")
                        if (fileName.isNullOrBlank() || bytes == null) {
                            result.error("INVALID_ARGS", "fileName and bytes are required", null)
                            return@setMethodCallHandler
                        }
                        try {
                            result.success(savePdfToDownloads(fileName, bytes))
                        } catch (e: Exception) {
                            result.error("SAVE_FAILED", e.message, null)
                        }
                    }
                    else -> result.notImplemented()
                }
            }
    }

    private fun savePdfToDownloads(fileName: String, bytes: ByteArray): String {
        val safeName = File(fileName).name
            .replace(Regex("[\\\\/:*?\"<>|#\\p{Cntrl}]"), "_")
            .replace(Regex("_+"), "_")
            .trim('_')
            .ifBlank { "invoice.pdf" }
            .let { name ->
                if (name.lowercase().endsWith(".pdf")) name else "$name.pdf"
            }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val resolver = applicationContext.contentResolver
            val values = ContentValues().apply {
                put(MediaStore.MediaColumns.DISPLAY_NAME, safeName)
                put(MediaStore.MediaColumns.MIME_TYPE, "application/pdf")
                put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS)
                put(MediaStore.MediaColumns.IS_PENDING, 1)
            }
            val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                ?: throw IllegalStateException("Unable to create Downloads entry")
            try {
                resolver.openOutputStream(uri)?.use { output ->
                    output.write(bytes)
                    output.flush()
                } ?: throw IllegalStateException("Unable to open Downloads stream")
                values.clear()
                values.put(MediaStore.MediaColumns.IS_PENDING, 0)
                resolver.update(uri, values, null, null)
            } catch (e: Exception) {
                resolver.delete(uri, null, null)
                throw e
            }
            return "${Environment.DIRECTORY_DOWNLOADS}/$safeName"
        }

        @Suppress("DEPRECATION")
        val downloadsDir =
            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
        if (!downloadsDir.exists()) {
            downloadsDir.mkdirs()
        }
        val file = File(downloadsDir, safeName)
        FileOutputStream(file).use { output ->
            output.write(bytes)
            output.flush()
        }
        return file.absolutePath
    }
}
