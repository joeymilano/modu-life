"""Walk all three South Station replies through the following year."""

import os

from playwright.sync_api import expect, sync_playwright


BASE = os.environ.get('GAME_URL', 'http://localhost:5173').rstrip('/')
ROUTES = [
    ('毛小毛', '去莘庄拿签字单', '两把钥匙', '今天先别付', 'night-room', '毛小毛找了另一间'),
    ('何亮', '去安福路对小票', '账上少两份面', '让她先走', 'night-shift', '何亮排了张班表'),
    ('陆嘉', '去轮渡口接乐队', '箱底开了', '下一班船再走', 'night-ferry', '一袋有疤的橘子'),
]


def run_route(browser, width, height, route):
    sender, visit, meeting, choice, flag, followup = route
    mobile = width < 600
    page = browser.new_page(viewport={'width': width, 'height': height}, has_touch=mobile)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_default_timeout(12000)
    try:
        page.goto(BASE + '/?seed=ARRIVALQA', wait_until='domcontentloaded')
        page.get_by_role('button', name='开始新游戏').click()
        inbox = page.get_by_role('dialog', name='上海站的三张字条')
        expect(inbox).to_be_visible()

        if sender == '毛小毛':
            page.wait_for_function("JSON.parse(localStorage.getItem('modu-life-v1'))?.pendingYearEvent")
            page.reload(wait_until='domcontentloaded')
            page.get_by_role('button', name='继续游戏').click()
            expect(inbox).to_be_visible()

        expect(inbox.get_by_text('今晚开演前，拿回试场')).to_be_visible()
        expect(inbox.get_by_text('2 条未读')).to_be_visible()
        if sender != '毛小毛':
            inbox.get_by_role('button', name='看' + sender + '的消息').click()
        if sender == '毛小毛' and not mobile:
            inbox.locator('.arrival-desk header > p').click(click_count=3)
        reply = inbox.get_by_role('button', name='回' + sender)
        expect(reply).to_be_in_viewport(ratio=1)
        box = reply.bounding_box()
        assert box is not None
        x, y = box['x'] + box['width'] / 2, box['y'] + box['height'] / 2
        if mobile:
            page.touchscreen.tap(x, y)
        else:
            page.mouse.click(x, y)
        expect(page.get_by_role('heading', name=sender + '回你了')).to_be_visible()
        expect(inbox).to_have_count(0)

        page.get_by_role('button', name=visit).click()
        expect(page.get_by_role('heading', name=meeting)).to_be_visible()
        page.get_by_role('button', name=choice).click()
        page.get_by_role('dialog').get_by_role('button', name='去外滩抢回首演', exact=True).click()
        expect(page.get_by_role('heading', name='开门前，票卖了两遍')).to_be_visible()
        expect(page.locator('.showdown-frame img')).to_have_attribute('src', '/art/era/stage-1992.webp')
        for move in ('proof', 'verify', 'expose'):
            page.locator('[data-move='+move+']').click()
        page.get_by_role('button', name='回到街上').click()
        page.get_by_role('button', name='年度结算' if mobile else '结算这一年', exact=True).click()
        page.get_by_role('button', name='进入 19 岁').click()
        expect(page.get_by_role('heading', name=followup)).to_be_visible()
        page.get_by_role('dialog').locator('.event-choices button:enabled').first.click()
        page.get_by_role('button', name='继续', exact=True).click()
        expect(page.get_by_role('dialog')).to_have_count(0)
        page.wait_for_function("""flag => {
            const save = JSON.parse(localStorage.getItem('modu-life-v1'));
            return save?.age === 19 && save.flags.includes(flag) && save.seenEvents.includes('first-night-stage') && !save.pendingYearEvent;
        }""", arg=flag)
        assert not errors, errors
    finally:
        page.close()


with sync_playwright() as playwright:
    for engine, options in [(playwright.chromium, {'channel': 'chrome'}), (playwright.webkit, {})]:
        browser = engine.launch(**options)
        try:
            for width, height in [(1549, 886), (390, 844)]:
                for route in ROUTES:
                    run_route(browser, width, height, route)
                    print(f'{engine.name} {width}×{height} · {route[0]} · 19岁已继续', flush=True)
        finally:
            browser.close()
