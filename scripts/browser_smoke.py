from playwright.sync_api import sync_playwright
import json, os, time
from pathlib import Path

BASE=os.getenv('GAME_URL','http://localhost:5173/').rstrip('/')+'/'
OUT=Path('outputs')
OUT.mkdir(exist_ok=True)
errors=[]
def choose_year(page):
    if page.evaluate('JSON.parse(localStorage.getItem("modu-life-v1")||"null")?.pendingYearEvent'):
        page.locator('.event-content').wait_for(state='visible')
    if page.locator('.event-content').count():
        choices=page.locator('.event-choices button:not([disabled])')
        choices.first.click()
        page.locator('.outcome-content .primary').click()
def next_dialogue(page,answers):
    for answer in answers:
        page.locator('.dialogue-answers button').nth(answer).click()
        page.locator('.dialogue-reply .primary').click()
def go_hotspot(page,name):
    page.locator('.place-card').filter(has_text=name).click()
    skip=page.get_by_role('button',name='直接进去')
    if skip.count():skip.click()
    page.wait_for_timeout(150)
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
    context=browser.new_context(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page=context.new_page()
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(BASE+'?seed=TESTSHANGHAI')
    page.wait_for_load_state('networkidle')
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT/'home-desktop.png'),full_page=True)
    page.get_by_role('button',name='开局抽卡').click()
    page.get_by_role('button',name='全部揭晓').click()
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT/'draw-desktop.png'),full_page=True)
    page.locator('.setup-forward').click()
    page.locator('#player-name').fill('阿申')
    page.get_by_role('button',name='就这手牌，进上海').click()
    choose_year(page)
    page.wait_for_timeout(700)
    page.screenshot(path=str(OUT/'play-desktop.png'),full_page=True)
    # Actual five-wave reflex encounter.
    go_hotspot(page,'四元观景位')
    page.get_by_role('button',name='拿稳柠檬水，开始躲').click()
    until=time.time()+16
    while time.time()<until:
        if page.locator('.phase-done').count():break
        danger=page.locator('.phase-warn .laser-lane.danger')
        if danger.count():
            index=page.locator('.laser-lane').evaluate_all('(els)=>els.findIndex(e=>e.classList.contains("danger"))')
            page.locator('.laser-lane').nth((index+1)%3).click()
        page.wait_for_timeout(100)
    assert page.locator('.phase-done').count(), 'laser did not finish'
    page.screenshot(path=str(OUT/'laser-desktop.png'),full_page=True)
    page.get_by_role('button',name='喝完再走').click()
    page.locator('.outcome-content .primary').click()
    # A real three-round interview.
    page.locator('.career-summary').click()
    page.locator('.career-option').filter(has_text='技术研发').click()
    next_dialogue(page,[0,1,0])
    page.locator('.outcome-content .primary').click()
    # First date uses its own questions and records the selected person.
    go_hotspot(page,'江风约会')
    page.locator('.romance-grid button').first.click()
    next_dialogue(page,[0,1])
    page.locator('.date-parting-modal .event-choices button').first.click()
    page.locator('.outcome-content .primary').click()
    snapshot=json.loads(page.evaluate('localStorage.getItem("modu-life-v1")'))
    assert snapshot['actions']==0
    assert snapshot['jobId']=='tech'
    assert snapshot['relationships']['xia']['met']
    assert snapshot['flags'].count('laser_done')==1
    # Annual accounting and a free yearly event.
    page.locator('.year-button').click()
    page.locator('.outcome-content .primary').click()
    choose_year(page)
    assert '19' in page.locator('.age-row').inner_text()
    page.locator('.district-nav button').filter(has_text='莘庄').click()
    go_hotspot(page,'弄堂租房处')
    page.get_by_role('button',name='墙角',exact=True).click()
    page.get_by_role('button',name='合同',exact=True).click()
    page.get_by_role('button',name='窗外',exact=True).click()
    page.get_by_role('button',name='去跟方姐谈').click()
    page.get_by_role('button',name='划掉设备费，渗水也写进去').click()
    page.locator('.outcome-content .primary').click()
    lease=json.loads(page.evaluate('localStorage.getItem("modu-life-v1")'))
    assert lease['housing']==1 and lease['leaseRent']==3000
    # Save, reload, resume. Both filesystem and browser saves remain local.
    page.get_by_role('button',name='存档',exact=True).click()
    page.get_by_role('button',name='存这里').first.click()
    page.get_by_role('button',name='关闭',exact=True).click()
    page.reload();page.wait_for_load_state('networkidle')
    page.get_by_role('button',name='继续上回').click()
    assert '19' in page.locator('.age-row').inner_text()
    # All district transitions and night view must render without errors.
    page.get_by_role('button',name='3D 地图').click()
    for name in ['安福路','人民广场','陆家嘴','张江','外滩']:
        page.locator('.district-nav button').filter(has_text=name).click()
        page.wait_for_timeout(350)
        assert page.locator('canvas').count()==1
    page.get_by_role('button',name='切换夜景').click()
    page.wait_for_timeout(700);page.screenshot(path=str(OUT/'night-desktop.png'),full_page=True)
    saved=json.loads(page.evaluate('localStorage.getItem("modu-life-v1")'))
    (OUT/'smoke-save.json').write_text(json.dumps(saved,ensure_ascii=False))
    # Mobile layout and a complete fresh onboarding.
    mobile=browser.new_context(viewport={'width':390,'height':844},device_scale_factor=1,is_mobile=True,has_touch=True)
    m=mobile.new_page();m.on('pageerror',lambda e:errors.append(str(e)))
    m.goto(BASE+'?seed=MOBILE');m.wait_for_load_state('networkidle');m.wait_for_timeout(700)
    m.screenshot(path=str(OUT/'home-mobile.png'),full_page=True)
    assert m.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
    m.get_by_role('button',name='开局抽卡').click();m.get_by_role('button',name='全部揭晓').click();m.wait_for_timeout(700)
    m.screenshot(path=str(OUT/'draw-mobile.png'),full_page=True)
    m.locator('.setup-forward').click()
    m.get_by_role('button',name='就这手牌，进上海').click();choose_year(m)
    m.wait_for_timeout(700);m.screenshot(path=str(OUT/'play-mobile.png'),full_page=True)
    m.get_by_role('button',name='手头的事',exact=True).click()
    m.screenshot(path=str(OUT/'places-mobile.png'),full_page=True)
    assert m.locator('.places-sidebar.mobile-open').is_visible()
    print(json.dumps({'passed':True,'desktop':'1440×1000','mobile':'390×844','laser':'5波真实闪避','interview':'3轮通过','romance':'关系独立记忆','annual':'18→19','rental':'3线索后签约','save':'手动＋自动＋刷新恢复','districts':'六区与夜景','page_errors':errors},ensure_ascii=False))
    assert not errors, errors
    browser.close()

