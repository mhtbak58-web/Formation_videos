package com.formationvideos.app.androidauto

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

/**
 * React Native bridge that lets the JS side hand the current video
 * catalog over to the native Android Auto service. The catalog is
 * persisted to a small JSON file in app-private storage so the
 * MediaPlaybackService (which can be started independently by the
 * car head unit, without the RN app having to be running) can read
 * it at any time.
 */
class AndroidAutoCatalogModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AndroidAutoCatalog"

    /**
     * @param json A JSON string shaped as:
     * { "categories": [ { "id": string, "title": string, "tracks": [
     *     { "id": string, "title": string, "subtitle": string|null,
     *       "mediaUrl": string, "artworkUrl": string|null } ] } ] }
     */
    @ReactMethod
    fun publishCatalog(json: String, promise: Promise) {
        try {
            val file = File(reactApplicationContext.filesDir, CATALOG_FILE_NAME)
            file.writeText(json)
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("ANDROID_AUTO_CATALOG_ERROR", error.message, error)
        }
    }

    @ReactMethod
    fun clearCatalog(promise: Promise) {
        try {
            val file = File(reactApplicationContext.filesDir, CATALOG_FILE_NAME)
            if (file.exists()) file.delete()
            promise.resolve(true)
        } catch (error: Exception) {
            promise.reject("ANDROID_AUTO_CATALOG_ERROR", error.message, error)
        }
    }

    companion object {
        private const val CATALOG_FILE_NAME = "android_auto_catalog.json"
    }
}
