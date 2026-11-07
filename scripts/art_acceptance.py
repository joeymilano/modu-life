from playwright.sync_api import sync_playwright
from pathlib import Path
import json
from urllib.parse import urlparse,parse_qs

BASE='http://localhost:5173/'
OUT=Path('outputs');OUT.mkdir(exist_ok=True)
errors=[]
def annual(p):
    p.locator('.event-content').wait_for()
    p.locator('.event-choices button:not([disabled])').first.click()
    p.locator('.outcome-content .primary').click()
def hotspot(p,text):
    p.locator('.place-card').filter(has_text=text).click()
    p.get_by_role('button',name='直接进去').click()
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
    p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(BASE+'?seed=ARTLOOKS');p.wait_for_load_state('networkidle')
    assets=['player-female','player-male','romance-female','romance-male','supporting-cast','cards-birth','cards-wealth','cards-talent','cards-ties','cards-secrets','story-scenes','shanghai-night','rental-room','pearl-laser']
    for a in assets:
        r=p.request.get(BASE+'art/'+a+'.webp');assert r.status==200,(a,r.status)
        assert r.headers.get('content-type','').startswith('image/'),(a,r.headers)
    for gender in ['female','male']:
        for looks,name in [('everyday','普通耐看'),('charming','颇有姿色'),('stunning','惊艳全场')]:
            p.get_by_role('button',name='开局抽卡').click()
            p.locator('.gender-picker button').nth(0 if gender=='female' else 1).click()
            p.get_by_role('button',name='颜值 '+name,exact=True).click()
            assert p.get_by_role('button',name='颜值 '+name,exact=True).get_attribute('aria-pressed')=='true'
            p.get_by_role('button',name='全部揭晓').click()
            p.get_by_role('button',name='就这手牌，进上海').click()
            annual(p)
            saved=json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'))
            assert saved['appearance']=={'gender':gender,'looks':looks}
            if p.get_by_role('button',name='3D 地图').count():p.get_by_role('button',name='3D 地图').click()
            p.locator('[data-avatar-gender]').wait_for()
            assert p.locator('[data-avatar-gender]').get_attribute('data-avatar-gender')==gender
            assert p.locator('[data-avatar-looks]').get_attribute('data-avatar-looks')==looks
            assert name in p.locator('.player-identity').inner_text()
            if gender=='male' and looks=='stunning':p.screenshot(path=str(OUT/'male-player.png'),full_page=True)
            p.get_by_role('button',name='魔都人生首页',exact=True).click()
    # Verify the selected appearance survives reload and both save formats.
    p.reload();p.get_by_role('button',name='继续上回').click();p.wait_for_timeout(500)
    assert '男性 · 惊艳全场' in p.locator('.player-identity').inner_text()
    p.get_by_role('button',name='存档',exact=True).click()
    with p.expect_download() as d:p.get_by_role('button',name='导出当前人生',exact=True).click()
    exported=json.loads(Path(d.value.path()).read_text())
    assert exported['appearance']=={'gender':'male','looks':'stunning'}
    legacy={k:v for k,v in exported.items() if k!='appearance'}
    legacy_path=OUT/'legacy-without-appearance.json';legacy_path.write_text(json.dumps(legacy,ensure_ascii=False))
    p.locator('input[type=file]').set_input_files(str(legacy_path))
    p.wait_for_timeout(300)
    assert '男性 · 普通耐看' in p.locator('.player-identity').inner_text()
    # Romance now uses large generated portraits rather than simple SVG faces.
    hotspot(p,'江风约会')
    p.locator('.romance-grid .portrait-full').first.wait_for()
    assert p.locator('.romance-grid .portrait-full').count()==8
    p.wait_for_timeout(300);p.screenshot(path=str(OUT/'romance-cast-desktop.png'),full_page=True)
    p.locator('.romance-grid button').nth(6).click()
    p.locator('.date-visual').wait_for();p.wait_for_timeout(300)
    p.screenshot(path=str(OUT/'date-desktop.png'),full_page=True)
    p.get_by_role('button',name='关闭',exact=True).click()
    # Narrative art and rental investigation still have usable choices.
    hotspot(p,'江边长椅');p.locator('.event-content').wait_for();p.screenshot(path=str(OUT/'story-desktop.png'),full_page=True)
    p.get_by_role('button',name='关闭',exact=True).click()
    # Mobile date, cast and image framing.
    p.set_viewport_size({'width':390,'height':844})
    hotspot(p,'江风约会')
    p.screenshot(path=str(OUT/'romance-cast-mobile.png'),full_page=True)
    p.locator('.romance-grid button').nth(4).click();p.wait_for_timeout(300)
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    p.screenshot(path=str(OUT/'date-mobile.png'),full_page=True)
    for i in [1,2,2]:
        p.locator('.dialogue-answers button').nth(i).click();p.locator('.dialogue-reply .primary').click()
    p.locator('.outcome-content .primary').click()
    assert json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'))['relationships']['qiao']['met']
    print(json.dumps({'passed':True,'appearance_combinations':6,'assets':14,'save_export_reload':True,'legacy_save_migrated':True,'large_romance_portraits':8,'mobile_date_completed':True,'page_errors':errors},ensure_ascii=False))
    assert not errors,errors
    b.close()
