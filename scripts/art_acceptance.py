from playwright.sync_api import sync_playwright
from pathlib import Path
import json,os

BASE=os.environ.get('GAME_URL','http://localhost:5173/').rstrip('/')+'/'
OUT=Path('outputs');OUT.mkdir(exist_ok=True)
errors=[]
def annual(p):
    p.locator('.event-content').wait_for()
    p.locator('.event-choices button:not([disabled])').first.click()
    p.locator('.outcome-content .primary').click()
def hotspot(p,text):
    p.locator('.place-card').filter(has_text=text).click()
    skip=p.get_by_role('button',name='直接进去')
    if skip.count():skip.click()
with sync_playwright() as pw:
    b=pw.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    ctx=b.new_context(viewport={'width':1440,'height':1000},permissions=['clipboard-read','clipboard-write'])
    p=ctx.new_page();p.on('pageerror',lambda e:errors.append(str(e)))
    p.goto(BASE+'?seed=ARTLOOKS');p.wait_for_load_state('networkidle')
    art_dir=Path('public/art')
    assets=[file.relative_to(art_dir).as_posix() for folder in ('portraits','origins','encounters','dates','endings','work','pearl','matchmaking','opening','rental') for file in (art_dir/folder).rglob('*.webp')]
    assets.extend(file.relative_to(art_dir).as_posix() for file in (art_dir/'shanghai-streets').glob('*.webp'))
    for asset in assets:
        r=p.request.get(BASE+'art/'+asset);assert r.status==200,(asset,r.status)
        assert r.headers.get('content-type','').startswith('image/'),(asset,r.headers)
    for gender in ['female','male']:
        for looks,name in [('everyday','普通耐看'),('charming','颇有姿色'),('stunning','惊艳全场')]:
            p.get_by_role('button',name='开局抽卡').click()
            p.locator('.gender-picker button').nth(0 if gender=='female' else 1).click()
            p.get_by_role('button',name='颜值 '+name,exact=True).click()
            picked=p.get_by_role('button',name='颜值 '+name,exact=True)
            assert picked.get_attribute('aria-pressed')=='true'
            image=picked.locator('img')
            assert image.get_attribute('src')==f'/art/portraits/player-{gender}-{looks}.webp'
            assert image.evaluate('async img=>{await img.decode();return img.naturalHeight>700}')
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
    assert p.locator('.romance-grid .portrait-full img').evaluate_all('async images=>{await Promise.all(images.map(img=>img.decode()));return images.every(img=>img.naturalWidth>450)}')
    p.wait_for_timeout(300);p.screenshot(path=str(OUT/'romance-cast-desktop.png'),full_page=True)
    p.locator('.romance-grid button').nth(6).click()
    p.locator('.date-visual').wait_for();p.wait_for_timeout(300)
    p.screenshot(path=str(OUT/'date-desktop.png'),full_page=True)
    p.get_by_role('button',name='关闭',exact=True).click()
    # The room photograph is visible to all four edges, including the contract.
    p.get_by_role('navigation',name='切换城区').get_by_role('button',name='莘庄').click()
    hotspot(p,'弄堂租房处')
    room=p.locator('.room-scene')
    assert room.evaluate('el=>getComputedStyle(el,"::before").content==="none" && getComputedStyle(el).borderBottomWidth==="0px"')
    assert room.locator('img').evaluate('async img=>{await img.decode();return img.naturalWidth>700}')
    for clue,key in [('墙角','wall'),('合同','contract'),('窗外','window')]:
        button=room.get_by_role('button',name=clue,exact=True)
        button.click()
        assert button.get_attribute('aria-pressed')=='true'
        evidence=p.locator('.rental-detail img')
        assert evidence.get_attribute('src')==f'/art/rental/{key}.webp'
        assert evidence.evaluate('async img=>{await img.decode();return img.naturalWidth>1000}')
    assert p.locator('.rental-note').count()==3
    p.get_by_role('button',name='上楼看一眼').click()
    assert p.locator('.rental-detail img').get_attribute('src')=='/art/rental/upstairs.webp'
    p.get_by_role('button',name='关闭',exact=True).click()
    p.get_by_role('navigation',name='切换城区').get_by_role('button',name='外滩').click()
    # Mobile date, cast and image framing.
    p.set_viewport_size({'width':390,'height':844})
    hotspot(p,'江风约会')
    p.screenshot(path=str(OUT/'romance-cast-mobile.png'),full_page=True)
    p.locator('.romance-grid button').nth(4).click();p.wait_for_timeout(300)
    assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    p.screenshot(path=str(OUT/'date-mobile.png'),full_page=True)
    for turn,i in enumerate([1,2]):
        p.locator('.dialogue-answers button').nth(i).click();p.locator('.dialogue-reply .primary').click()
        if turn==0:
            shot=p.locator('.date-visual .date-shot.visible')
            shot.wait_for()
            assert shot.get_attribute('src')=='/art/dates/qiao-meeting.webp'
            assert shot.evaluate('async img=>{await img.decode();return img.naturalWidth>1000}')
    parting=p.locator('.date-parting-modal')
    assert parting.locator('.event-photo img').evaluate('async img=>{await img.decode();return img.naturalWidth>1000}')
    parting.get_by_role('button',name='送到这里就好').click()
    p.locator('.outcome-content .primary').click()
    assert json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'))['relationships']['qiao']['met']
    print(json.dumps({'passed':True,'appearance_combinations':6,'assets':len(assets),'save_export_reload':True,'legacy_save_migrated':True,'large_romance_portraits':8,'mobile_date_completed':True,'page_errors':errors},ensure_ascii=False))
    assert not errors,errors
    b.close()
