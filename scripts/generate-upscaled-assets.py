import os
import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

def upscale_image(im: Image.Image, target_w: int, target_h: int, sharpen_factor=1.25, contrast_factor=1.05) -> Image.Image:
    """Upscales image using high-quality Lanczos resampling, detail enhancement and unsharp mask."""
    # 1. High-precision Lanczos resize
    upscaled = im.resize((target_w, target_h), Image.Resampling.LANCZOS)
    
    # 2. Subtle contrast boost for deep cinematic tones
    enhancer = ImageEnhance.Contrast(upscaled)
    upscaled = enhancer.enhance(contrast_factor)
    
    # 3. Sharpness enhancement for texture clarity (moss, stone ruins, foliage, water)
    sharpener = ImageEnhance.Sharpness(upscaled)
    upscaled = sharpener.enhance(sharpen_factor)
    
    # 4. Light unsharp mask for fine micro-contrast without halo artifacts
    upscaled = upscaled.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))
    
    return upscaled

def main():
    os.makedirs('public/assets/images', exist_ok=True)
    
    # -------------------------------------------------------------
    # 1. Desktop Loading Static Image: Extract best keyframe from loadingdesktop.mp4
    # -------------------------------------------------------------
    desktop_vid = 'public/assets/images/loadingdesktop.mp4'
    if os.path.exists(desktop_vid):
        cap = cv2.VideoCapture(desktop_vid)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        # Choose frame around 40% where god rays and skeleton are prominent
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(total * 0.42))
        ret, frame = cap.read()
        cap.release()
        if ret:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            im_desk = Image.fromarray(rgb)
            # Upscale 1280x720 -> 2560x1440 (2x upscale)
            upscaled_desk = upscale_image(im_desk, 2560, 1440, sharpen_factor=1.3, contrast_factor=1.06)
            out_path = 'public/assets/images/loading-static-desktop.webp'
            upscaled_desk.save(out_path, 'WEBP', quality=90, method=6)
            print(f"Created {out_path} ({upscaled_desk.size})")

    # -------------------------------------------------------------
    # 2. Mobile Loading Static Image: Extract from loadingmobile.mp4 & crop pillarbox
    # -------------------------------------------------------------
    mobile_vid = 'public/assets/images/loadingmobile.mp4'
    if os.path.exists(mobile_vid):
        cap = cv2.VideoCapture(mobile_vid)
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(total * 0.42))
        ret, frame = cap.read()
        cap.release()
        if ret:
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            im_mob = Image.fromarray(rgb)
            # Detect active vertical region: 1920x1080 has black bars on left and right
            # The active vertical content is in the center ~608px wide (9:16 aspect ratio in 1080h is 608w)
            w, h = im_mob.size
            active_w = int(h * (9 / 16)) # 1080 * 9 / 16 = 608px
            left = (w - active_w) // 2
            right = left + active_w
            cropped_mob = im_mob.crop((left, 0, right, h)) # 608 x 1080
            
            # Upscale cropped vertical region to full HD mobile resolution (1080 x 1920)
            upscaled_mob = upscale_image(cropped_mob, 1080, 1920, sharpen_factor=1.35, contrast_factor=1.06)
            out_path = 'public/assets/images/loading-static-mobile.webp'
            upscaled_mob.save(out_path, 'WEBP', quality=90, method=6)
            print(f"Created {out_path} ({upscaled_mob.size})")

    # -------------------------------------------------------------
    # 3. Scroll Animation Static Image (Desktop): Upscale frame_000
    # -------------------------------------------------------------
    frame0_path = 'public/frames/frame_000_delay-0.016s.webp'
    if os.path.exists(frame0_path):
        im_frame0 = Image.open(frame0_path).convert('RGB')
        # Upscale 1280x720 -> 2560x1440 (2K Ultra Clear)
        upscaled_scroll_desk = upscale_image(im_frame0, 2560, 1440, sharpen_factor=1.3, contrast_factor=1.05)
        out_path = 'public/assets/images/scroll-static-desktop.webp'
        upscaled_scroll_desk.save(out_path, 'WEBP', quality=90, method=6)
        print(f"Created {out_path} ({upscaled_scroll_desk.size})")
        
        # Also create a mobile vertical crop version (9:16 aspect ratio) for phones
        # Focus on the adventurer in center-left, campfire, and temple ruins
        fw, fh = im_frame0.size
        # Crop center 9:16 from the 1280x720 image: height=720, width=720*(9/16)=405
        # Offset slightly toward explorer (center is at x=640, explorer is around x=580)
        mob_w = int(fh * (9 / 16)) # 405
        cx = int(fw * 0.46) # centered nicely around explorer and temple
        left = max(0, cx - mob_w // 2)
        right = left + mob_w
        cropped_scroll_mob = im_frame0.crop((left, 0, right, fh))
        upscaled_scroll_mob = upscale_image(cropped_scroll_mob, 1080, 1920, sharpen_factor=1.35, contrast_factor=1.06)
        out_mob_path = 'public/assets/images/scroll-static-mobile.webp'
        upscaled_scroll_mob.save(out_mob_path, 'WEBP', quality=90, method=6)
        print(f"Created {out_mob_path} ({upscaled_scroll_mob.size})")

if __name__ == '__main__':
    main()
