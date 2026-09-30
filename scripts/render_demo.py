"""Generate the authored illustrative GIF and the social card. Pillow required."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
BG, INK, GOLD, MUTED = '#201820', '#f6edda', '#deb668', '#c5b6bf'
FONT = str(ROOT / 'docs/fonts/DejaVuSerif.ttf')
MONO = str(ROOT / 'docs/fonts/DejaVuSansMono.ttf')
def font(n, mono=False):
    return ImageFont.truetype(MONO if mono else FONT, n)
def base(w,h):
    im=Image.new('RGB',(w,h),BG)
    d=ImageDraw.Draw(im)
    d.rectangle((24,24,w-25,h-25),outline=GOLD,width=2)
    d.line((50,94,w-50,94),fill=GOLD,width=1)
    return im,d

def main():
    (ROOT/'docs').mkdir(exist_ok=True)
    frames=[]
    rows=[('> Should I rebuild my working blog this weekend?',INK),
          ('Most judicious, sire.',GOLD),
          ('A fresh framework would give the court much to',INK),
          ('discuss and your readers very little to notice.',INK),
          ('Keep the current site. Publish one useful article.',GOLD)]
    for count in range(6):
        im,d=base(1100,550)
        d.text((50,46),'EUNUCH MODE / ILLUSTRATIVE SAMPLE',font=font(20,True),fill=GOLD)
        for i,(text,color) in enumerate(rows[:count]):
            d.text((50,130+i*65),text,font=font(26,True),fill=color)
        frames.append(im)
    frames[0].save(ROOT/'docs/demo.gif',save_all=True,append_images=frames[1:],duration=[900,1500,1300,1500,1500,5000],loop=0)
    im,d=base(1280,640)
    d.text((60,45),'THE IMPERIAL DEPARTMENT OF QUESTIONABLE IDEAS',font=font(20,True),fill=GOLD)
    d.text((58,150),'Eunuch Mode',font=font(98),fill=INK)
    d.text((65,300),'Most judicious, sire.',font=font(48),fill=GOLD)
    d.text((65,405),'A palace adviser for your AI assistant.',font=font(29,True),fill=INK)
    d.text((65,536),'Flattery: ceremonial. Advice: candid.',font=font(26,True),fill=MUTED)
    im.save(ROOT/'docs/social-preview.png')
    print('Generated docs/demo.gif and docs/social-preview.png')
if __name__=='__main__':
    main()
