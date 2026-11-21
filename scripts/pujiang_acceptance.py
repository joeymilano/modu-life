"""UI acceptance for the new edition; isolated browser contexts, no state injection.

GAME_URL=http://127.0.0.1:4177 python3 scripts/pujiang_acceptance.py
PW_BROWSER=webkit also exercises WebKit using the same real click paths.
"""
import json
import os
import time
from pathlib import Path
from playwright.sync_api import expect, sync_playwright

BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:4177').rstrip('/')
BROWSER = os.environ.get('PW_BROWSER', 'chromium')
OUT = Path(os.environ.get('PJ_OUTPUT', 'outputs/pujiang')) / BROWSER
OUT.mkdir(parents=True, exist_ok=True)
REPORT = []
OPENINGS = {
 '随机出身': (['announce', 'host', 'stage'], ['wait', 'cut', 'yield']),
 '日结工': (['night', 'sort', 'crew'], ['self', 'rush', 'take']),
 '顶级富二代': (['team', 'guarantee', 'own'], ['listen', 'boast', 'stepback']),
 '系统流': (['cargo', 'explain', 'share'], ['follow', 'chase', 'letgo']),
}
CHAPTERS = {
 18: ['cargo', 'explain', 'share'], 19: ['joint', 'xutruck', 'partners'],
 20: ['team', 'service', 'joint'], 21: ['user', 'request', 'coalition'],
 22: ['disclose', 'release', 'share'], 23: ['assign', 'call', 'together'],
 24: ['small', 'combine', 'present'], 25: ['table', 'release', 'together'],
}

def state(page):
 return page.evaluate("JSON.parse(localStorage.getItem('modu-life-v1'))")

def snap(page, name):
 page.locator('.modal').evaluate_all('(es)=>Promise.all(es.flatMap(e=>e.getAnimations().map(a=>a.finished)))')
 assert page.locator('.modal').evaluate_all('(es)=>es.every(e=>e.scrollWidth<=e.clientWidth+1)'), name
 page.screenshot(path=str(OUT / (name + '.png')), full_page=True)

def start(page, origin):
 page.goto(BASE, wait_until='networkidle')
 page.get_by_role('button', name='选择出身', exact=True).click()
 page.locator('.life-start-options button').filter(has_text=origin).click()
 expect(page.locator('[data-mode=prologue]')).to_be_visible()
 for image in ('.vn-scenery', '.vn-actor'):
  page.locator(image).evaluate('img => img.decode()')
 page.locator('[data-vn-next=meet]').click()
 page.locator('[data-pj-prologue]').first.click()
 expect(page.locator('[data-page=reply]')).to_be_visible()
 page.locator('[data-vn-next=ask]').click()
 page.locator('[data-pj-prologue=stay]').click()
 page.locator('[data-vn-next=leave]').click()
 expect(page.locator('[data-pj-start]')).to_be_visible()

def menu(page, name):
 page.get_by_role('button', name='菜单', exact=True).click()
 page.get_by_role('dialog').get_by_role('button', name=name, exact=True).click()

def choose(page, choice):
 page.locator(f'[data-pj-choice="{choice}"]').click()

def clear_annual(page):
 for _ in range(12):
  if page.locator('.year-outcome .primary').is_visible():
   page.locator('.year-outcome .primary').click()
  elif page.locator('.event-choices button:enabled').first.is_visible():
   page.locator('.event-choices button:enabled').first.click()
  elif page.locator('.outcome-content > button').filter(has_text='继续').is_visible():
   page.locator('.outcome-content > button').filter(has_text='继续').click()
  else:
   if state(page)['pendingYearEvent'] and not page.locator('[data-pj-start]').count():
    page.locator('.event-choices button:enabled').first.wait_for(state='visible')
    continue
   return
 raise AssertionError('Annual scenes did not settle')

def advance(page):
 clear_annual(page)
 menu(page, '主线')
 page.get_by_role('button', name='快进到下一场').click()
 page.locator('.year-outcome .primary').click()

def new_page(browser, width):
 context = browser.new_context(viewport={'width': width, 'height': 900 if width > 600 else 844}, has_touch=width < 600, accept_downloads=True)
 page = context.new_page()
 page.set_default_timeout(7000)
 errors = []
 page.on('pageerror', lambda e: errors.append(str(e)))
 return context, page, errors

def opening(browser, width, origin, won):
 context, page, errors = new_page(browser, width)
 try:
  start(page, origin)
  initial = state(page)
  page.locator('[data-pj-start]').click()
  for c in OPENINGS[origin][0 if won else 1]: choose(page, c)
  expect(page.locator('[data-pj-done]')).to_be_visible()
  result = state(page)
  assert result['episode']['receipt']['verdict'] == ('win' if won else 'loss'), result['episode']['receipt']
  assert result['actions'] == initial['actions']
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  if origin == '顶级富二代': assert result['cash'] > 59_000_000
  if won: snap(page, f'opening-{origin}-{width}')
  cash = result['cash']
  page.reload(wait_until='networkidle')
  page.get_by_role('button', name='继续游戏').click()
  expect(page.locator('[data-pj-done]')).to_be_visible()
  assert state(page)['cash'] == cash
  assert not errors, errors
  REPORT.append({'origin': origin, 'width': width, 'verdict': result['episode']['receipt']['verdict'], 'refresh_reward_once': True})
 finally:
  context.close()

def complete_system(browser, width):
 context, page, errors = new_page(browser, width)
 try:
  start(page, '系统流')
  for age, moves in CHAPTERS.items():
   assert state(page)['age'] == age
   if age == 18: page.locator('[data-learn="insight"]').click()
   if age == 19:
    page.locator('[data-learn="seek"]').click()
    page.locator('[data-equip="insight"]').click(); page.locator('[data-equip="seek"]').click()
   if age == 20: page.locator('[data-equip="insight"]').click()
   if age == 22:
    page.locator('[data-learn="forecast"]').click()
    page.locator('[data-equip="seek"]').click(); page.locator('[data-equip="forecast"]').click()
   if age == 24:
    page.locator('[data-learn="borrow"]').click(); page.locator('[data-learn="combine"]').click()
    for a in ['insight', 'forecast', 'borrow', 'combine']: page.locator(f'[data-equip="{a}"]').click()
   if age in (18, 22): snap(page, f'loadout-{age}-{width}')
   page.locator('[data-pj-start]').click()
   if age == 18: page.locator('[data-ability="insight"]').dblclick()
   if age in (20, 21): page.locator('[data-ability="insight"]').click()
   if age == 18:
    expect(page.locator('.pj-secret')).to_be_visible()
    choose(page, moves[0])
    page.get_by_role('button', name='保存并回首页').click()
    menu_save = page.get_by_role('button', name='存档', exact=True)
    menu_save.click()
    page.get_by_role('button', name='存这里', exact=True).first.click()
    with page.expect_download() as info: page.get_by_role('button', name='导出档案').click()
    exported = OUT / f'in-progress-{width}.json'
    info.value.save_as(str(exported))
    assert json.loads(exported.read_text())['episode']['moves'][0]['kind'] == 'ability'
    page.locator('input[type="file"]').set_input_files(str(exported.resolve()))
    expect(page.locator('[data-pj-choice="explain"]')).to_be_visible()
    assert page.locator('[data-ability="insight"]').is_disabled()
    assert len(state(page)['episode']['moves']) == 2
    page.reload(wait_until='networkidle'); page.get_by_role('button', name='继续游戏').click()
    expect(page.locator('[data-pj-choice="explain"]')).to_be_visible()
    assert page.locator('[data-ability="insight"]').is_disabled()
    snap(page, f'resumed-scene-{width}')
   if age == 19: page.locator('[data-ability="seek"]').click()
   if age == 22:
    page.locator('[data-ability="forecast"]').click()
    page.locator('[data-pj-predict="disclose"]').click()
    expect(page.locator('.pj-preview')).to_have_count(1)
    assert page.locator('[data-ability="forecast"]').is_disabled()
    snap(page, f'forecast-{width}')
   if age == 23:
    assert page.locator('[data-ability]:enabled').count() == 0
    snap(page, f'offline-{width}')
   for index, move in enumerate(moves):
    if age == 18 and index == 0: continue
    if age == 24 and index == 1: page.locator('[data-ability="combine"]').click()
    choose(page, move)
   expect(page.locator('[data-pj-done]')).to_be_visible()
   saved = state(page)
   assert saved['episode']['receipt']['verdict'] == 'win', (age, saved['episode']['receipt'])
   assert saved['actions'] == 3
   REPORT.append({'width': width, 'chapter': age, 'verdict': 'win', 'cash': saved['cash']})
   if age == 25: snap(page, f'ending-together-{width}')
   page.locator('[data-pj-done]').click()
   if age < 25: advance(page)
  clear_annual(page)
  # The other final choices are reached by the actual timeline controls.
  for ending in ['independent', 'leave']:
   menu(page, '时间线')
   point = page.locator('.life-line-points li').filter(has_text='把光留给谁')
   point.get_by_role('button', name='从这里开分支').click()
   expect(page.locator(f'[data-pj-choice="{ending}"]')).to_be_visible()
   choose(page, ending)
   expect(page.locator('[data-pj-done]')).to_be_visible()
   assert state(page)['episode']['receipt']['ending'] == ending
   assert state(page)['episode']['receipt']['verdict'] == 'win'
   snap(page, f'ending-{ending}-{width}')
   page.locator('[data-pj-done]').click()
  # Six distinct districts; once only, one action each; two years are needed.
  menu(page, '系统')
  page.locator('[data-learn="resonate"]').click()
  for a in ['borrow', 'combine', 'seek', 'resonate']: page.locator(f'[data-equip="{a}"]').click()
  page.get_by_role('button', name='关闭', exact=True).click()
  for index, district in enumerate(['bund', 'anfu', 'people', 'lujiazui', 'zhangjiang', 'xinzhuang']):
   if state(page)['actions'] == 0: advance(page); clear_annual(page)
   menu(page, '系统')
   before = state(page)['actions']
   page.locator(f'[data-commission="{district}"]').click()
   assert state(page)['actions'] == before - 1
   if index == 0:
    page.locator('[data-ability="resonate"]').click()
    page.locator('[data-pj-aid="dispatch"]').click()
    assert page.locator('[data-ability="resonate"]').is_disabled()
    snap(page, f'cooperation-{width}')
   choose(page, 'cooperate'); choose(page, 'join')
   assert state(page)['episode']['receipt']['verdict'] == 'win'
   page.locator('[data-pj-done]').click()
   menu(page, '系统')
   assert page.locator(f'[data-commission="{district}"]').is_disabled()
   page.get_by_role('button', name='关闭', exact=True).click()
  for _ in range(60):
   if page.locator('.screen-end').is_visible(): break
   clear_annual(page)
   if state(page)['ended']: break
   advance(page)
  expect(page.locator('.screen-end')).to_be_visible()
  final = state(page)
  assert final['age'] == 60 and 'pj-after-57' in final['seenEvents']
  assert final['systemProgress']['rewardCash'] <= 3_000_000
  assert len(final['lifeLines']['lines']) == 3
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
  assert not errors, errors
  snap(page, f'life-60-{width}')
  REPORT.append({'width': width, 'all_chapters': 8, 'endings': 3, 'commissions': 6, 'age': 60, 'errors': errors, 'save_import_refresh_branch': 'pass'})
 except Exception:
  snap(page, f'failure-{width}')
  (OUT / f'failure-{width}.txt').write_text(page.locator('body').inner_text())
  raise
 finally:
  context.close()

if __name__ == '__main__':
 with sync_playwright() as p:
  browser = getattr(p, BROWSER).launch(headless=True)
  try:
   for width in (1440, 390):
    for origin in OPENINGS:
     for won in (True, False):
      opening(browser, width, origin, won)
      print(f'{BROWSER} {width} {origin}: {"win" if won else "loss"}', flush=True)
    complete_system(browser, width)
    print(f'{BROWSER} {width}: eight chapters, three endings, six commissions, age60 passed', flush=True)
  finally:
   (OUT / 'report.json').write_text(json.dumps(REPORT, ensure_ascii=False, indent=2))
   browser.close()
