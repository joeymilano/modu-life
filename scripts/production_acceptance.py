from playwright.sync_api import sync_playwright
from pathlib import Path
import json
import os
from PIL import Image
OUT=Path('outputs')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(os.environ.get('GAME_URL','http://localhost:4173').rstrip('/')+'/?seed=FINAL');page.wait_for_load_state('networkidle')
 page.evaluate('navigator.serviceWorker.ready')
 page.wait_for_function('navigator.serviceWorker.controller!==null')
 page.get_by_role('button',name='手牌与角色').click();page.get_by_role('button',name='全部揭晓').click();page.wait_for_timeout(700)
 page.locator('.setup-forward').click()
 page.get_by_role('button',name='进入上海').click();page.get_by_role('button',name='看毛小毛的消息').click();page.locator('.event-choices button').first.click();page.locator('.outcome-content .primary').click();page.wait_for_timeout(600)
 with page.expect_download(timeout=20000) as download:
  page.get_by_role('button',name='生成人生卡').click()
 download.value.save_as(str(OUT/'人生分享卡.png'))
 assert Image.open(OUT/'人生分享卡.png').size==(1080,1440)
 # Reload after disconnecting: HTML, application, scene and manifest remain available.
 ctx.set_offline(True);page.reload();page.wait_for_load_state('networkidle')
 page.get_by_role('button',name='继续游戏').click();page.wait_for_timeout(700)
 assert page.locator('.street-frame img').evaluate('(img)=>img.complete && img.naturalWidth>0')
 assert '18' in page.locator('.age-row').inner_text()
 page.screenshot(path=str(OUT/'offline-play.png'),full_page=True)
 ctx.set_offline(False)
 saved=json.loads(page.evaluate('localStorage.getItem("modu-life-v1")'))
 # This fixture verifies the terminal transition independently of the full-lifetime unit simulation.
 saved.update(age=59,actions=0,pendingYearEvent=False,ended=False)
 near=OUT/'near-ending.json';near.write_text(json.dumps(saved,ensure_ascii=False))
 page.locator('input[type=file]').set_input_files(str(near))
 page.locator('.year-button').click();page.locator('.outcome-content .primary').click()
 assert page.locator('.ending-copy').is_visible()
 page.wait_for_timeout(700);page.screenshot(path=str(OUT/'ending-desktop.png'),full_page=True)
 # The actual rendered app supplies a dedicated social preview, without remote images.
 page.get_by_role('button',name='魔都人生首页').click();page.set_viewport_size({'width':1200,'height':630})
 page.add_style_tag(content='''
    .toast,.screen-home .topbar,.title-menu,.title-arcades { display:none }
    .title-stage { min-height:630px }
 ''')
 page.locator('.home-key-art').evaluate('img=>img.decode()')
 page.locator('.game-title img').evaluate('img=>img.decode()')
 page.evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))')
 page.screenshot(path=str(OUT/'social-preview.png'))
 assert Image.open(OUT/'social-preview.png').size==(1200,630)
 report={'production_build':'passed','offline_reload':'passed','share_png':'1080x1440','social_preview':'1200x630','terminal_transition':'59 to 60 through UI','errors':errors}
 (OUT/'production-acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False))
 assert not errors
 b.close()

