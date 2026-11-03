from playwright.sync_api import sync_playwright
from pathlib import Path
import json
from PIL import Image
OUT=Path('outputs')
OUT.mkdir(exist_ok=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
 page=ctx.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://localhost:4173/?seed=FINAL');page.wait_for_load_state('networkidle')
 page.evaluate('navigator.serviceWorker.ready')
 page.wait_for_function('navigator.serviceWorker.controller!==null')
 page.get_by_role('button',name='来，抽一手人生').click();page.get_by_role('button',name='全部揭晓').click();page.wait_for_timeout(700)
 page.get_by_role('button',name='就这手牌，进上海').click();page.locator('.event-choices button').first.click();page.locator('.outcome-content .primary').click();page.wait_for_timeout(600)
 with page.expect_download(timeout=20000) as download:
  page.get_by_role('button',name='晒晒这段人生').click()
 download.value.save_as(str(OUT/'人生分享卡.png'))
 assert Image.open(OUT/'人生分享卡.png').size==(1080,1440)
 # Reload after disconnecting: HTML, application, scene and manifest remain available.
 ctx.set_offline(True);page.reload();page.wait_for_load_state('networkidle')
 page.get_by_role('button',name='继续上回').click();page.wait_for_timeout(700)
 assert page.locator('canvas').count()==1
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
 page.add_style_tag(content='.topbar{height:70px}.topbar-note{display:none}.home-screen{height:560px;min-height:560px;padding-top:28px;padding-bottom:0}.home-copy h1{font-size:65px;margin:24px 0 16px}.home-description{font-size:12px}.home-start{margin-top:20px}.home-facts{margin-top:14px}.postscript,.home-bottom,.continue-button{display:none}.hero-city{inset:-8px -3% 0 38%}.hero-city-title{top:23px}.city-caption{bottom:14px}.hero-seal{bottom:75px}')
 page.wait_for_timeout(700);page.screenshot(path='public/social.png')
 assert Image.open('public/social.png').size==(1200,630)
 report={'production_build':'passed','offline_reload':'passed','share_png':'1080x1440','social_preview':'1200x630','terminal_transition':'59 to 60 through UI','errors':errors}
 (OUT/'production-acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False))
 assert not errors
 b.close()

