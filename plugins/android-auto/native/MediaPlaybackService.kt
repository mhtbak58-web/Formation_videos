package com.formationvideos.app.androidauto

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.support.v4.media.MediaBrowserCompat.MediaItem
import android.support.v4.media.MediaDescriptionCompat
import android.support.v4.media.MediaMetadataCompat
import android.support.v4.media.session.MediaSessionCompat
import android.support.v4.media.session.PlaybackStateCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.ServiceCompat
import androidx.media.MediaBrowserServiceCompat
import androidx.media.app.NotificationCompat.MediaStyle
import androidx.media.session.MediaButtonReceiver
import org.json.JSONObject
import java.io.File

/**
 * Minimal, dependency-free Android Auto media browser/playback service.
 *
 * It reads a JSON catalog written by the React Native side (see
 * AndroidAutoCatalogModule) and exposes it as a browsable tree of
 * categories -> tracks, then plays the selected track's URL as audio
 * via the plain Android MediaPlayer API.
 *
 * This intentionally has no dependency on react-native-track-player or
 * any other third-party audio library: only AndroidX `media` (the
 * standard Jetpack library that Android Auto itself is built on).
 */
class MediaPlaybackService : MediaBrowserServiceCompat() {

    data class AutoTrack(
        val id: String,
        val title: String,
        val subtitle: String?,
        val mediaUrl: String,
        val artworkUrl: String?
    )

    data class AutoCategory(
        val id: String,
        val title: String,
        val tracks: List<AutoTrack>
    )

    private lateinit var mediaSession: MediaSessionCompat
    private var mediaPlayer: MediaPlayer? = null
    private var categories: List<AutoCategory> = emptyList()
    private var currentTrack: AutoTrack? = null
    private var isForeground = false

    private val sessionCallback = object : MediaSessionCompat.Callback() {
        override fun onPlayFromMediaId(mediaId: String?, extras: Bundle?) {
            loadCatalog()
            val track = mediaId?.let { findTrack(it) } ?: return
            playTrack(track)
        }

        override fun onPlay() {
            val player = mediaPlayer
            if (player != null) {
                player.start()
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING)
                showPlaybackNotification(isPlaying = true)
            } else {
                loadCatalog()
                categories.firstOrNull()?.tracks?.firstOrNull()?.let { playTrack(it) }
            }
        }

        override fun onPause() {
            mediaPlayer?.pause()
            updatePlaybackState(PlaybackStateCompat.STATE_PAUSED)
            showPlaybackNotification(isPlaying = false)
        }

        override fun onStop() {
            mediaPlayer?.stop()
            updatePlaybackState(PlaybackStateCompat.STATE_STOPPED)
            stopForegroundPlayback()
        }

        override fun onSkipToNext() = skip(1)

        override fun onSkipToPrevious() = skip(-1)

        override fun onSeekTo(pos: Long) {
            mediaPlayer?.seekTo(pos.toInt())
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        mediaSession = MediaSessionCompat(this, "FormationVideosMediaSession").apply {
            setFlags(
                MediaSessionCompat.FLAG_HANDLES_MEDIA_BUTTONS or
                    MediaSessionCompat.FLAG_HANDLES_TRANSPORT_CONTROLS
            )
            setCallback(sessionCallback)
            setPlaybackState(
                PlaybackStateCompat.Builder()
                    .setActions(PlaybackStateCompat.ACTION_PLAY or PlaybackStateCompat.ACTION_PLAY_PAUSE)
                    .setState(PlaybackStateCompat.STATE_NONE, 0, 1f)
                    .build()
            )
        }

        sessionToken = mediaSession.sessionToken
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        MediaButtonReceiver.handleIntent(mediaSession, intent)
        return super.onStartCommand(intent, flags, startId)
    }

    override fun onGetRoot(clientPackageName: String, clientUid: Int, rootHints: Bundle?): BrowserRoot {
        return BrowserRoot(ROOT_ID, null)
    }

    override fun onLoadChildren(parentId: String, result: Result<MutableList<MediaItem>>) {
        loadCatalog()

        if (parentId == ROOT_ID) {
            val items = categories.map { category ->
                MediaItem(
                    MediaDescriptionCompat.Builder()
                        .setMediaId(category.id)
                        .setTitle(category.title)
                        .build(),
                    MediaItem.FLAG_BROWSABLE
                )
            }.toMutableList()
            result.sendResult(items)
            return
        }

        val category = categories.find { it.id == parentId }
        if (category == null) {
            result.sendResult(mutableListOf())
            return
        }

        val items = category.tracks.map { track ->
            MediaItem(
                MediaDescriptionCompat.Builder()
                    .setMediaId(track.id)
                    .setTitle(track.title)
                    .setSubtitle(track.subtitle)
                    .setIconUri(track.artworkUrl?.let { Uri.parse(it) })
                    .build(),
                MediaItem.FLAG_PLAYABLE
            )
        }.toMutableList()
        result.sendResult(items)
    }

    override fun onDestroy() {
        mediaPlayer?.release()
        mediaPlayer = null
        mediaSession.release()
        super.onDestroy()
    }

    private fun loadCatalog() {
        try {
            val file = File(filesDir, CATALOG_FILE_NAME)
            if (!file.exists()) {
                categories = emptyList()
                return
            }

            val json = JSONObject(file.readText())
            val categoriesJson = json.getJSONArray("categories")
            val parsed = mutableListOf<AutoCategory>()

            for (i in 0 until categoriesJson.length()) {
                val categoryJson = categoriesJson.getJSONObject(i)
                val tracksJson = categoryJson.getJSONArray("tracks")
                val tracks = mutableListOf<AutoTrack>()

                for (j in 0 until tracksJson.length()) {
                    val trackJson = tracksJson.getJSONObject(j)
                    tracks.add(
                        AutoTrack(
                            id = trackJson.getString("id"),
                            title = trackJson.getString("title"),
                            subtitle = if (trackJson.isNull("subtitle")) null else trackJson.optString("subtitle"),
                            mediaUrl = trackJson.getString("mediaUrl"),
                            artworkUrl = if (trackJson.isNull("artworkUrl")) null else trackJson.optString("artworkUrl")
                        )
                    )
                }

                parsed.add(
                    AutoCategory(
                        id = categoryJson.getString("id"),
                        title = categoryJson.getString("title"),
                        tracks = tracks
                    )
                )
            }

            categories = parsed
        } catch (error: Exception) {
            categories = emptyList()
        }
    }

    private fun findTrack(mediaId: String): AutoTrack? {
        for (category in categories) {
            val track = category.tracks.find { it.id == mediaId }
            if (track != null) return track
        }
        return null
    }

    private fun skip(direction: Int) {
        val track = currentTrack ?: return
        val flatTracks = categories.flatMap { it.tracks }
        val index = flatTracks.indexOfFirst { it.id == track.id }
        if (index == -1) return
        val nextIndex = index + direction
        if (nextIndex in flatTracks.indices) {
            playTrack(flatTracks[nextIndex])
        }
    }

    private fun playTrack(track: AutoTrack) {
        currentTrack = track

        mediaPlayer?.release()
        mediaPlayer = MediaPlayer().apply {
            @Suppress("DEPRECATION")
            setAudioStreamType(AudioManager.STREAM_MUSIC)
            setDataSource(track.mediaUrl)
            setOnPreparedListener {
                it.start()
                updatePlaybackState(PlaybackStateCompat.STATE_PLAYING)
                showPlaybackNotification(isPlaying = true)
            }
            setOnCompletionListener { skip(1) }
            setOnErrorListener { _, _, _ ->
                updatePlaybackState(PlaybackStateCompat.STATE_ERROR)
                true
            }
            prepareAsync()
        }

        mediaSession.setMetadata(
            MediaMetadataCompat.Builder()
                .putString(MediaMetadataCompat.METADATA_KEY_MEDIA_ID, track.id)
                .putString(MediaMetadataCompat.METADATA_KEY_TITLE, track.title)
                .putString(MediaMetadataCompat.METADATA_KEY_ARTIST, track.subtitle ?: "")
                .build()
        )
        mediaSession.isActive = true
        updatePlaybackState(PlaybackStateCompat.STATE_BUFFERING)
    }

    private fun updatePlaybackState(state: Int) {
        val position = try {
            mediaPlayer?.currentPosition?.toLong() ?: 0L
        } catch (error: Exception) {
            0L
        }

        mediaSession.setPlaybackState(
            PlaybackStateCompat.Builder()
                .setActions(
                    PlaybackStateCompat.ACTION_PLAY or
                        PlaybackStateCompat.ACTION_PAUSE or
                        PlaybackStateCompat.ACTION_PLAY_PAUSE or
                        PlaybackStateCompat.ACTION_SKIP_TO_NEXT or
                        PlaybackStateCompat.ACTION_SKIP_TO_PREVIOUS or
                        PlaybackStateCompat.ACTION_PLAY_FROM_MEDIA_ID or
                        PlaybackStateCompat.ACTION_SEEK_TO
                )
                .setState(state, position, 1f)
                .build()
        )
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return

        val manager = getSystemService(NotificationManager::class.java)
        val channel = NotificationChannel(
            NOTIFICATION_CHANNEL_ID,
            "Lecture audio",
            NotificationManager.IMPORTANCE_LOW
        )
        manager?.createNotificationChannel(channel)
    }

    private fun buildNotification(track: MediaPlaybackService.AutoTrack, isPlaying: Boolean): Notification {
        val playPauseAction = if (isPlaying) {
            NotificationCompat.Action(
                android.R.drawable.ic_media_pause,
                "Pause",
                MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_PAUSE)
            )
        } else {
            NotificationCompat.Action(
                android.R.drawable.ic_media_play,
                "Lecture",
                MediaButtonReceiver.buildMediaButtonPendingIntent(this, PlaybackStateCompat.ACTION_PLAY)
            )
        }

        return NotificationCompat.Builder(this, NOTIFICATION_CHANNEL_ID)
            .setContentTitle(track.title)
            .setContentText(track.subtitle ?: "Formation Videos")
            .setSmallIcon(applicationInfo.icon)
            .setOnlyAlertOnce(true)
            .addAction(playPauseAction)
            .setStyle(
                MediaStyle()
                    .setMediaSession(mediaSession.sessionToken)
                    .setShowActionsInCompactView(0)
            )
            .build()
    }

    private fun showPlaybackNotification(isPlaying: Boolean) {
        val track = currentTrack ?: return
        val notification = buildNotification(track, isPlaying)

        if (!isForeground) {
            ServiceCompat.startForeground(
                this,
                NOTIFICATION_ID,
                notification,
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                } else {
                    0
                }
            )
            isForeground = true
        } else {
            val manager = getSystemService(NotificationManager::class.java)
            manager?.notify(NOTIFICATION_ID, notification)
        }
    }

    private fun stopForegroundPlayback() {
        if (isForeground) {
            ServiceCompat.stopForeground(this, ServiceCompat.STOP_FOREGROUND_REMOVE)
            isForeground = false
        }
    }

    companion object {
        private const val ROOT_ID = "root"
        private const val CATALOG_FILE_NAME = "android_auto_catalog.json"
        private const val NOTIFICATION_CHANNEL_ID = "android_auto_playback"
        private const val NOTIFICATION_ID = 1138
    }
}
