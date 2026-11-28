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
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.lerp
import com.familyshopping.app.data.model.Category
import kotlin.math.abs

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

enum class GradientDirection {
    LEFT_TO_RIGHT,
    TOP_TO_BOTTOM,
    TOP_LEFT_TO_BOTTOM_RIGHT,
    BOTTOM_LEFT_TO_TOP_RIGHT,
    CENTER_GLOW,
    RADIAL_CORNER
}

data class CategoryGradientSpec(
    val colors: List<Color>,
    val borderColor: Color,
    val direction: GradientDirection
) {
    fun toBrush(width: Float, height: Float, mutedTarget: Color? = null): Brush {
        val w = width.coerceAtLeast(1f)
        val h = height.coerceAtLeast(1f)
        val finalColors = if (mutedTarget != null) {
            colors.map { lerp(it, mutedTarget, 0.62f) }
        } else {
            colors
        }
        return when (direction) {
            GradientDirection.LEFT_TO_RIGHT -> Brush.linearGradient(
                colors = finalColors,
                start = Offset(0f, h * 0.5f),
                end = Offset(w, h * 0.5f)
            )
            GradientDirection.TOP_TO_BOTTOM -> Brush.linearGradient(
                colors = finalColors,
                start = Offset(w * 0.5f, 0f),
                end = Offset(w * 0.5f, h)
            )
            GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT -> Brush.linearGradient(
                colors = finalColors,
                start = Offset(0f, 0f),
                end = Offset(w, h)
            )
            GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT -> Brush.linearGradient(
                colors = finalColors,
                start = Offset(0f, h),
                end = Offset(w, 0f)
            )
            GradientDirection.CENTER_GLOW -> {
                val c0 = finalColors.first()
                val c1 = finalColors.last()
                Brush.linearGradient(
                    colors = listOf(c0, c1, c0),
                    start = Offset(0f, 0f),
                    end = Offset(w, h)
                )
            }
            GradientDirection.RADIAL_CORNER -> Brush.radialGradient(
                colors = finalColors.reversed(),
                center = Offset(w * 0.88f, h * 0.15f),
                radius = maxOf(w, h) * 0.95f
            )
        }
    }
}

// 20 calm, soft, eye-friendly Light Mode gradients across 6 gradient geometries
private val lightCategoryGradients: List<CategoryGradientSpec> = listOf(
    // 0: Mint Mist
    CategoryGradientSpec(listOf(Color(0xFFF6FBF7), Color(0xFFE8F5EC)), Color(0xFFD0E6D7), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 1: Sky Breeze
    CategoryGradientSpec(listOf(Color(0xFFF5F9FD), Color(0xFFE6F0FA)), Color(0xFFCEDEEB), GradientDirection.LEFT_TO_RIGHT),
    // 2: Warm Cream
    CategoryGradientSpec(listOf(Color(0xFFFDF9F2), Color(0xFFF6ECDA)), Color(0xFFEADBC0), GradientDirection.RADIAL_CORNER),
    // 3: Soft Rose
    CategoryGradientSpec(listOf(Color(0xFFFCF5F7), Color(0xFFF6E7EC)), Color(0xFFE7D0D8), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 4: Pale Lilac
    CategoryGradientSpec(listOf(Color(0xFFF8F6FC), Color(0xFFEDE8F8)), Color(0xFFD9D0EB), GradientDirection.CENTER_GLOW),
    // 5: Seafoam Aqua
    CategoryGradientSpec(listOf(Color(0xFFF3FAFA), Color(0xFFE3F2F2)), Color(0xFFC9E2E2), GradientDirection.TOP_TO_BOTTOM),
    // 6: Peach Linen
    CategoryGradientSpec(listOf(Color(0xFFFDF7F3), Color(0xFFF7E9DF)), Color(0xFFEAD3C3), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 7: Slate Pearl
    CategoryGradientSpec(listOf(Color(0xFFF6F7FA), Color(0xFFE9EDF4)), Color(0xFFD2D8E4), GradientDirection.LEFT_TO_RIGHT),
    // 8: Meadow Moss
    CategoryGradientSpec(listOf(Color(0xFFF7FAF3), Color(0xFFEBF2E2)), Color(0xFFD5E1C7), GradientDirection.RADIAL_CORNER),
    // 9: Powder Blue
    CategoryGradientSpec(listOf(Color(0xFFF4F7FC), Color(0xFFE5ECFA)), Color(0xFFCCD7EC), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 10: Sand Dune
    CategoryGradientSpec(listOf(Color(0xFFFAF7F2), Color(0xFFF1E9DD)), Color(0xFFE0D4C3), GradientDirection.CENTER_GLOW),
    // 11: Berry Silk
    CategoryGradientSpec(listOf(Color(0xFFFAF5FA), Color(0xFFF2E6F2)), Color(0xFFE1CEE1), GradientDirection.TOP_TO_BOTTOM),
    // 12: Glacier Ice
    CategoryGradientSpec(listOf(Color(0xFFF3FAFC), Color(0xFFE3F3F8)), Color(0xFFC9E3EC), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 13: Honey Dew
    CategoryGradientSpec(listOf(Color(0xFFFAFAF2), Color(0xFFF1F2DF)), Color(0xFFDDDFC3), GradientDirection.LEFT_TO_RIGHT),
    // 14: Terracotta Mist
    CategoryGradientSpec(listOf(Color(0xFFFCF6F4), Color(0xFFF5E6E1)), Color(0xFFE4CFC8), GradientDirection.RADIAL_CORNER),
    // 15: Periwinkle Haze
    CategoryGradientSpec(listOf(Color(0xFFF6F6FC), Color(0xFFE8E9F8)), Color(0xFFD0D2EC), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 16: Eucalyptus
    CategoryGradientSpec(listOf(Color(0xFFF4FAF7), Color(0xFFE5F2EC)), Color(0xFFCCE2D7), GradientDirection.CENTER_GLOW),
    // 17: Buttercream
    CategoryGradientSpec(listOf(Color(0xFFFDFBF2), Color(0xFFF7F2DB)), Color(0xFFE8E0C0), GradientDirection.TOP_TO_BOTTOM),
    // 18: Dusty Coral
    CategoryGradientSpec(listOf(Color(0xFFFDF5F5), Color(0xFFF7E5E5)), Color(0xFFE8CECE), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 19: Silver Birch
    CategoryGradientSpec(listOf(Color(0xFFF8F8F8), Color(0xFFECECEE)), Color(0xFFD8D8DC), GradientDirection.LEFT_TO_RIGHT)
)

// 20 calm, rich, low-glare Dark Mode gradients across 6 gradient geometries
private val darkCategoryGradients: List<CategoryGradientSpec> = listOf(
    // 0: Deep Pine
    CategoryGradientSpec(listOf(Color(0xFF17211C), Color(0xFF1E2D25)), Color(0xFF2B4135), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 1: Midnight Azure
    CategoryGradientSpec(listOf(Color(0xFF161E27), Color(0xFF1D2836)), Color(0xFF2B3B4E), GradientDirection.LEFT_TO_RIGHT),
    // 2: Warm Espresso
    CategoryGradientSpec(listOf(Color(0xFF211C17), Color(0xFF2D261E)), Color(0xFF42372C), GradientDirection.RADIAL_CORNER),
    // 3: Velvet Rose
    CategoryGradientSpec(listOf(Color(0xFF22191D), Color(0xFF2E2027)), Color(0xFF443039), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 4: Dusk Indigo
    CategoryGradientSpec(listOf(Color(0xFF1B1926), Color(0xFF252134)), Color(0xFF36314D), GradientDirection.CENTER_GLOW),
    // 5: Deep Seafoam
    CategoryGradientSpec(listOf(Color(0xFF152021), Color(0xFF1B2B2D)), Color(0xFF284043), GradientDirection.TOP_TO_BOTTOM),
    // 6: Roasted Clay
    CategoryGradientSpec(listOf(Color(0xFF231B17), Color(0xFF30241E)), Color(0xFF46352C), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 7: Gunmetal Blue
    CategoryGradientSpec(listOf(Color(0xFF181C22), Color(0xFF212630)), Color(0xFF313947), GradientDirection.LEFT_TO_RIGHT),
    // 8: Forest Olive
    CategoryGradientSpec(listOf(Color(0xFF1A2016), Color(0xFF232C1D)), Color(0xFF34412B), GradientDirection.RADIAL_CORNER),
    // 9: Cobalt Night
    CategoryGradientSpec(listOf(Color(0xFF161B26), Color(0xFF1E2535)), Color(0xFF2D374E), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 10: Smoked Oak
    CategoryGradientSpec(listOf(Color(0xFF1F1C18), Color(0xFF2A2620)), Color(0xFF3E382F), GradientDirection.CENTER_GLOW),
    // 11: Dark Plum
    CategoryGradientSpec(listOf(Color(0xFF201822), Color(0xFF2C202F)), Color(0xFF412F45), GradientDirection.TOP_TO_BOTTOM),
    // 12: Arctic Slate
    CategoryGradientSpec(listOf(Color(0xFF151E23), Color(0xFF1C2930)), Color(0xFF293C46), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 13: Moss Shadow
    CategoryGradientSpec(listOf(Color(0xFF1D2016), Color(0xFF282C1E)), Color(0xFF3B412C), GradientDirection.LEFT_TO_RIGHT),
    // 14: Sienna Dusk
    CategoryGradientSpec(listOf(Color(0xFF221A19), Color(0xFF2F2321)), Color(0xFF443330), GradientDirection.RADIAL_CORNER),
    // 15: Twilight Violet
    CategoryGradientSpec(listOf(Color(0xFF191A26), Color(0xFF222435)), Color(0xFF33364F), GradientDirection.BOTTOM_LEFT_TO_TOP_RIGHT),
    // 16: Jade Slate
    CategoryGradientSpec(listOf(Color(0xFF16211D), Color(0xFF1D2D27)), Color(0xFF2B4239), GradientDirection.CENTER_GLOW),
    // 17: Amber Charcoal
    CategoryGradientSpec(listOf(Color(0xFF201E16), Color(0xFF2B281D)), Color(0xFF403B2A), GradientDirection.TOP_TO_BOTTOM),
    // 18: Rosewood Dark
    CategoryGradientSpec(listOf(Color(0xFF231819), Color(0xFF302022)), Color(0xFF462F32), GradientDirection.TOP_LEFT_TO_BOTTOM_RIGHT),
    // 19: Obsidian Ash
    CategoryGradientSpec(listOf(Color(0xFF1A1B1E), Color(0xFF23252A)), Color(0xFF34373F), GradientDirection.LEFT_TO_RIGHT)
)

fun categoryGradientSpec(
    categoryId: String,
    categories: List<Category>,
    isDark: Boolean
): CategoryGradientSpec {
    val idx = categories.indexOfFirst { it.id == categoryId }
    val slot = if (idx >= 0) {
        idx % 20
    } else {
        abs(categoryId.hashCode()) % 20
    }
    val palette = if (isDark) darkCategoryGradients else lightCategoryGradients
    return palette[slot]
}
