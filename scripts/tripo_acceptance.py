from playwright.sync_api import sync_playwright
from pathlib import Path
import os,json
BASE=os.environ.get('GAME_URL','http://localhost:5173/').rstrip('/')+'/'
OUT=Path('outputs/tripo');OUT.mkdir(exist_ok=True,parents=True)
with sync_playwright() as w:
 b=w.chromium.launch(headless=True,channel='chrome',args=['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist'])
 context=b.new_context(viewport={'width':1440,'height':1000});p=context.new_page();errors=[];responses=[]
 p.on('pageerror',lambda e:errors.append(str(e)))
 p.on('response',lambda r:responses.append({'url':r.url,'status':r.status}) if 'night-owl-v1.glb' in r.url else None)
 p.goto(BASE+'?seed=NIGHTOWL');p.wait_for_load_state('networkidle')
 p.get_by_role('button',name='来，抽一手人生').click();p.get_by_role('button',name='全部揭晓').click();p.get_by_role('button',name='就这手牌，进上海').click();p.locator('.event-choices button').first.click();p.locator('.outcome-content .primary').click()
 p.wait_for_selector('[data-loaded-models*="night-owl"]');p.wait_for_timeout(800);p.screenshot(path=str(OUT/'owl-final-desktop.png'),full_page=True)
 p.get_by_role('button',name='打开夜猫子邮筒').click();p.locator('[data-model-preview=night-owl] canvas').wait_for();p.wait_for_timeout(700);p.screenshot(path=str(OUT/'owl-dialogue-desktop.png'),full_page=True)
 # Inspect rotation in the real GLB preview, then choose a story action.
 preview=p.locator('[data-model-preview=night-owl]');box=preview.bounding_box();p.mouse.move(box['x']+box['width']*.6,box['y']+box['height']*.4);p.mouse.down();p.mouse.move(box['x']+box['width']*.3,box['y']+box['height']*.45,steps=8);p.mouse.up()
 p.locator('.event-choices button').nth(2).click();p.locator('.outcome-content .primary').click();state=json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'));assert state['actions']==2 and 'owl_letter' in state['flags']
 p.get_by_role('button',name='切换夜景').click();p.wait_for_timeout(400);p.screenshot(path=str(OUT/'owl-night.png'),full_page=True)
 p.set_viewport_size({'width':390,'height':844});p.wait_for_timeout(500);p.screenshot(path=str(OUT/'owl-final-mobile.png'),full_page=True)
 p.get_by_role('button',name='打开夜猫子邮筒').click();p.locator('[data-model-preview=night-owl] canvas').wait_for();p.wait_for_timeout(500);p.screenshot(path=str(OUT/'owl-dialogue-mobile.png'),full_page=True)
 assert p.evaluate('document.documentElement.scrollWidth<=innerWidth+1')
 p.locator('.event-choices button').first.click();p.locator('.outcome-content .primary').click();assert json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'))['actions']==1
 p.reload();p.get_by_role('button',name='继续上回').click();p.wait_for_selector('[data-loaded-models*="night-owl"]');assert 'owl_met' in json.loads(p.evaluate('localStorage.getItem("modu-life-v1")'))['flags']
 assert responses and all(r['status']==200 for r in responses),responses
 if BASE.startswith('https://'):
  p.evaluate('navigator.serviceWorker.ready');p.wait_for_function('navigator.serviceWorker.controller!==null');context.set_offline(True);p.reload();p.get_by_role('button',name='继续上回').click();p.wait_for_selector('[data-loaded-models*="night-owl"]');p.get_by_role('button',name='打开夜猫子邮筒').click();p.locator('[data-model-preview=night-owl] canvas').wait_for()
 report={'base':BASE,'actual_glb_loaded':True,'rendered_3d_preview':True,'interactive_story':True,'action_cost_and_save':True,'desktop_mobile_night':True,'model_responses':responses,'page_errors':errors}
 (OUT/'acceptance.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps(report,ensure_ascii=False));assert not errors
 b.close()
