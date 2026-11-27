package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.R
import com.familyshopping.app.data.model.FirebaseConfig
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    currentConfig: FirebaseConfig,
    onTestConfig: suspend (FirebaseConfig) -> Result<String>,
    onSaveConfig: (FirebaseConfig) -> Unit,
    onBack: () -> Unit
) {
    var apiKey by remember { mutableStateOf(currentConfig.apiKey) }
    var projectId by remember { mutableStateOf(currentConfig.projectId) }
    var appId by remember { mutableStateOf(currentConfig.appId) }
    var storageBucket by remember { mutableStateOf(currentConfig.storageBucket) }
    var groupId by remember { mutableStateOf(currentConfig.groupId) }
    var statusMessage by remember { mutableStateOf<String?>(null) }
    var isError by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()

    fun buildConfig(): FirebaseConfig = FirebaseConfig(
        apiKey = apiKey.trim(),
        projectId = projectId.trim(),
        appId = appId.trim(),
        storageBucket = storageBucket.trim(),
        groupId = groupId.trim().ifBlank { "default-family" },
        isConfigured = apiKey.isNotBlank() && projectId.isNotBlank() && appId.isNotBlank()
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.title_settings), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
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
            Card(
                colors = CardDefaults.cardColors(containerColor = Color(0xFFF4F4F5)),
                shape = RoundedCornerShape(10.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp)) {
                    Text(
                        text = "Family Group Isolation",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp,
                        color = Color(0xFF18181B)
                    )
                    Text(
                        text = "Enter the same Firebase Project & Group ID on Web and Android to sync your family list in real time.",
                        fontSize = 12.sp,
                        color = Color(0xFF52525B)
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
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Test Connection")
            }

            Button(
                onClick = {
                    val newConfig = buildConfig()
                    onSaveConfig(newConfig)
                    isError = false
                    statusMessage = if (newConfig.isConfigured) "Saved & connected!" else "Saved (Local Mode)"
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF18181B))
            ) {
                Icon(Icons.Default.Check, contentDescription = null)
                Spacer(modifier = Modifier.width(6.dp))
                Text(stringResource(R.string.action_save))
            }

            statusMessage?.let { msg ->
                Text(
                    text = msg,
                    color = if (isError) Color(0xFFDC2626) else Color(0xFF059669),
                    fontWeight = FontWeight.Medium,
                    fontSize = 13.sp
                )
            }
        }
    }
}
