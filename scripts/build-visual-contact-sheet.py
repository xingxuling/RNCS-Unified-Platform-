from pathlib import Path
import argparse
from PIL import Image, ImageDraw


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--baseline', required=True)
    parser.add_argument('--candidate')
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    baseline = sorted(Path(args.baseline).glob('*.png'))
    if len(baseline) < 3:
        raise SystemExit('PHASE4_BASELINE_FRAMES_REQUIRED')
    candidate = sorted(Path(args.candidate).glob('*.png')) if args.candidate else []
    tile_w, tile_h = 480, 270
    sheet = Image.new('RGB', (tile_w * 2, tile_h * 3), '#101820')
    draw = ImageDraw.Draw(sheet)
    for index, frame in enumerate(baseline[:3]):
        with Image.open(frame).convert('RGB') as image:
            image.thumbnail((tile_w, tile_h))
            left = (tile_w - image.width) // 2
            top = (tile_h - image.height) // 2
            sheet.paste(image, (left, index * tile_h + top))
        draw.rectangle((0, index * tile_h, tile_w - 1, (index + 1) * tile_h - 1), outline='#758692', width=2)
        draw.text((12, index * tile_h + 12), f'PHASE 4 BASELINE {index + 1}', fill='#ecf4f5')
        right_top = index * tile_h
        if index < len(candidate):
            with Image.open(candidate[index]).convert('RGB') as image:
                image.thumbnail((tile_w, tile_h))
                left = tile_w + (tile_w - image.width) // 2
                top = right_top + (tile_h - image.height) // 2
                sheet.paste(image, (left, top))
            draw.rectangle((tile_w, right_top, tile_w * 2 - 1, right_top + tile_h - 1), outline='#5caf8a', width=2)
            draw.text((tile_w + 12, right_top + 12), f'PHASE 5 CANDIDATE {index + 1}', fill='#d9f2e4')
        else:
            draw.rectangle((tile_w, right_top, tile_w * 2 - 1, right_top + tile_h - 1), fill='#17232d', outline='#b35c5c', width=2)
            draw.text((tile_w + 24, right_top + 88), 'PHASE 5 FRAME MISSING', fill='#f0c3c3')
            draw.text((tile_w + 24, right_top + 122), 'BLOCKED: PROVIDER / MODEL / GPU', fill='#f0c3c3')
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, format='PNG')


if __name__ == '__main__':
    main()
