package com.familyshopping.app.ui.screens

import android.net.Uri
import android.util.Base64
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.R
import com.familyshopping.app.data.model.FirebaseConfig
import com.familyshopping.app.ui.AppStrings
import com.familyshopping.app.ui.theme.AppColorSchemeId
import com.familyshopping.app.ui.theme.LocalAppExtendedColors
import com.familyshopping.app.ui.theme.ThemeMode
import com.google.mlkit.vision.barcode.common.Barcode
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
import kotlinx.coroutines.launch
import org.json.JSONObject

@OptIn(ExperimentalMaterial3Api::class, ExperimentalLayoutApi::class)
@Composable
fun SettingsScreen(
    currentConfig: FirebaseConfig,
    currentLanguage: String,
    currentThemeMode: String,
    currentColorSchemeId: String,
    showAddedBy: Boolean,
    showTimestamps: Boolean,
    categoryBackgroundsEnabled: Boolean,
    currentUserName: String,
    onChangeLanguage: (String) -> Unit,
    onChangeThemeMode: (String) -> Unit,
    onChangeColorScheme: (String) -> Unit,
    onChangeShowAddedBy: (Boolean) -> Unit,
    onChangeShowTimestamps: (Boolean) -> Unit,
    onChangeCategoryBackgrounds: (Boolean) -> Unit,
    onChangeUserName: (String) -> Unit,
    onTestConfig: suspend (FirebaseConfig) -> Result<String>,
    onSaveConfig: (FirebaseConfig) -> Unit,
    onBack: () -> Unit
) {
    val context = LocalContext.current
    val extended = LocalAppExtendedColors.current
    val appVersion = remember(context) {
        try {
            @Suppress("DEPRECATION")
            context.packageManager.getPackageInfo(context.packageName, 0).versionName ?: "1.1.0"
        } catch (_: Exception) {
            "1.1.0"
        }
    }
    var apiKey by remember { mutableStateOf(currentConfig.apiKey) }
    var projectId by remember { mutableStateOf(currentConfig.projectId) }
    var appId by remember { mutableStateOf(currentConfig.appId) }
    var storageBucket by remember { mutableStateOf(currentConfig.storageBucket) }
    var groupId by remember { mutableStateOf(currentConfig.groupId) }
    var userNameInput by remember { mutableStateOf(currentUserName) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isError by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun buildConfig(): FirebaseConfig = FirebaseConfig(
        apiKey = apiKey.trim(),
        projectId = projectId.trim(),
        appId = appId.trim(),
        storageBucket = storageBucket.trim(),
        groupId = groupId.trim().ifBlank { "default-family" },
        isConfigured = apiKey.isNotBlank() && projectId.isNotBlank() && appId.isNotBlank()
    )

    fun saveAndConnect(cfg: FirebaseConfig, closeOnSuccess: Boolean) {
        onChangeUserName(userNameInput)
        val hasAnyKey = cfg.apiKey.isNotBlank() || cfg.projectId.isNotBlank() || cfg.appId.isNotBlank()
        if (hasAnyKey && !cfg.isConfigured) {
            isError = true
            statusMessage = AppStrings.partialKeysError(currentLanguage)
            return
        }
        if (!cfg.isConfigured) {
            onSaveConfig(cfg)
            isError = false
            if (closeOnSuccess) {
                onBack()
            } else {
                statusMessage = when (currentLanguage) {
                    "ru" -> "Сохранено (Локальный режим)"
                    "en" -> "Saved (Local Mode)"
                    else -> "Збережено (Локальний режим)"
                }
            }
            return
        }

        isSaving = true
        isError = false
        statusMessage = AppStrings.connectingStatus(currentLanguage)
        scope.launch {
            onTestConfig(cfg)
                .onSuccess { msg ->
                    onSaveConfig(cfg)
                    isSaving = false
                    isError = false
                    statusMessage = msg
                    if (closeOnSuccess) {
                        onBack()
                    }
                }
                .onFailure { err ->
                    isSaving = false
                    isError = true
                    statusMessage = err.message ?: "Connection failed"
                }
        }
    }

    fun applyRawPairingPayload(raw: String) {
        try {
            val trimmed = raw.trim()
            val jsonText = if (trimmed.contains("fc=")) {
                val token = Uri.parse(trimmed).getQueryParameter("fc")
                    ?: trimmed.substringAfter("fc=").substringBefore("&")
                val decodedBytes = Base64.decode(
                    token,
                    Base64.URL_SAFE or Base64.NO_PADDING or Base64.NO_WRAP
                )
                String(decodedBytes, Charsets.UTF_8)
            } else {
                trimmed
            }

            val obj = JSONObject(jsonText)
            val scannedApiKey = obj.optString("apiKey", "").trim()
            val scannedProjectId = obj.optString("projectId", "").trim()
            val scannedAppId = obj.optString("appId", "").trim()
            val scannedBucket = obj.optString("storageBucket", "").trim()
            val scannedGroupId = obj.optString("groupId", "my-family").trim().ifBlank { "my-family" }

            apiKey = scannedApiKey
            projectId = scannedProjectId
            appId = scannedAppId
            storageBucket = scannedBucket
            groupId = scannedGroupId

            val newCfg = FirebaseConfig(
                apiKey = scannedApiKey,
                projectId = scannedProjectId,
                appId = scannedAppId,
                storageBucket = scannedBucket,
                groupId = scannedGroupId,
                isConfigured = scannedApiKey.isNotBlank() && scannedProjectId.isNotBlank() && scannedAppId.isNotBlank()
            )
            if (newCfg.isConfigured) {
                saveAndConnect(newCfg, closeOnSuccess = true)
            } else {
                onSaveConfig(newCfg)
                isError = false
                statusMessage = "QR imported group \"$scannedGroupId\" (enter Firebase keys on PC first for cloud sync)"
            }
        } catch (e: Exception) {
            isError = true
            statusMessage = "Invalid QR pairing data: ${e.localizedMessage ?: "unknown format"}"
        }
    }

    fun startQrScan() {
        val options = GmsBarcodeScannerOptions.Builder()
            .setBarcodeFormats(Barcode.FORMAT_QR_CODE)
            .enableAutoZoom()
            .build()
        val scanner = GmsBarcodeScanning.getClient(context, options)
        scanner.startScan()
            .addOnSuccessListener { barcode ->
                val raw = barcode.rawValue
                if (!raw.isNullOrBlank()) {
                    applyRawPairingPayload(raw)
                } else {
                    isError = true
                    statusMessage = "Empty QR code"
                }
            }
            .addOnFailureListener { err ->
                isError = true
                statusMessage = "QR scanner error: ${err.localizedMessage ?: "Google Play Services required"}"
            }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(AppStrings.settingsTitle(currentLanguage), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = {
                        onChangeUserName(userNameInput)
                        onBack()
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Language Selector Card
            Card(
                colors = CardDefaults.cardColors(containerColor = extended.infoCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = AppStrings.languageLabel(currentLanguage),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = extended.titleText
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        listOf(
                            "uk" to "Українська",
                            "ru" to "Русский",
                            "en" to "English"
                        ).forEach { (code, label) ->
                            FilterChip(
                                selected = currentLanguage == code,
                                onClick = { onChangeLanguage(code) },
                                label = { Text(label, fontSize = 12.sp) }
                            )
                        }
                    }
                }
            }

            // Theme & Color Scheme Card
            Card(
                colors = CardDefaults.cardColors(containerColor = extended.infoCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = AppStrings.appearanceTitle(currentLanguage),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = extended.titleText
                    )
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        listOf(
                            ThemeMode.SYSTEM.id to AppStrings.themeSystem(currentLanguage),
                            ThemeMode.LIGHT.id to AppStrings.themeLight(currentLanguage),
                            ThemeMode.DARK.id to AppStrings.themeDark(currentLanguage)
                        ).forEach { (modeId, label) ->
                            FilterChip(
                                selected = currentThemeMode == modeId,
                                onClick = { onChangeThemeMode(modeId) },
                                label = { Text(label, fontSize = 12.sp) }
                            )
                        }
                    }

                    HorizontalDivider(color = extended.dividerColor)

                    Text(
                        text = AppStrings.colorSchemeTitle(currentLanguage),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = extended.titleText
                    )
                    FlowRow(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        AppColorSchemeId.entries.forEach { scheme ->
                            val dotColor = if (extended.isDark) scheme.previewDark else scheme.previewLight
                            FilterChip(
                                selected = currentColorSchemeId == scheme.id,
                                onClick = { onChangeColorScheme(scheme.id) },
                                leadingIcon = {
                                    Box(
                                        modifier = Modifier
                                            .size(12.dp)
                                            .clip(CircleShape)
                                            .background(dotColor)
                                    )
                                },
                                label = {
                                    Text(
                                        AppStrings.colorSchemeName(scheme.id, currentLanguage),
                                        fontSize = 12.sp
                                    )
                                }
                            )
                        }
                    }
                }
            }

            // Card Display Options
            Card(
                colors = CardDefaults.cardColors(containerColor = extended.infoCardSurface),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(12.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Text(
                        text = AppStrings.listDisplayTitle(currentLanguage),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp,
                        color = extended.titleText
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = AppStrings.showAddedByLabel(currentLanguage),
                            fontSize = 13.sp,
                            color = extended.titleText,
                            modifier = Modifier
                                .weight(1f)
                                .padding(end = 8.dp)
                        )
                        Switch(
                            checked = showAddedBy,
                            onCheckedChange = onChangeShowAddedBy
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = AppStrings.showTimestampsLabel(currentLanguage),
                            fontSize = 13.sp,
                            color = extended.titleText,
                            modifier = Modifier
                                .weight(1f)
                                .padding(end = 8.dp)
                        )
                        Switch(
                            checked = showTimestamps,
                            onCheckedChange = onChangeShowTimestamps
                        )
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = AppStrings.categoryBackgroundsLabel(currentLanguage),
                            fontSize = 13.sp,
                            color = extended.titleText,
                            modifier = Modifier
                                .weight(1f)
                                .padding(end = 8.dp)
                        )
                        Switch(
                            checked = categoryBackgroundsEnabled,
                            onCheckedChange = onChangeCategoryBackgrounds
                        )
                    }

                    Spacer(modifier = Modifier.height(2.dp))
                    OutlinedTextField(
                        value = userNameInput,
                        onValueChange = {
                            userNameInput = it
                            onChangeUserName(it)
                        },
                        label = { Text(AppStrings.userNameLabel(currentLanguage)) },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Button(
                onClick = { startQrScan() },
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = extended.accentSuccess,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(10.dp)
            ) {
                Icon(Icons.Default.QrCodeScanner, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(AppStrings.scanQrLabel(currentLanguage))
            }

            Card(
                colors = CardDefaults.cardColors(containerColor = extended.infoCardSurface),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = AppStrings.groupIsolationTitle(currentLanguage),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = extended.titleText
                    )
                    Text(
                        text = AppStrings.groupIsolationDesc(currentLanguage),
                        fontSize = 12.sp,
                        color = extended.mutedText
                    )
                }
            }

            OutlinedTextField(
                value = groupId,
                onValueChange = { groupId = it },
                label = { Text("Family / Group ID") },
                placeholder = { Text("e.g. smith-household") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = projectId,
                onValueChange = { projectId = it },
                label = { Text("Firebase Project ID") },
                placeholder = { Text("my-family-cart-12345") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = apiKey,
                onValueChange = { apiKey = it },
                label = { Text("API Key") },
                placeholder = { Text("AIzaSy...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = appId,
                onValueChange = { appId = it },
                label = { Text("App ID") },
                placeholder = { Text("1:123456789:web:abcdef") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = storageBucket,
                onValueChange = { storageBucket = it },
                label = { Text("Storage Bucket (Optional)") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )

            Spacer(modifier = Modifier.height(4.dp))

            OutlinedButton(
                onClick = {
                    val cfg = buildConfig()
                    statusMessage = "Testing connection..."
                    isError = false
                    scope.launch {
                        onTestConfig(cfg)
                            .onSuccess { msg ->
                                statusMessage = msg
                                isError = false
                            }
                            .onFailure { err ->
                                statusMessage = err.message ?: "Connection failed"
                                isError = true
                            }
                    }
                },
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(AppStrings.testConnectionBtn(currentLanguage))
            }

            Button(
                onClick = { saveAndConnect(buildConfig(), closeOnSuccess = true) },
                enabled = !isSaving,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Icon(Icons.Default.Check, contentDescription = null)
                }
                Spacer(modifier = Modifier.width(6.dp))
                Text(AppStrings.saveBtn(currentLanguage))
            }

            statusMessage?.let { msg ->
                Text(
                    text = msg,
                    color = if (isError) extended.accentError else extended.accentSuccess,
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.sp
                )
            }

            Spacer(modifier = Modifier.height(12.dp))
            Text(
                text = "${stringResource(R.string.app_name)} · v$appVersion",
                fontSize = 12.sp,
                color = extended.subtleText
            )
        }
    }
}
