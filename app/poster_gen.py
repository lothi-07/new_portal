from PIL import Image, ImageDraw, ImageFont, ImageOps
import os, math, random

FONT_DIR = os.path.join(os.path.dirname(__file__), "fonts")
ASSETS_DIR = os.path.join(os.path.dirname(__file__), "assets")
# Real certificate template - professional design with circular photo frame
TEMPLATE_PATH = os.path.join(ASSETS_DIR, "image.png")

# Template actual size: 1380×768
BASE_W, BASE_H = 1370, 750
SCALE = 2  # render at 2× for crisp print quality
W, H = BASE_W * SCALE, BASE_H * SCALE

# Photo circular frame (existing in template) - center top area
PHOTO_CX, PHOTO_CY = 690, 310
PHOTO_R = 80          # inner photo radius to fit in circle
PHOTO_RING_R = 80     # outer gold ring (already in template)

# Maroon banner coordinates (already in template) - overlay name only
NAME_Y = 440     # y-position to center name in maroon banner
# Congratulation section - below the maroon banner
CONGRATULATION_Y = 530
QUOTE_Y = 565

CREAM = (245, 234, 216)
MAROON = (95, 18, 28)
MAROON_DEEP = (72, 10, 11)
MAROON_LIGHT = (139, 35, 50)
GOLD = (201, 152, 28)
GOLD_LIGHT = (236, 198, 72)
GOLD_DARK = (140, 95, 12)
NAVY = (18, 36, 92)
WHITE = (255, 255, 255)
DARK = (25, 25, 30)
GREY = (70, 68, 72)
LIGHT_GREY = (150, 150, 150)

MOTIVATIONAL_QUOTES = [
    "Excellence is a journey, not a destination.",
    "Your potential is limitless – keep pushing boundaries.",
    "Great achievements come from great dedication.",
    "Every success is built on consistent hard work.",
    "Success is 10% inspiration and 90% perspiration.",
    "Believe in yourself and you will achieve greatness.",
    "The only limit is the one you set for yourself.",
    "Dedication and hard work always pay off.",
]

ACHIEVEMENT_TEMPLATES = {
    "1st Prize": "Winner - 1st Prize",
    "2nd Prize": "Runner-up - 2nd Prize",
    "3rd Prize": "Third Position",
    "Participation": "Participation Award",
}

MOTIVATION_LINES = {
    "1st Prize": "Your dedication and brilliance set the benchmark – keep soaring higher!",
    "2nd Prize": "A proud moment earned through hard work – keep pushing your limits!",
    "3rd Prize": "Every achievement is a step towards greatness – keep striving!",
    "Participation": "Your effort and courage to participate make us proud – keep going!",
}
DEFAULT_MOTIVATION = "Your hard work and passion truly inspire us – keep shining bright!"

PRIZE_DISPLAY = {
    "1st Prize": ("1st", "PLACE", "WINNER"),
    "2nd Prize": ("2nd", "PLACE", "WINNER"),
    "3rd Prize": ("3rd", "PLACE", "WINNER"),
    "Participation": ("PART", "ICIPANT", "AWARD"),
}


def sc(v):
    return int(round(v * SCALE))


def font(name, size):
    return ImageFont.truetype(os.path.join(FONT_DIR, name), sc(size))


def circle_crop(img, size):
    # Fit rather than stretch so the student photo keeps its natural proportions.
    img = ImageOps.fit(img.convert("RGB"), size, method=Image.LANCZOS, centering=(0.5, 0.5))
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size[0] - 1, size[1] - 1), fill=255)
    out = Image.new("RGBA", size, (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def fit_font_for_width(draw, text, font_name, max_width_px, start_size=36, min_size=12):
    
    size = start_size
    while size >= min_size:
        f = font(font_name, size)
        bbox = draw.textbbox((0, 0), text, font=f)
        w = bbox[2] - bbox[0]
        if w <= max_width_px:
            return f
        size -= 2
    return font(font_name, min_size)


def center_text(draw, cx, y, text, f, fill, stroke_width=0, stroke_fill=None):
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0]
    draw.text(
        (sc(cx) - w / 2, sc(y)),
        text,
        font=f,
        fill=fill,
        stroke_width=stroke_width,
        stroke_fill=stroke_fill,
    )


def fill_rect(draw, box, color):
    x0, y0, x1, y1 = box
    draw.rectangle((sc(x0), sc(y0), sc(x1), sc(y1)), fill=color)


def cover_with_template_background(img, box):
 
    x0, y0, x1, y1 = box
    strip = img.crop((sc(1000), sc(y0), sc(1024), sc(y1)))
    target_left, target_right = sc(x0), sc(x1)
    for left in range(target_left, target_right, strip.width):
        crop_width = min(strip.width, target_right - left)
        img.paste(strip.crop((0, 0, crop_width, strip.height)), (left, sc(y0)))


def draw_medal_face(draw, cx, cy, r, ordinal, place, ribbon_label):
    """Redraw prize text on the existing gold seal area."""
    # soft gold disk over old text
    draw.ellipse(
        (sc(cx - r * 0.72), sc(cy - r * 0.72), sc(cx + r * 0.72), sc(cy + r * 0.72)),
        fill=GOLD_LIGHT,
    )
    center_text(draw, cx, cy - 18, ordinal, font("Poppins-ExtraBold.ttf", 20), MAROON_DEEP)
    center_text(draw, cx, cy + 4, place, font("Poppins-Bold.ttf", 12), (70, 40, 10))

    # ribbon banner
    rw = r * 1.05
    ry = cy + r * 0.72
    draw.rounded_rectangle(
        (sc(cx - rw), sc(ry - 11), sc(cx + rw), sc(ry + 11)),
        radius=sc(4),
        fill=MAROON,
    )
    center_text(draw, cx, ry - 8, ribbon_label, font("Poppins-Bold.ttf", 11), (255, 230, 160))


def generate_poster(student_name, event_name, prize_type, photo_path=None, output_path="certificate.png"):
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found: {TEMPLATE_PATH}")

    # Load template and upscale for print quality
    template = Image.open(TEMPLATE_PATH).convert("RGB")
    img = template.resize((W, H), Image.LANCZOS)
    draw = ImageDraw.Draw(img)

    # ========== OVERLAY 1: STUDENT PHOTO IN CIRCULAR FRAME ==========
    # make the photo slightly smaller than the inner radius to avoid touching the decorative ring
    photo_px = sc((PHOTO_R - 2) * 2)
    
    if photo_path and os.path.exists(photo_path):
        # Crop and resize photo to circular frame
        photo = circle_crop(Image.open(photo_path), (photo_px, photo_px))

        # Position photo in the circle (scaled coords). Use a slightly reduced radius
        photo_x = sc(PHOTO_CX - (PHOTO_R - 2))
        photo_y = sc(PHOTO_CY - (PHOTO_R - 2))

        # Paste photo with alpha channel for smooth circular edges
        img.paste(photo, (photo_x, photo_y), photo)

    # ========== OVERLAY 2: STUDENT NAME IN MAROON BANNER ==========
    # Make name prominent and visible in maroon banner. Fit font size to banner width.
    max_name_w = sc(900)
    name_font = fit_font_for_width(draw, student_name.upper(), "Poppins-ExtraBold.ttf", max_name_w, start_size=36)
    center_text(
        draw,
        BASE_W / 2,
        NAME_Y,
        student_name.upper(),
        name_font,
        GOLD,
        stroke_width=1,
        stroke_fill=(0, 0, 0),
    )

    # ========== OVERLAY 3: CONGRATULATION TEXT ==========
    center_text(
        draw,
        BASE_W / 2,
        CONGRATULATION_Y,
        "Congratulations!",
        font("Poppins-Bold.ttf", 22),
        GOLD,
    )

    # ========== OVERLAY 4: MOTIVATIONAL MESSAGE ==========
    motivation = MOTIVATION_LINES.get(prize_type, DEFAULT_MOTIVATION)
    quote_font = font("Poppins-Regular.ttf", 17)
    
    # Word-wrap the motivation message to fit in the certificate width
    max_w = sc(1150)  # Maximum text width
    words = motivation.split()
    lines, cur = [], ""
    
    for w in words:
        test = (cur + " " + w).strip()
        bbox = draw.textbbox((0, 0), test, font=quote_font)
        if bbox[2] - bbox[0] > max_w and cur:
            lines.append(cur)
            cur = w
        else:
            cur = test
    if cur:
        lines.append(cur)
    
    # Draw motivation lines
    quote_start_y = QUOTE_Y
    for i, line in enumerate(lines[:2]):  # Max 2 lines
        center_text(
            draw,
            BASE_W / 2,
            quote_start_y + (i * 18),
            line,
            quote_font,
            GREY,
        )

    # Save the certificate
    os.makedirs(os.path.dirname(os.path.abspath(output_path)) or ".", exist_ok=True)
    img.save(output_path, quality=95)
    return output_path


if __name__ == "__main__":
    generate_poster(
        student_name="Kirthiga R",
        event_name="National Level Technical Symposium – Paper Presentation",
        prize_type="1st Prize",
        photo_path=None,
        output_path="app/static/generated/_template_test.png",
    )
    print("done")
