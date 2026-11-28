package com.familyshopping.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.ColorScheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

enum class ThemeMode(val id: String) {
    SYSTEM("system"),
    LIGHT("light"),
    DARK("dark");

    companion object {
        fun fromId(id: String?): ThemeMode = entries.find { it.id == id } ?: SYSTEM
    }
}

enum class AppColorSchemeId(val id: String, val previewLight: Color, val previewDark: Color) {
    GRAPHITE("graphite", Color(0xFF27272A), Color(0xFFD4D4D8)),
    SAGE("sage", Color(0xFF2D4F3E), Color(0xFF8AB89E)),
    OCEAN("ocean", Color(0xFF234766), Color(0xFF8BB7DC)),
    SAND("sand", Color(0xFF6B4E3B), Color(0xFFD2B29C)),
    LAVENDER("lavender", Color(0xFF4B3F6B), Color(0xFFB9AADF));

    companion object {
        fun fromId(id: String?): AppColorSchemeId = entries.find { it.id == id } ?: GRAPHITE
    }
}

@Immutable
data class AppExtendedColors(
    val isDark: Boolean,
    val cardSurface: Color,
    val cardCompletedSurface: Color,
    val cardBorder: Color,
    val infoCardSurface: Color,
    val titleText: Color,
    val mutedText: Color,
    val subtleText: Color,
    val dividerColor: Color,
    val accentSuccess: Color,
    val accentWarning: Color,
    val accentError: Color,
    val urgentBadgeBg: Color,
    val urgentBadgeText: Color,
    val fabContainer: Color,
    val fabContent: Color,
    val primaryButtonBg: Color,
    val primaryButtonContent: Color
)

private val LightDefaultExtended = AppExtendedColors(
    isDark = false,
    cardSurface = Color.White,
    cardCompletedSurface = Color(0xFFF4F4F5),
    cardBorder = Color(0xFFE4E4E7),
    infoCardSurface = Color(0xFFF4F4F5),
    titleText = Color(0xFF18181B),
    mutedText = Color(0xFF52525B),
    subtleText = Color(0xFF71717A),
    dividerColor = Color(0xFFE4E4E7),
    accentSuccess = Color(0xFF059669),
    accentWarning = Color(0xFFD97706),
    accentError = Color(0xFFDC2626),
    urgentBadgeBg = Color(0xFFFFE4E6),
    urgentBadgeText = Color(0xFFE11D48),
    fabContainer = Color(0xFF18181B),
    fabContent = Color.White,
    primaryButtonBg = Color(0xFF18181B),
    primaryButtonContent = Color.White
)

private val DarkDefaultExtended = AppExtendedColors(
    isDark = true,
    cardSurface = Color(0xFF1B1C20),
    cardCompletedSurface = Color(0xFF151619),
    cardBorder = Color(0xFF2C2E35),
    infoCardSurface = Color(0xFF202227),
    titleText = Color(0xFFF4F4F5),
    mutedText = Color(0xFFD4D4D8),
    subtleText = Color(0xFFA1A1AA),
    dividerColor = Color(0xFF2C2E35),
    accentSuccess = Color(0xFF34D399),
    accentWarning = Color(0xFFFBBF24),
    accentError = Color(0xFFF87171),
    urgentBadgeBg = Color(0xFF4C1D28),
    urgentBadgeText = Color(0xFFFDA4AF),
    fabContainer = Color(0xFFE4E4E7),
    fabContent = Color(0xFF18181B),
    primaryButtonBg = Color(0xFFE4E4E7),
    primaryButtonContent = Color(0xFF18181B)
)

val LocalAppExtendedColors = staticCompositionLocalOf { LightDefaultExtended }

private fun buildMaterialColorScheme(schemeId: AppColorSchemeId, isDark: Boolean): ColorScheme {
    return when (schemeId) {
        AppColorSchemeId.GRAPHITE -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFE4E4E7),
                onPrimary = Color(0xFF18181B),
                secondary = Color(0xFF34D399),
                background = Color(0xFF111214),
                surface = Color(0xFF18191D),
                surfaceVariant = Color(0xFF23252A),
                onBackground = Color(0xFFF4F4F5),
                onSurface = Color(0xFFF4F4F5),
                onSurfaceVariant = Color(0xFFA1A1AA),
                outline = Color(0xFF3F3F46)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF18181B),
                onPrimary = Color.White,
                secondary = Color(0xFF059669),
                background = Color(0xFFFAFAFA),
                surface = Color.White,
                surfaceVariant = Color(0xFFF4F4F5),
                onBackground = Color(0xFF18181B),
                onSurface = Color(0xFF18181B),
                onSurfaceVariant = Color(0xFF71717A),
                outline = Color(0xFFD4D4D8)
            )
        }

        AppColorSchemeId.SAGE -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFF9BC4AE),
                onPrimary = Color(0xFF102219),
                secondary = Color(0xFF6EE7B7),
                background = Color(0xFF0E1411),
                surface = Color(0xFF151E1A),
                surfaceVariant = Color(0xFF1F2B25),
                onBackground = Color(0xFFECF2EE),
                onSurface = Color(0xFFECF2EE),
                onSurfaceVariant = Color(0xFF9FB3A8),
                outline = Color(0xFF2F4037)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF2D4F3E),
                onPrimary = Color.White,
                secondary = Color(0xFF059669),
                background = Color(0xFFF6F9F7),
                surface = Color.White,
                surfaceVariant = Color(0xFFEAF1ED),
                onBackground = Color(0xFF18241E),
                onSurface = Color(0xFF18241E),
                onSurfaceVariant = Color(0xFF5B6E63),
                outline = Color(0xFFC8D7CE)
            )
        }

        AppColorSchemeId.OCEAN -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFF99BFE0),
                onPrimary = Color(0xFF0E2030),
                secondary = Color(0xFF38BDF8),
                background = Color(0xFF0E1318),
                surface = Color(0xFF151C24),
                surfaceVariant = Color(0xFF1E2833),
                onBackground = Color(0xFFECF1F7),
                onSurface = Color(0xFFECF1F7),
                onSurfaceVariant = Color(0xFF9AAEC2),
                outline = Color(0xFF2D3C4B)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF234766),
                onPrimary = Color.White,
                secondary = Color(0xFF0284C7),
                background = Color(0xFFF5F8FB),
                surface = Color.White,
                surfaceVariant = Color(0xFFE8EFF6),
                onBackground = Color(0xFF17222D),
                onSurface = Color(0xFF17222D),
                onSurfaceVariant = Color(0xFF5A6D7E),
                outline = Color(0xFFC7D5E2)
            )
        }

        AppColorSchemeId.SAND -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFD6B8A3),
                onPrimary = Color(0xFF281B12),
                secondary = Color(0xFFFBBF24),
                background = Color(0xFF15120F),
                surface = Color(0xFF1E1915),
                surfaceVariant = Color(0xFF29221D),
                onBackground = Color(0xFFF5EFEA),
                onSurface = Color(0xFFF5EFEA),
                onSurfaceVariant = Color(0xFFB8A99D),
                outline = Color(0xFF3F352D)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF5C4332),
                onPrimary = Color.White,
                secondary = Color(0xFFD97706),
                background = Color(0xFFFAF7F3),
                surface = Color.White,
                surfaceVariant = Color(0xFFF1EAE2),
                onBackground = Color(0xFF261E18),
                onSurface = Color(0xFF261E18),
                onSurfaceVariant = Color(0xFF756559),
                outline = Color(0xFFDDD1C5)
            )
        }

        AppColorSchemeId.LAVENDER -> if (isDark) {
            darkColorScheme(
                primary = Color(0xFFBEB0E0),
                onPrimary = Color(0xFF1E1730),
                secondary = Color(0xFFA78BFA),
                background = Color(0xFF121018),
                surface = Color(0xFF1A1723),
                surfaceVariant = Color(0xFF242030),
                onBackground = Color(0xFFF1EEF8),
                onSurface = Color(0xFFF1EEF8),
                onSurfaceVariant = Color(0xFFA9A0BE),
                outline = Color(0xFF363047)
            )
        } else {
            lightColorScheme(
                primary = Color(0xFF463A63),
                onPrimary = Color.White,
                secondary = Color(0xFF7C3AED),
                background = Color(0xFFF8F7FB),
                surface = Color.White,
                surfaceVariant = Color(0xFFEDEAF6),
                onBackground = Color(0xFF1E1A29),
                onSurface = Color(0xFF1E1A29),
                onSurfaceVariant = Color(0xFF665E7A),
                outline = Color(0xFFD4CDE4)
            )
        }
    }
}

private fun buildExtendedColors(schemeId: AppColorSchemeId, isDark: Boolean): AppExtendedColors {
    val base = if (isDark) DarkDefaultExtended else LightDefaultExtended
    val mat = buildMaterialColorScheme(schemeId, isDark)
    return base.copy(
        cardSurface = mat.surface,
        cardCompletedSurface = mat.surfaceVariant,
        cardBorder = mat.outline.copy(alpha = if (isDark) 0.55f else 0.65f),
        infoCardSurface = mat.surfaceVariant,
        titleText = mat.onSurface,
        mutedText = mat.onSurface.copy(alpha = 0.78f),
        subtleText = mat.onSurfaceVariant,
        dividerColor = mat.outline.copy(alpha = 0.45f),
        fabContainer = mat.primary,
        fabContent = mat.onPrimary,
        primaryButtonBg = mat.primary,
        primaryButtonContent = mat.onPrimary
    )
}

@Composable
fun FamilyShoppingTheme(
    themeModeId: String,
    colorSchemeId: String,
    content: @Composable () -> Unit
) {
    val mode = ThemeMode.fromId(themeModeId)
    val scheme = AppColorSchemeId.fromId(colorSchemeId)
    val systemDark = isSystemInDarkTheme()
    val isDark = when (mode) {
        ThemeMode.SYSTEM -> systemDark
        ThemeMode.LIGHT -> false
        ThemeMode.DARK -> true
    }

    val materialColors = buildMaterialColorScheme(scheme, isDark)
    val extendedColors = buildExtendedColors(scheme, isDark)

    CompositionLocalProvider(LocalAppExtendedColors provides extendedColors) {
        MaterialTheme(
            colorScheme = materialColors,
            content = content
        )
    }
}
