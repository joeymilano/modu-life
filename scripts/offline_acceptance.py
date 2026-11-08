import json
import os
from urllib.parse import urlparse

from playwright.sync_api import expect, sync_playwright


base = os.environ.get('GAME_URL', 'http://127.0.0.1:4173').rstrip('/')
hand = '/?seed=INBOX&cards=born-artist.fund-lucky.talent-fit.tie-free.secret-kind&hand=open'
retry_asset = '/art/arrival/female-everyday.webp'
already_downloaded = '/art/arrival/female-charming.webp'


def button(scope, name, exact=False):
    return scope.get_by_role('button', name=name, exact=exact)


def cached_paths(page):
    return set(page.evaluate("""async () => {
        const cache = (await caches.keys()).filter(key => key.startsWith('modu-life-')).at(-1);
        return (await (await caches.open(cache)).keys()).map(request => new URL(request.url).pathname);
    }"""))


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(channel='chrome', args=['--enable-unsafe-swiftshader'])
    context = browser.new_context(viewport={'width': 390, 'height': 844},
                                  is_mobile=True, has_touch=True, reduced_motion='reduce')
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(base + hand, wait_until='domcontentloaded')
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    initial = cached_paths(page)
    assert len(initial) <= 25
    assert '/art/shanghai-streets/cover-south-station-mobile.webp' in initial
    assert not any(path.endswith(('.glb', '.mp3')) or path.startswith('/art/arrival/') for path in initial)

    button(page, '接这手牌').click()
    page.locator('.setup-forward').click()
    button(page, '女性', True).click()
    button(page, '颜值 惊艳全场', True).click()
    button(page, '就这手牌，进上海').click()
    portrait = page.locator('.arrival-snapshot img')
    expect(portrait).to_have_attribute('src', '/art/arrival/female-stunning.webp')
    portrait.evaluate('img => img.decode()')
    button(page, '看毛小毛的消息', True).click()
    button(page, '回毛小毛').click()
    button(page, '先逛逛', True).click()

    districts = page.get_by_role('navigation', name='切换城区')
    button(districts, '安福路').click()
    page.locator('.street-frame img').evaluate('img => img.decode()')
    button(page, '3D 地图', True).click()
    page.wait_for_selector('[data-loaded-models*="wukang-corner"]', timeout=25000)
    visited = cached_paths(page)
    assert '/models/tripo/wukang-corner-v1.glb' in visited
    assert '/art/arrival/female-stunning.webp' in visited
    assert retry_asset not in visited

    context.set_offline(True)
    page.reload(wait_until='domcontentloaded')
    button(page, '继续上回').click()
    expect(page.locator('.street-frame')).to_have_attribute('data-district', 'anfu')
    page.locator('.street-frame img').evaluate('img => img.decode()')
    button(page, '3D 地图', True).click()
    page.wait_for_selector('[data-loaded-models*="wukang-corner"]', timeout=25000)
    context.set_offline(False)
    print('Cold cache is small. Visited art and Tripo models reopen offline.', flush=True)

    attempts = {retry_asset: 0, already_downloaded: 0}

    def fail_one_request(route):
        path = urlparse(route.request.url).path
        if route.request.service_worker:
            attempts[path] += 1
            if path == retry_asset and attempts[path] == 1:
                route.abort('internetdisconnected')
                return
        route.continue_()

    context.route('**/art/arrival/female-everyday.webp', fail_one_request)
    context.route('**/art/arrival/female-charming.webp', fail_one_request)
    button(page, '存档', True).click()
    pack = page.get_by_role('region', name='离线包')
    expect(pack.get_by_role('status')).to_contain_text('MB')
    button(pack, '下载离线包', True).click()
    expect(pack.get_by_role('status')).to_contain_text('下载中断', timeout=90000)
    partial = cached_paths(page)
    assert already_downloaded in partial and retry_asset not in partial
    button(pack, '继续下载', True).click()
    expect(pack.get_by_role('status')).to_contain_text('已下载', timeout=180000)
    assert attempts == {retry_asset: 2, already_downloaded: 1}, attempts
    assert retry_asset in cached_paths(page)
    button(page, '关闭', True).click()

    context.set_offline(True)
    result = page.evaluate("""async () => {
        const response = await fetch('/audio/apero-hour.mp3', {headers: {Range: 'bytes=0-99'}});
        return [response.status, (await response.arrayBuffer()).byteLength];
    }""")
    assert result == [206, 100], result
    page.goto(base + '/pearl/', wait_until='domcontentloaded')
    expect(page.get_by_role('heading', name='四元柠檬水保卫战')).to_be_visible()
    page.goto(base + '/stall/', wait_until='domcontentloaded')
    expect(page.get_by_role('heading', name='两口锅，八张单')).to_be_visible()
    assert not errors, errors
    print(json.dumps({'pack_retried': True, 'offline_audio': True, 'offline_minigames': True}))
    browser.close()
