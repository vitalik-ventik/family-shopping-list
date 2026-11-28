package com.familyshopping.app.ui.theme

import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.sin

enum class DoodlePatternGroup {
    PRODUCE,
    FOOD_DRINK,
    ELECTRONICS,
    REPAIR_TOOLS,
    AUTO,
    CLOTHING,
    FURNITURE_HOME,
    CLEANING,
    LIFESTYLE_PETS
}

data class IconVisualConfig(
    val patternGroup: DoodlePatternGroup,
    val h1: Float,
    val h2: Float,
    val h3: Float,
    val h4: Float,
    val saturation: Float = 0.62f,
    val variant: Int = 0
)

private fun safeHsl(hue: Float, sat: Float, light: Float, alpha: Float = 1f): Color {
    val h = ((hue % 360f) + 360f) % 360f
    return Color.hsl(
        hue = h,
        saturation = sat.coerceIn(0f, 1f),
        lightness = light.coerceIn(0f, 1f),
        alpha = alpha.coerceIn(0f, 1f)
    )
}

private val iconVisualMap: Map<String, IconVisualConfig> = mapOf(
    // Groceries & Produce
    "🛒" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 152f, 184f, 128f, 205f, 0.56f, 0),
    "🥦" to IconVisualConfig(DoodlePatternGroup.PRODUCE, 138f, 92f, 168f, 72f, 0.58f, 0),
    "🥬" to IconVisualConfig(DoodlePatternGroup.PRODUCE, 138f, 92f, 168f, 72f, 0.58f, 0),
    "🍎" to IconVisualConfig(DoodlePatternGroup.PRODUCE, 6f, 342f, 28f, 355f, 0.62f, 1),
    "🧀" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 42f, 28f, 52f, 18f, 0.66f, 0),
    "🥛" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 202f, 184f, 218f, 44f, 0.56f, 1),
    "🥖" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 30f, 42f, 18f, 48f, 0.62f, 2),
    "🥩" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 350f, 12f, 332f, 22f, 0.58f, 3),
    "🐟" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 194f, 214f, 174f, 232f, 0.60f, 1),
    "🌾" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 46f, 32f, 64f, 24f, 0.56f, 2),
    "🍝" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 26f, 44f, 10f, 52f, 0.60f, 0),
    "🧊" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 190f, 210f, 172f, 226f, 0.62f, 2),
    "❄️" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 190f, 210f, 172f, 226f, 0.62f, 2),
    "🍫" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 328f, 20f, 346f, 290f, 0.56f, 3),
    "☕" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 24f, 38f, 14f, 46f, 0.52f, 1),
    "🧃" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 272f, 304f, 248f, 330f, 0.58f, 0),
    "🍷" to IconVisualConfig(DoodlePatternGroup.FOOD_DRINK, 336f, 298f, 352f, 276f, 0.56f, 2),

    // Household & Health
    "🧼" to IconVisualConfig(DoodlePatternGroup.CLEANING, 206f, 182f, 226f, 166f, 0.60f, 0),
    "🧴" to IconVisualConfig(DoodlePatternGroup.CLEANING, 172f, 196f, 152f, 214f, 0.58f, 1),
    "🧹" to IconVisualConfig(DoodlePatternGroup.CLEANING, 188f, 164f, 208f, 144f, 0.54f, 2),
    "🧺" to IconVisualConfig(DoodlePatternGroup.CLEANING, 218f, 192f, 240f, 176f, 0.54f, 3),
    "🧻" to IconVisualConfig(DoodlePatternGroup.CLEANING, 200f, 220f, 182f, 236f, 0.45f, 0),
    "💊" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 158f, 198f, 138f, 216f, 0.58f, 1),
    "🩹" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 16f, 356f, 32f, 14f, 0.54f, 2),

    // Electronics & Tech
    "📱" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 216f, 244f, 196f, 266f, 0.62f, 0),
    "💻" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 228f, 198f, 254f, 182f, 0.58f, 1),
    "🔌" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 196f, 232f, 176f, 252f, 0.60f, 2),
    "💡" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 46f, 32f, 64f, 204f, 0.66f, 3),
    "🔋" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 148f, 184f, 126f, 206f, 0.60f, 0),
    "🎧" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 264f, 294f, 234f, 316f, 0.60f, 1),
    "📷" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 210f, 240f, 286f, 192f, 0.54f, 2),
    "📺" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 236f, 208f, 262f, 190f, 0.56f, 3),
    "🎮" to IconVisualConfig(DoodlePatternGroup.ELECTRONICS, 258f, 312f, 222f, 284f, 0.62f, 0),

    // Repair, Tools & Garden
    "🛠️" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 28f, 208f, 40f, 224f, 0.54f, 0),
    "🔧" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 212f, 230f, 194f, 34f, 0.50f, 1),
    "🔨" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 22f, 38f, 210f, 12f, 0.56f, 2),
    "🪚" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 34f, 18f, 200f, 48f, 0.54f, 3),
    "🪛" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 18f, 206f, 36f, 224f, 0.56f, 0),
    "🎨" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 318f, 42f, 196f, 274f, 0.62f, 1),
    "🪜" to IconVisualConfig(DoodlePatternGroup.REPAIR_TOOLS, 36f, 52f, 22f, 204f, 0.50f, 2),
    "🌱" to IconVisualConfig(DoodlePatternGroup.PRODUCE, 112f, 146f, 88f, 166f, 0.60f, 3),

    // Auto & Transport
    "🚗" to IconVisualConfig(DoodlePatternGroup.AUTO, 216f, 236f, 198f, 4f, 0.58f, 0),
    "⛽" to IconVisualConfig(DoodlePatternGroup.AUTO, 8f, 32f, 214f, 350f, 0.58f, 1),
    "🛞" to IconVisualConfig(DoodlePatternGroup.AUTO, 214f, 238f, 192f, 256f, 0.44f, 2),
    "🚲" to IconVisualConfig(DoodlePatternGroup.AUTO, 166f, 198f, 142f, 218f, 0.58f, 3),

    // Clothing & Accessories
    "👕" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 208f, 236f, 186f, 258f, 0.58f, 0),
    "👗" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 330f, 300f, 350f, 276f, 0.60f, 1),
    "👖" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 222f, 246f, 204f, 266f, 0.56f, 2),
    "🧥" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 26f, 14f, 42f, 216f, 0.50f, 3),
    "👟" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 186f, 218f, 340f, 166f, 0.56f, 0),
    "🧦" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 286f, 320f, 256f, 344f, 0.54f, 1),
    "👜" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 24f, 354f, 40f, 334f, 0.54f, 2),
    "🧢" to IconVisualConfig(DoodlePatternGroup.CLOTHING, 196f, 224f, 174f, 38f, 0.56f, 3),

    // Furniture, Home & Kitchen
    "🛋️" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 32f, 46f, 18f, 148f, 0.52f, 0),
    "🪑" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 28f, 42f, 16f, 54f, 0.48f, 1),
    "🛏️" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 248f, 274f, 222f, 294f, 0.52f, 2),
    "🪴" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 132f, 36f, 154f, 96f, 0.56f, 3),
    "🕯️" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 38f, 22f, 54f, 346f, 0.58f, 0),
    "🖼️" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 266f, 212f, 294f, 42f, 0.52f, 1),
    "🍳" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 16f, 38f, 356f, 210f, 0.56f, 2),
    "🍽️" to IconVisualConfig(DoodlePatternGroup.FURNITURE_HOME, 196f, 42f, 176f, 220f, 0.46f, 3),

    // Pets, Kids & Leisure
    "🐶" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 30f, 46f, 18f, 142f, 0.56f, 0),
    "🐱" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 282f, 318f, 38f, 256f, 0.54f, 1),
    "🧸" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 34f, 16f, 48f, 344f, 0.56f, 2),
    "🍼" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 194f, 336f, 174f, 218f, 0.56f, 3),
    "📚" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 232f, 264f, 206f, 38f, 0.54f, 0),
    "🎁" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 342f, 24f, 316f, 44f, 0.62f, 1),
    "⚽" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 146f, 196f, 122f, 216f, 0.56f, 2),
    "🏕️" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 142f, 34f, 174f, 92f, 0.56f, 3),
    "✈️" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 198f, 226f, 178f, 248f, 0.60f, 0),
    "📦" to IconVisualConfig(DoodlePatternGroup.LIFESTYLE_PETS, 32f, 48f, 20f, 208f, 0.48f, 1)
)

private val fallbackByCategoryId: Map<String, String> = mapOf(
    "cat_produce" to "🥦",
    "cat_dairy" to "🧀",
    "cat_bakery" to "🥖",
    "cat_meat" to "🥩",
    "cat_pantry" to "🌾",
    "cat_frozen" to "🧊",
    "cat_snacks" to "🍫",
    "cat_beverages" to "🧃",
    "cat_household" to "🧼",
    "cat_personal" to "🧴",
    "cat_other" to "📦"
)

fun resolveIconVisual(icon: String?, categoryId: String): IconVisualConfig {
    val key = icon?.trim().orEmpty()
    iconVisualMap[key]?.let { return it }
    fallbackByCategoryId[categoryId]?.let { fb ->
        iconVisualMap[fb]?.let { return it }
    }
    val hash = abs((key + categoryId).hashCode())
    val baseHue = (hash % 12) * 30f
    val group = DoodlePatternGroup.entries[hash % DoodlePatternGroup.entries.size]
    return IconVisualConfig(
        patternGroup = group,
        h1 = baseHue,
        h2 = baseHue + 28f,
        h3 = baseHue - 24f,
        h4 = baseHue + 52f,
        saturation = 0.56f,
        variant = hash % 4
    )
}

fun IconVisualConfig.borderColor(isDark: Boolean, isMuted: Boolean): Color {
    val base = if (isDark) {
        safeHsl(h2, saturation * 0.58f, 0.34f)
    } else {
        safeHsl(h2, saturation * 0.55f, 0.80f)
    }
    return if (isMuted) base.copy(alpha = 0.45f) else base
}

fun DrawScope.drawTelegramCategoryBackground(
    visual: IconVisualConfig,
    isDark: Boolean,
    isMuted: Boolean,
    mutedTarget: Color
) {
    val w = size.width.coerceAtLeast(1f)
    val h = size.height.coerceAtLeast(1f)
    val sat = visual.saturation

    fun resolveColor(hue: Float, satMul: Float, lightLight: Float, darkLight: Float, alpha: Float = 1f): Color {
        val raw = if (isDark) {
            safeHsl(hue, sat * satMul * 1.18f, darkLight, alpha)
        } else {
            safeHsl(hue, sat * satMul, lightLight, alpha)
        }
        return if (isMuted) {
            val blended = lerp(raw.copy(alpha = 1f), mutedTarget, 0.64f)
            blended.copy(alpha = alpha)
        } else {
            raw
        }
    }

    // Base subtle tinted fill
    val baseFill = resolveColor(visual.h1, 0.48f, 0.95f, 0.13f, 1f)
    drawRect(color = baseFill)

    // 4-color corner mesh glows (Telegram-style multi-color organic blend)
    val radius = maxOf(w, h) * 0.92f
    val centers = when (visual.variant % 4) {
        0 -> listOf(
            Offset(w * 0.08f, h * 0.12f),
            Offset(w * 0.92f, h * 0.15f),
            Offset(w * 0.15f, h * 0.90f),
            Offset(w * 0.88f, h * 0.88f)
        )
        1 -> listOf(
            Offset(w * 0.85f, h * 0.10f),
            Offset(w * 0.12f, h * 0.25f),
            Offset(w * 0.90f, h * 0.88f),
            Offset(w * 0.18f, h * 0.85f)
        )
        2 -> listOf(
            Offset(w * 0.22f, h * 0.05f),
            Offset(w * 0.95f, h * 0.45f),
            Offset(w * 0.05f, h * 0.65f),
            Offset(w * 0.72f, h * 0.95f)
        )
        else -> listOf(
            Offset(w * 0.50f, h * 0.08f),
            Offset(w * 0.94f, h * 0.80f),
            Offset(w * 0.06f, h * 0.82f),
            Offset(w * 0.52f, h * 0.55f)
        )
    }

    val meshColors = listOf(
        resolveColor(visual.h1, 0.95f, 0.90f, 0.21f, 0.82f),
        resolveColor(visual.h2, 0.90f, 0.89f, 0.19f, 0.78f),
        resolveColor(visual.h3, 0.88f, 0.88f, 0.20f, 0.76f),
        resolveColor(visual.h4, 0.82f, 0.91f, 0.22f, 0.72f)
    )

    centers.forEachIndexed { idx, center ->
        val c = meshColors[idx]
        drawRect(
            brush = Brush.radialGradient(
                colors = listOf(c, c.copy(alpha = 0f)),
                center = center,
                radius = radius
            )
        )
    }

    // Monoline Telegram-style contour doodles tiled in a staggered pattern
    val strokeAlpha = when {
        isMuted -> 0.045f
        isDark -> 0.095f
        else -> 0.085f
    }
    val doodleColor = if (isDark) {
        safeHsl(visual.h2, sat * 0.50f, 0.84f, strokeAlpha)
    } else {
        safeHsl(visual.h3, sat * 0.65f, 0.28f, strokeAlpha)
    }

    val stroke = Stroke(
        width = 1.25.dp.toPx(),
        cap = StrokeCap.Round,
        join = StrokeJoin.Round
    )
    val tileW = 54.dp.toPx()
    val tileH = 44.dp.toPx()
    val cols = (w / tileW).toInt() + 2
    val rows = (h / tileH).toInt() + 2
    val angles = floatArrayOf(-18f, 14f, -10f, 22f, -24f, 8f)

    for (row in 0 until rows) {
        val xShift = if (row % 2 == 1) tileW * 0.5f else 0f
        for (col in 0 until cols) {
            val cx = col * tileW + xShift + tileW * 0.35f
            val cy = row * tileH + tileH * 0.45f
            val shapeIdx = (row * 3 + col + visual.variant) % 4
            val angle = angles[(row * 5 + col * 2 + visual.variant) % angles.size]
            val iconScale = 14.dp.toPx()

            withTransform({
                translate(left = cx, top = cy)
                rotate(degrees = angle, pivot = Offset.Zero)
            }) {
                drawDoodleShape(
                    group = visual.patternGroup,
                    shapeIdx = shapeIdx,
                    r = iconScale,
                    color = doodleColor,
                    stroke = stroke
                )
            }
        }
    }
}

private fun DrawScope.drawDoodleShape(
    group: DoodlePatternGroup,
    shapeIdx: Int,
    r: Float,
    color: Color,
    stroke: Stroke
) {
    when (group) {
        DoodlePatternGroup.PRODUCE -> when (shapeIdx % 4) {
            0 -> {
                // Apple
                drawCircle(color, radius = r * 0.52f, center = Offset(0f, r * 0.1f), style = stroke)
                drawLine(color, Offset(0f, -r * 0.4f), Offset(r * 0.12f, -r * 0.72f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                val leaf = Path().apply {
                    moveTo(r * 0.08f, -r * 0.55f)
                    quadraticBezierTo(r * 0.5f, -r * 0.72f, r * 0.44f, -r * 0.35f)
                    quadraticBezierTo(r * 0.2f, -r * 0.34f, r * 0.08f, -r * 0.55f)
                }
                drawPath(leaf, color, style = stroke)
            }
            1 -> {
                // Carrot
                val body = Path().apply {
                    moveTo(-r * 0.32f, -r * 0.35f)
                    lineTo(r * 0.32f, -r * 0.35f)
                    lineTo(0f, r * 0.7f)
                    close()
                }
                drawPath(body, color, style = stroke)
                drawLine(color, Offset(0f, -r * 0.38f), Offset(0f, -r * 0.72f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(-r * 0.12f, -r * 0.38f), Offset(-r * 0.3f, -r * 0.65f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(r * 0.12f, -r * 0.38f), Offset(r * 0.3f, -r * 0.65f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            2 -> {
                // Leaf
                val leaf = Path().apply {
                    moveTo(0f, -r * 0.7f)
                    quadraticBezierTo(r * 0.65f, -r * 0.1f, 0f, r * 0.65f)
                    quadraticBezierTo(-r * 0.65f, -r * 0.1f, 0f, -r * 0.7f)
                }
                drawPath(leaf, color, style = stroke)
                drawLine(color, Offset(0f, -r * 0.4f), Offset(0f, r * 0.75f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            else -> {
                // Citrus slice / Berry
                drawArc(
                    color = color,
                    startAngle = 0f,
                    sweepAngle = 180f,
                    useCenter = true,
                    topLeft = Offset(-r * 0.65f, -r * 0.32f),
                    size = Size(r * 1.3f, r * 1.1f),
                    style = stroke
                )
                drawLine(color, Offset(0f, -r * 0.32f), Offset(0f, r * 0.22f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.FOOD_DRINK -> when (shapeIdx % 4) {
            0 -> {
                // Cheese wedge
                val p = Path().apply {
                    moveTo(-r * 0.6f, r * 0.45f)
                    lineTo(r * 0.65f, r * 0.45f)
                    lineTo(r * 0.45f, -r * 0.45f)
                    close()
                }
                drawPath(p, color, style = stroke)
                drawCircle(color, radius = r * 0.12f, center = Offset(r * 0.1f, r * 0.15f), style = stroke)
                drawCircle(color, radius = r * 0.08f, center = Offset(r * 0.36f, r * 0.22f), style = stroke)
            }
            1 -> {
                // Cup / Mug
                drawRoundRect(
                    color = color,
                    topLeft = Offset(-r * 0.42f, -r * 0.25f),
                    size = Size(r * 0.78f, r * 0.8f),
                    cornerRadius = CornerRadius(r * 0.15f),
                    style = stroke
                )
                drawArc(
                    color = color,
                    startAngle = -90f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(r * 0.2f, -r * 0.1f),
                    size = Size(r * 0.4f, r * 0.42f),
                    style = stroke
                )
                drawLine(color, Offset(-r * 0.15f, -r * 0.45f), Offset(-r * 0.15f, -r * 0.68f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(r * 0.12f, -r * 0.45f), Offset(r * 0.12f, -r * 0.68f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            2 -> {
                // Bottle
                val p = Path().apply {
                    moveTo(-r * 0.16f, -r * 0.7f)
                    lineTo(r * 0.16f, -r * 0.7f)
                    lineTo(r * 0.16f, -r * 0.35f)
                    lineTo(r * 0.34f, -r * 0.12f)
                    lineTo(r * 0.34f, r * 0.65f)
                    lineTo(-r * 0.34f, r * 0.65f)
                    lineTo(-r * 0.34f, -r * 0.12f)
                    lineTo(-r * 0.16f, -r * 0.35f)
                    close()
                }
                drawPath(p, color, style = stroke)
            }
            else -> {
                // Loaf / Bread
                drawRoundRect(
                    color = color,
                    topLeft = Offset(-r * 0.68f, -r * 0.3f),
                    size = Size(r * 1.36f, r * 0.62f),
                    cornerRadius = CornerRadius(r * 0.3f),
                    style = stroke
                )
                drawLine(color, Offset(-r * 0.25f, -r * 0.18f), Offset(-r * 0.1f, r * 0.18f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(r * 0.15f, -r * 0.18f), Offset(r * 0.3f, r * 0.18f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.ELECTRONICS -> when (shapeIdx % 4) {
            0 -> {
                // Phone
                drawRoundRect(
                    color = color,
                    topLeft = Offset(-r * 0.38f, -r * 0.65f),
                    size = Size(r * 0.76f, r * 1.3f),
                    cornerRadius = CornerRadius(r * 0.16f),
                    style = stroke
                )
                drawCircle(color, radius = r * 0.06f, center = Offset(0f, r * 0.44f), style = stroke)
            }
            1 -> {
                // Lightbulb
                drawCircle(color, radius = r * 0.42f, center = Offset(0f, -r * 0.15f), style = stroke)
                drawLine(color, Offset(-r * 0.2f, r * 0.34f), Offset(r * 0.2f, r * 0.34f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(-r * 0.15f, r * 0.54f), Offset(r * 0.15f, r * 0.54f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            2 -> {
                // Headphones
                drawArc(
                    color = color,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(-r * 0.58f, -r * 0.55f),
                    size = Size(r * 1.16f, r * 1.1f),
                    style = stroke
                )
                drawRoundRect(color, Offset(-r * 0.66f, 0f), Size(r * 0.24f, r * 0.48f), CornerRadius(r * 0.1f), style = stroke)
                drawRoundRect(color, Offset(r * 0.42f, 0f), Size(r * 0.24f, r * 0.48f), CornerRadius(r * 0.1f), style = stroke)
            }
            else -> {
                // Bolt / Power
                val bolt = Path().apply {
                    moveTo(r * 0.1f, -r * 0.65f)
                    lineTo(-r * 0.32f, r * 0.05f)
                    lineTo(r * 0.04f, r * 0.05f)
                    lineTo(-r * 0.12f, r * 0.65f)
                    lineTo(r * 0.34f, -r * 0.08f)
                    lineTo(-r * 0.02f, -r * 0.08f)
                    close()
                }
                drawPath(bolt, color, style = stroke)
            }
        }

        DoodlePatternGroup.REPAIR_TOOLS -> when (shapeIdx % 4) {
            0 -> {
                // Wrench
                drawLine(color, Offset(-r * 0.45f, r * 0.45f), Offset(r * 0.25f, -r * 0.25f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawArc(
                    color = color,
                    startAngle = 45f,
                    sweepAngle = 270f,
                    useCenter = false,
                    topLeft = Offset(r * 0.1f, -r * 0.68f),
                    size = Size(r * 0.56f, r * 0.56f),
                    style = stroke
                )
            }
            1 -> {
                // Hammer
                drawLine(color, Offset(0f, -r * 0.2f), Offset(0f, r * 0.68f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawRoundRect(color, Offset(-r * 0.5f, -r * 0.55f), Size(r * 1.0f, r * 0.34f), CornerRadius(r * 0.08f), style = stroke)
            }
            2 -> {
                // Gear
                drawCircle(color, radius = r * 0.38f, center = Offset.Zero, style = stroke)
                drawCircle(color, radius = r * 0.15f, center = Offset.Zero, style = stroke)
                for (k in 0 until 6) {
                    val rad = (k * 60.0) * Math.PI / 180.0
                    val x1 = (cos(rad) * r * 0.42f).toFloat()
                    val y1 = (sin(rad) * r * 0.42f).toFloat()
                    val x2 = (cos(rad) * r * 0.62f).toFloat()
                    val y2 = (sin(rad) * r * 0.62f).toFloat()
                    drawLine(color, Offset(x1, y1), Offset(x2, y2), strokeWidth = stroke.width, cap = StrokeCap.Round)
                }
            }
            else -> {
                // Paint brush / Spatula
                drawRoundRect(color, Offset(-r * 0.38f, -r * 0.6f), Size(r * 0.76f, r * 0.48f), CornerRadius(r * 0.1f), style = stroke)
                drawLine(color, Offset(0f, -r * 0.12f), Offset(0f, r * 0.65f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.AUTO -> when (shapeIdx % 4) {
            0 -> {
                // Car silhouette
                val car = Path().apply {
                    moveTo(-r * 0.7f, r * 0.28f)
                    lineTo(-r * 0.7f, -r * 0.02f)
                    lineTo(-r * 0.42f, -r * 0.42f)
                    lineTo(r * 0.36f, -r * 0.42f)
                    lineTo(r * 0.66f, -r * 0.02f)
                    lineTo(r * 0.7f, r * 0.28f)
                    close()
                }
                drawPath(car, color, style = stroke)
                drawCircle(color, radius = r * 0.16f, center = Offset(-r * 0.38f, r * 0.34f), style = stroke)
                drawCircle(color, radius = r * 0.16f, center = Offset(r * 0.38f, r * 0.34f), style = stroke)
            }
            1 -> {
                // Steering wheel / Tire
                drawCircle(color, radius = r * 0.56f, center = Offset.Zero, style = stroke)
                drawCircle(color, radius = r * 0.16f, center = Offset.Zero, style = stroke)
                drawLine(color, Offset(-r * 0.52f, 0f), Offset(-r * 0.16f, 0f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(r * 0.16f, 0f), Offset(r * 0.52f, 0f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(0f, r * 0.16f), Offset(0f, r * 0.52f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            2 -> {
                // Fuel drop
                val drop = Path().apply {
                    moveTo(0f, -r * 0.65f)
                    quadraticBezierTo(r * 0.56f, r * 0.1f, 0f, r * 0.65f)
                    quadraticBezierTo(-r * 0.56f, r * 0.1f, 0f, -r * 0.65f)
                }
                drawPath(drop, color, style = stroke)
            }
            else -> {
                // Speedometer arc
                drawArc(
                    color = color,
                    startAngle = 150f,
                    sweepAngle = 240f,
                    useCenter = false,
                    topLeft = Offset(-r * 0.58f, -r * 0.58f),
                    size = Size(r * 1.16f, r * 1.16f),
                    style = stroke
                )
                drawLine(color, Offset.Zero, Offset(r * 0.32f, -r * 0.28f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.CLOTHING -> when (shapeIdx % 4) {
            0 -> {
                // T-shirt
                val shirt = Path().apply {
                    moveTo(-r * 0.3f, -r * 0.55f)
                    lineTo(-r * 0.7f, -r * 0.3f)
                    lineTo(-r * 0.52f, 0f)
                    lineTo(-r * 0.36f, -r * 0.08f)
                    lineTo(-r * 0.36f, r * 0.6f)
                    lineTo(r * 0.36f, r * 0.6f)
                    lineTo(r * 0.36f, -r * 0.08f)
                    lineTo(r * 0.52f, 0f)
                    lineTo(r * 0.7f, -r * 0.3f)
                    lineTo(r * 0.3f, -r * 0.55f)
                    quadraticBezierTo(0f, -r * 0.36f, -r * 0.3f, -r * 0.55f)
                }
                drawPath(shirt, color, style = stroke)
            }
            1 -> {
                // Hanger
                val hanger = Path().apply {
                    moveTo(0f, -r * 0.35f)
                    lineTo(-r * 0.65f, r * 0.3f)
                    lineTo(r * 0.65f, r * 0.3f)
                    close()
                }
                drawPath(hanger, color, style = stroke)
                drawArc(
                    color = color,
                    startAngle = 150f,
                    sweepAngle = 240f,
                    useCenter = false,
                    topLeft = Offset(-r * 0.16f, -r * 0.68f),
                    size = Size(r * 0.32f, r * 0.32f),
                    style = stroke
                )
            }
            2 -> {
                // Handbag
                drawRoundRect(color, Offset(-r * 0.5f, -r * 0.15f), Size(r * 1.0f, r * 0.72f), CornerRadius(r * 0.14f), style = stroke)
                drawArc(
                    color = color,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(-r * 0.28f, -r * 0.58f),
                    size = Size(r * 0.56f, r * 0.56f),
                    style = stroke
                )
            }
            else -> {
                // Cap / Hat
                drawArc(
                    color = color,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = true,
                    topLeft = Offset(-r * 0.5f, -r * 0.42f),
                    size = Size(r * 1.0f, r * 0.9f),
                    style = stroke
                )
                drawLine(color, Offset(-r * 0.55f, r * 0.04f), Offset(r * 0.72f, r * 0.04f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.FURNITURE_HOME -> when (shapeIdx % 4) {
            0 -> {
                // Sofa / Armchair
                drawRoundRect(color, Offset(-r * 0.58f, -r * 0.45f), Size(r * 1.16f, r * 0.72f), CornerRadius(r * 0.18f), style = stroke)
                drawLine(color, Offset(-r * 0.4f, r * 0.28f), Offset(-r * 0.4f, r * 0.52f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(r * 0.4f, r * 0.28f), Offset(r * 0.4f, r * 0.52f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(-r * 0.55f, 0f), Offset(r * 0.55f, 0f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            1 -> {
                // Potted plant
                val pot = Path().apply {
                    moveTo(-r * 0.34f, r * 0.05f)
                    lineTo(r * 0.34f, r * 0.05f)
                    lineTo(r * 0.24f, r * 0.62f)
                    lineTo(-r * 0.24f, r * 0.62f)
                    close()
                }
                drawPath(pot, color, style = stroke)
                drawLine(color, Offset(0f, r * 0.05f), Offset(0f, -r * 0.58f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(0f, -r * 0.15f), Offset(-r * 0.36f, -r * 0.45f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(0f, -r * 0.15f), Offset(r * 0.36f, -r * 0.45f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            2 -> {
                // Table lamp
                val shade = Path().apply {
                    moveTo(-r * 0.32f, -r * 0.55f)
                    lineTo(r * 0.32f, -r * 0.55f)
                    lineTo(r * 0.52f, -r * 0.05f)
                    lineTo(-r * 0.52f, -r * 0.05f)
                    close()
                }
                drawPath(shade, color, style = stroke)
                drawLine(color, Offset(0f, -r * 0.05f), Offset(0f, r * 0.55f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(-r * 0.28f, r * 0.55f), Offset(r * 0.28f, r * 0.55f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            else -> {
                // Frying pan
                drawCircle(color, radius = r * 0.44f, center = Offset(-r * 0.16f, 0f), style = stroke)
                drawLine(color, Offset(r * 0.28f, 0f), Offset(r * 0.72f, 0f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
        }

        DoodlePatternGroup.CLEANING -> when (shapeIdx % 4) {
            0 -> {
                // Bubbles
                drawCircle(color, radius = r * 0.34f, center = Offset(-r * 0.18f, -r * 0.12f), style = stroke)
                drawCircle(color, radius = r * 0.22f, center = Offset(r * 0.34f, r * 0.26f), style = stroke)
                drawCircle(color, radius = r * 0.14f, center = Offset(r * 0.3f, -r * 0.34f), style = stroke)
            }
            1 -> {
                // Sparkle
                val sparkle = Path().apply {
                    moveTo(0f, -r * 0.62f)
                    quadraticBezierTo(r * 0.08f, -r * 0.08f, r * 0.62f, 0f)
                    quadraticBezierTo(r * 0.08f, r * 0.08f, 0f, r * 0.62f)
                    quadraticBezierTo(-r * 0.08f, r * 0.08f, -r * 0.62f, 0f)
                    quadraticBezierTo(-r * 0.08f, -r * 0.08f, 0f, -r * 0.62f)
                }
                drawPath(sparkle, color, style = stroke)
            }
            2 -> {
                // Spray bottle
                drawRoundRect(color, Offset(-r * 0.3f, -r * 0.15f), Size(r * 0.6f, r * 0.75f), CornerRadius(r * 0.16f), style = stroke)
                drawLine(color, Offset(0f, -r * 0.15f), Offset(0f, -r * 0.5f), strokeWidth = stroke.width, cap = StrokeCap.Round)
                drawLine(color, Offset(-r * 0.18f, -r * 0.5f), Offset(r * 0.36f, -r * 0.5f), strokeWidth = stroke.width, cap = StrokeCap.Round)
            }
            else -> {
                // Basket / Bucket
                val bucket = Path().apply {
                    moveTo(-r * 0.45f, -r * 0.15f)
                    lineTo(r * 0.45f, -r * 0.15f)
                    lineTo(r * 0.32f, r * 0.58f)
                    lineTo(-r * 0.32f, r * 0.58f)
                    close()
                }
                drawPath(bucket, color, style = stroke)
                drawArc(
                    color = color,
                    startAngle = 180f,
                    sweepAngle = 180f,
                    useCenter = false,
                    topLeft = Offset(-r * 0.34f, -r * 0.55f),
                    size = Size(r * 0.68f, r * 0.45f),
                    style = stroke
                )
            }
        }

        DoodlePatternGroup.LIFESTYLE_PETS -> when (shapeIdx % 4) {
            0 -> {
                // Paw print
                drawCircle(color, radius = r * 0.24f, center = Offset(0f, r * 0.2f), style = stroke)
                drawCircle(color, radius = r * 0.10f, center = Offset(-r * 0.34f, -r * 0.12f), style = stroke)
                drawCircle(color, radius = r * 0.10f, center = Offset(-r * 0.12f, -r * 0.34f), style = stroke)
                drawCircle(color, radius = r * 0.10f, center = Offset(r * 0.14f, -r * 0.34f), style = stroke)
                drawCircle(color, radius = r * 0.10f, center = Offset(r * 0.34f, -r * 0.12f), style = stroke)
            }
            1 -> {
                // Gift box
                drawRoundRect(color, Offset(-r * 0.46f, -r * 0.22f), Size(r * 0.92f, r * 0.78f), CornerRadius(r * 0.1f), style = stroke)
                drawLine(color, Offset(0f, -r * 0.22f), Offset(0f, r * 0.56f), strokeWidth = stroke.width)
                drawLine(color, Offset(-r * 0.46f, r * 0.12f), Offset(r * 0.46f, r * 0.12f), strokeWidth = stroke.width)
                drawCircle(color, radius = r * 0.14f, center = Offset(-r * 0.15f, -r * 0.38f), style = stroke)
                drawCircle(color, radius = r * 0.14f, center = Offset(r * 0.15f, -r * 0.38f), style = stroke)
            }
            2 -> {
                // Heart
                val heart = Path().apply {
                    moveTo(0f, r * 0.55f)
                    cubicTo(-r * 0.75f, r * 0.1f, -r * 0.55f, -r * 0.58f, 0f, -r * 0.18f)
                    cubicTo(r * 0.55f, -r * 0.58f, r * 0.75f, r * 0.1f, 0f, r * 0.55f)
                }
                drawPath(heart, color, style = stroke)
            }
            else -> {
                // Book / Package
                drawRoundRect(color, Offset(-r * 0.48f, -r * 0.5f), Size(r * 0.96f, r * 1.0f), CornerRadius(r * 0.1f), style = stroke)
                drawLine(color, Offset(0f, -r * 0.48f), Offset(0f, r * 0.48f), strokeWidth = stroke.width)
            }
        }
    }
}
