package com.familyshopping.app.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
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
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.familyshopping.app.data.model.ShoppingTemplate
import com.familyshopping.app.ui.AppStrings
import com.familyshopping.app.ui.theme.LocalAppExtendedColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WeekendTemplateScreen(
    templates: List<ShoppingTemplate>,
    lang: String,
    onApplyTemplate: (ShoppingTemplate, Boolean) -> Unit,
    onBack: () -> Unit
) {
    val extended = LocalAppExtendedColors.current

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(AppStrings.weekendMasterTitle(lang), fontWeight = FontWeight.SemiBold) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            items(templates, key = { it.id }) { template ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = extended.cardSurface),
                    elevation = CardDefaults.cardElevation(defaultElevation = if (extended.isDark) 0.dp else 1.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(template.icon, fontSize = 26.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    template.name,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 16.sp,
                                    color = extended.titleText
                                )
                                Text(
                                    text = "${template.items.size} items • ${template.tag}",
                                    fontSize = 12.sp,
                                    color = extended.subtleText
                                )
                            }
                        }

                        Spacer(modifier = Modifier.height(8.dp))
                        Text(template.description, fontSize = 13.sp, color = extended.mutedText)

                        Spacer(modifier = Modifier.height(10.dp))
                        val previewText = template.items.take(5).joinToString(", ") { it.title } +
                            if (template.items.size > 5) " +${template.items.size - 5}" else ""
                        Text(
                            text = previewText,
                            fontSize = 12.sp,
                            color = MaterialTheme.colorScheme.primary
                        )

                        Spacer(modifier = Modifier.height(14.dp))
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            OutlinedButton(
                                onClick = { onApplyTemplate(template, false) },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text(AppStrings.replaceBtn(lang), fontSize = 12.sp)
                            }
                            Button(
                                onClick = { onApplyTemplate(template, true) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.primary,
                                    contentColor = MaterialTheme.colorScheme.onPrimary
                                )
                            ) {
                                Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(AppStrings.mergeBtn(lang), fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
