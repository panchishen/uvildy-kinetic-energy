"""Сборка роликов страницы из исходников (../../assets/video/*.mp4) в assets/video/*.mp4.

Ролики из генератора тяжёлые (4–20 МБ) и со звуком, который на сайте не нужен.
Здесь: без звука, H.264 (играет везде), кадр под пропорции блока с запасом для ретины,
faststart — воспроизведение начинается до полной загрузки.

Запуск из 03-code:  python tools/build_videos.py
ffmpeg — из переменной FFMPEG или из PATH.
"""
import os
import shutil
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.normpath(os.path.join(ROOT, '..', 'assets', 'video'))
OUT_DIR = os.path.join(ROOT, 'assets', 'video')

# слот: (ширина, высота итогового кадра, центр выреза по горизонтали в долях кадра)
VIDEOS = {
    'hero-1': (1280, 960, 0.5), 'hero-2': (1280, 960, 0.5), 'hero-3': (1280, 960, 0.5),
    'hero-4': (1280, 960, 0.5), 'hero-5': (1280, 960, 0.5),
    'doctor-lead': (768, 960, 0.5),
    'program-video': (1280, 928, 0.5),
    # отзывы сняты горизонтально, карточка вертикальная — вырез по человеку в кадре
    'review-video-1': (424, 716, 0.66),
    'review-video-2': (424, 716, 0.52),
}
CRF = 23


def ffmpeg_bin():
    path = os.environ.get('FFMPEG') or shutil.which('ffmpeg')
    if not path:
        sys.exit('ffmpeg не найден: укажите путь в переменной FFMPEG')
    return path


def build(ff, src, out, w, h, focus):
    aspect = w / h
    # вырезаем кадр нужных пропорций: по высоте целиком, по ширине — вокруг focus
    crop = (f"crop='min(iw,ih*{aspect:.5f})':'min(ih,iw/{aspect:.5f})':"
            f"'max(0,min(iw-ow,iw*{focus}-ow/2))':'(ih-oh)/2'")
    vf = f'{crop},scale={w}:{h}:flags=lanczos,setsar=1,format=yuv420p'
    cmd = [ff, '-loglevel', 'error', '-y', '-i', src, '-an', '-vf', vf,
           '-c:v', 'libx264', '-preset', 'slow', '-crf', str(CRF), '-profile:v', 'high',
           '-movflags', '+faststart', out]
    subprocess.run(cmd, check=True)


def main():
    ff = ffmpeg_bin()
    os.makedirs(OUT_DIR, exist_ok=True)
    for slot, (w, h, focus) in VIDEOS.items():
        for theme in ('a', 'b'):
            name = f'{slot}-{theme}.mp4'
            src = os.path.join(SRC_DIR, name)
            if not os.path.exists(src):
                print(f'нет исходника: {name}')
                continue
            out = os.path.join(OUT_DIR, name)
            build(ff, src, out, w, h, focus)
            print(f'{name:24} {w}x{h}  {os.path.getsize(out) / 1e6:.2f} МБ')


if __name__ == '__main__':
    main()
