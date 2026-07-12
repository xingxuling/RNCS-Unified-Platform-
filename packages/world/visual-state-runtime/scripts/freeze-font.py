#!/usr/bin/env python3
import argparse, hashlib, json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser=argparse.ArgumentParser(description='Freeze a local TTF/OTF/TTC font into a deterministic VSR bitmap subset.')
parser.add_argument('--font',required=True);parser.add_argument('--family',required=True);parser.add_argument('--text-file',required=True);parser.add_argument('--size',type=int,default=20);parser.add_argument('--out',required=True)
args=parser.parse_args()
font_path=Path(args.font);text=Path(args.text_file).read_text(encoding='utf-8')
glyphs=sorted(set(ch for ch in text if ch not in '\r\n'),key=ord)
if not glyphs: glyphs=[' ']
font=ImageFont.truetype(str(font_path),args.size,index=0)
boxes=[]
for ch in glyphs:
    box=font.getbbox(ch,anchor='lt') or (0,0,args.size,args.size)
    boxes.append(box)
min_left=min(b[0] for b in boxes);min_top=min(b[1] for b in boxes);max_right=max(b[2] for b in boxes);max_bottom=max(b[3] for b in boxes)
padding=1;width=max(1,max_right-min_left+padding*2);height=max(1,max_bottom-min_top+padding*2)
encoded={}
for ch in glyphs:
    image=Image.new('L',(width,height),0);draw=ImageDraw.Draw(image);draw.text((padding-min_left,padding-min_top),ch,font=font,fill=255,anchor='lt')
    pixels=image.load();encoded[ch]=[''.join('1' if pixels[x,y]>=96 else '0' for x in range(width)) for y in range(height)]
fallback=['1'*width if y in (0,height-1) else ('1'+'0'*max(0,width-2)+'1') for y in range(height)]
source_hash=hashlib.sha256(font_path.read_bytes()).hexdigest();glyph_hash=hashlib.sha256(''.join(glyphs).encode('utf-8')).hexdigest()
payload={'format':'vsr-bitmap-font-1','family':args.family,'glyphWidth':width,'glyphHeight':height,'advance':width+1,'glyphs':encoded,'fallback':fallback,'metadata':{'sourceFontHash':source_hash,'glyphSetHash':glyph_hash,'glyphCount':len(glyphs),'generatedBy':'VSR font-freeze 0.1.0-alpha.12 + Pillow','pixelSize':args.size}}
Path(args.out).parent.mkdir(parents=True,exist_ok=True);Path(args.out).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'ok':True,'output':str(Path(args.out).resolve()),'glyphCount':len(glyphs),'sourceFontHash':source_hash,'glyphSetHash':glyph_hash},ensure_ascii=False))
