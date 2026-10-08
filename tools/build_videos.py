"""Сборка роликов страницы из исходников (../../assets/video/*.mp4) в assets/video/*.mp4.

Ролики из генератора тяжёлые (4–20 МБ) и со звуком, который на сайте не нужен.
Здесь: без звука, H.264 (играет везде), кадр под пропорции блока с запасом для ретины,
faststart — воспроизведение начинается до полной загрузки.

Исходники бывают двух видов:
  slot-a.mp4 / slot-b.mp4 — свой ролик на каждую тему;
  slot-n.mp4              — один ролик на обе темы: для каждой темы цвет подгоняется под её обложку
                            (сопоставление гистограмм первого кадра и обложки по каналам R, G, B → 1D LUT),
                            чтобы при появлении видео поверх обложки не было скачка цвета.

Запуск из 03-code:  python tools/build_videos.py [slot ...]
ffmpeg — из переменной FFMPEG или из PATH. Для подгонки цвета нужны Pillow и numpy.
"""
import json
import os
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.normpath(os.path.join(ROOT, '..', 'assets', 'video'))
IMG_SRC_DIR = os.path.normpath(os.path.join(ROOT, '..', 'assets', 'img'))
OUT_DIR = os.path.join(ROOT, 'assets', 'video')
IMAGES_MANIFEST = os.path.join(ROOT, 'tools', 'images.json')

# слот: (ширина, высота итогового кадра, центр выреза по горизонтали в долях кадра)
VIDEOS = {
    'hero-1': (1280, 960, 0.5), 'hero-2': (1280, 960, 0.5), 'hero-3': (1280, 960, 0.5),
    'hero-4': (1280, 960, 0.5), 'hero-5': (1280, 960, 0.5),
    'doctor-lead': (768, 960, 0.5),
    'approach-photo': (768, 960, 0.5),
    'program-video': (1280, 928, 0.5),
    'family-hero': (1280, 960, 0.5),
    'video-consult': (1280, 720, 0.5),
    # отзывы сняты горизонтально, карточка вертикальная — вырез по человеку в кадре
    'review-video-1': (424, 716, 0.66),
    'review-video-2': (424, 716, 0.52),
    'review-video-3': (566, 956, 0.64),
    'review-video-4': (566, 956, 0.5),
    'podcast-1': (768, 432, 0.5), 'podcast-2': (768, 432, 0.5), 'podcast-3': (768, 432, 0.5),
}
CRF = 23
# Обложка темы B снята по другому кадру, чем общий ролик (например, другая одежда) — подгонять цвет
# под неё нельзя. Тогда ролик подгоняется под обложку A, сверху — перевод «A → B», снятый с пары
# обложек соседнего слота с той же сценой; обложка B потом берётся из первого кадра ролика.
STYLE_FROM = {'podcast-2': 'podcast-3'}


def ffmpeg_bin():
    path = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    if not path:
        sys.exit('ffmpeg не найден: укажите путь в переменной FFMPEG')
    return path


def crop_filter(w, h, focus):
    aspect = w / h
    # кадр нужных пропорций: по высоте целиком, по ширине — вокруг focus
    crop = (f"crop='min(iw,ih*{aspect:.5f})':'min(ih,iw/{aspect:.5f})':"
            f"'max(0,min(iw-ow,iw*{focus}-ow/2))':'(ih-oh)/2'")
    return f'{crop},scale={w}:{h}:flags=lanczos,setsar=1'


def poster_array(poster, w, h):
    """Обложка из исходника с тем же вырезом, что в build_images.py."""
    import numpy as np
    from PIL import Image
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from build_images import center_crop
    img = Image.open(os.path.join(IMG_SRC_DIR, poster['src'])).convert('RGB')
    return np.asarray(center_crop(img, w / h, poster.get('focus_x', 0.5)).resize((w, h), Image.LANCZOS))


def match_curves(src, dst):
    """Кривые по каналам: гистограммы src → гистограммы dst (значения 0–255)."""
    import numpy as np
    levels = np.arange(256)
    curves = []
    for c in range(3):
        src_cdf = np.cumsum(np.bincount(src[..., c].ravel(), minlength=256)).astype(float)
        dst_cdf = np.cumsum(np.bincount(dst[..., c].ravel(), minlength=256)).astype(float)
        curve = np.interp(src_cdf / src_cdf[-1], dst_cdf / dst_cdf[-1], levels)
        curve = np.convolve(np.pad(curve, 4, mode='edge'), np.ones(9) / 9, mode='valid')  # без ступенек
        curves.append(np.maximum.accumulate(curve))
    return curves


def grade_lut(ff, src, w, h, focus, poster, workdir, style=None):
    """1D LUT: первый кадр ролика → обложка темы; style=(обложка A, обложка B) соседнего слота — сверху перевод A → B."""
    import numpy as np
    from PIL import Image
    frame_path = os.path.join(workdir, 'frame.png')
    subprocess.run([ff, '-loglevel', 'error', '-y', '-i', src, '-frames:v', '1',
                    '-vf', crop_filter(w, h, focus), frame_path], check=True)
    frame = np.asarray(Image.open(frame_path).convert('RGB'))
    curves = match_curves(frame, poster_array(poster, w, h))
    if style:
        style_curves = match_curves(poster_array(style[0], w, h), poster_array(style[1], w, h))
        curves = [np.interp(curves[c], np.arange(256), style_curves[c]) for c in range(3)]
    curves = [c / 255.0 for c in curves]
    lut_path = os.path.join(workdir, 'grade.cube')
    with open(lut_path, 'w') as f:
        f.write('LUT_1D_SIZE 256\n')
        for i in range(256):
            f.write(f'{curves[0][i]:.6f} {curves[1][i]:.6f} {curves[2][i]:.6f}\n')
    return 'grade.cube'


def build(ff, src, out, w, h, focus, poster=None, style=None):
    with tempfile.TemporaryDirectory() as workdir:
        vf = crop_filter(w, h, focus)
        if poster:
            # путь к LUT относительный: ffmpeg запускается из workdir (в фильтрах Windows-пути неудобны)
            vf += f",lut1d=file={grade_lut(ff, src, w, h, focus, poster, workdir, style)}"
        vf += ',format=yuv420p'
        cmd = [ff, '-loglevel', 'error', '-y', '-i', os.path.abspath(src), '-an', '-vf', vf,
               '-c:v', 'libx264', '-preset', 'slow', '-crf', str(CRF), '-profile:v', 'high',
               '-movflags', '+faststart', os.path.abspath(out)]
        subprocess.run(cmd, check=True, cwd=workdir)


def main():
    ff = ffmpeg_bin()
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(IMAGES_MANIFEST, encoding='utf-8') as f:
        posters = {e['out']: e for e in json.load(f)}
    only = set(sys.argv[1:])
    for slot, (w, h, focus) in VIDEOS.items():
        if only and slot not in only:
            continue
        shared = os.path.join(SRC_DIR, f'{slot}-n.mp4')
        for theme in ('a', 'b'):
            name = f'{slot}-{theme}.mp4'
            own = os.path.join(SRC_DIR, name)
            style = None
            if os.path.exists(own):
                src, poster = own, None
            elif os.path.exists(shared):
                src, poster = shared, posters.get(f'{slot}-{theme}')
                style = None
                if theme == 'b' and slot in STYLE_FROM:
                    ref = STYLE_FROM[slot]
                    poster = posters.get(f'{slot}-a')
                    style = (posters[f'{ref}-a'], posters[f'{ref}-b'])
            else:
                print(f'нет исходника: {name}')
                continue
            out = os.path.join(OUT_DIR, name)
            build(ff, src, out, w, h, focus, poster, style if poster else None)
            note = ' (общий ролик, цвет под обложку)' if poster else ''
            print(f'{name:24} {w}x{h}  {os.path.getsize(out) / 1e6:.2f} МБ{note}')


if __name__ == '__main__':
    main()
