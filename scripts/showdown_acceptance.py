"""Walk four fresh stories and, optionally, two independent ranked players."""

import os
import time
from uuid import uuid4

from playwright.sync_api import expect, sync_playwright


BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:41672').rstrip('/')
RUN_RANKS = os.environ.get('RANK_QA') == '1'
RANK_ONLY = os.environ.get('RANK_ONLY') == '1'
WIDTH = int(os.environ.get('GAME_WIDTH', '390'))
STORY_ONLY = os.environ.get('STORY_ONLY')
FIGHTS = (18, 23, 38, 57)
STARTS = ('初到上海', '日结工', '顶级富二代', '系统流')
WIN = ('proof', 'verify', 'expose')
ALLIES = ('promise', 'recruit', 'rally')
LOSS = ('proof', 'promise', 'walk')


def save(page):
    return page.evaluate("JSON.parse(localStorage.getItem('modu-life-v1'))")


def stage(page):
    return page.locator('.showdown-stage')


def open_route(page, route):
    page.goto(BASE+'/?seed=ARRIVALQA', wait_until='domcontentloaded', timeout=30000)
    if route == '初到上海':
        page.get_by_role('button', name='开始新游戏').click()
        expect(page.get_by_role('heading',name='上海站的三张字条')).to_be_visible()
        for sender in ('何亮', '陆嘉', '毛小毛'):
            page.get_by_role('button', name='看'+sender+'的消息').click()
        page.get_by_role('button', name='回毛小毛').click()
        page.get_by_role('button', name='去莘庄拿签字单').click()
        page.locator('.event-choices button:enabled').first.click()
        return
    page.get_by_role('button', name='选择出身').click()
    page.get_by_role('button', name=route).click()
    page.locator('.event-choices button:enabled').first.click()
    if route != '日结工':
        for _ in range(3):
            page.locator('.outcome-content .heir-next').first.click()
            if stage(page).is_visible():
                return
            page.locator('.event-choices button:enabled').first.click()


def play_story(browser, route, width, through_ending=True):
    page = browser.new_page(viewport={'width': width, 'height': 880}, has_touch=width<600)
    page.set_default_timeout(7500)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    visited = []
    try:
        open_route(page, route)
        for _ in range(120):
            if page.locator('.screen-end').is_visible():
                break
            if stage(page).is_visible():
                before = save(page)
                age = before['age']
                visited.append(age)
                expect(stage(page).locator('img')).to_have_js_property('complete', True, timeout=20000)
                assert stage(page).locator('img').evaluate("img=>img.naturalWidth>0")
                moves = WIN if route in ('初到上海', '系统流') else ALLIES
                if age==23 and route=='日结工':
                    moves=LOSS
                stage(page).locator(f'[data-move={moves[0]}]').click()
                if age==18:
                    page.wait_for_function("JSON.parse(localStorage.getItem('modu-life-v1')).showdown.moves.length===1")
                    page.reload(wait_until='domcontentloaded', timeout=30000)
                    page.get_by_role('button', name='继续游戏').click()
                    expect(stage(page).get_by_text('剩余 2 回合')).to_be_visible()
                for move in moves[1:]:
                    stage(page).locator(f'[data-move={move}]').click()
                expect(stage(page).get_by_role('heading', name='任务拿下' if moves!=LOSS else '对手抢先一步')).to_be_visible()
                assert save(page)['actions']==before['actions']
                stage(page).get_by_role('button', name='回到街上').click()
                if age==18 and route=='初到上海':
                    check_market(page)
                if not through_ending:
                    break
                continue
            annual = page.locator('.year-outcome .primary')
            if annual.is_visible():
                annual.click()
                continue
            result = page.locator('.outcome-content > button').filter(has_text='继续')
            if result.is_visible():
                result.click()
                continue
            choices = page.locator('.event-choices button:enabled')
            if choices.first.is_visible():
                choices.first.click()
                continue
            dialog=page.get_by_role('dialog')
            if dialog.is_visible():
                close=dialog.get_by_role('button',name='关闭',exact=True)
                if close.is_visible():
                    close.click()
                    continue
                raise AssertionError(dialog.inner_text()[:600])
            campaign = page.locator('.main-story-link')
            if not campaign.is_visible():
                page.get_by_role('button', name='手头的事',exact=True).click()
            campaign.click()
            page.get_by_role('button', name='快进到下一场').click()
        if through_ending:
            expect(page.locator('.screen-end')).to_be_visible()
            assert visited==list(FIGHTS),visited
            assert save(page)['age']==60
        else:
            assert visited==[18],visited
        assert not errors, errors
        print(f'{route} · {width}px · '+('60岁结局' if through_ending else '首场通过'),flush=True)
    finally:
        page.close()


def check_market(page):
    page.get_by_role('button',name='菜单',exact=True).click()
    page.get_by_role('dialog').get_by_role('button',name='交易所',exact=True).click()
    market=page.get_by_role('dialog',name='交易所')
    expect(market.get_by_text('1992 年 · 游戏行情')).to_be_visible()
    expect(market.get_by_role('button',name='美国大盘组合')).to_contain_text('2007 年开放')
    expect(market.get_by_role('button',name='比特币')).to_contain_text('2011 年开放')
    market.get_by_role('button',name='买入').click()
    expect(market.get_by_text('持有 1 手')).to_be_visible()
    market.get_by_role('button',name='卖出').click()
    expect(market.get_by_text('暂无持仓')).to_be_visible()
    market.get_by_role('button',name='彩票亭').click()
    market.get_by_role('button',name='刮 3 张').click()
    expect(market.get_by_text('今年刮了 3 张')).to_be_visible()
    market.get_by_role('button',name='关闭').click()


def play_ranks(browser):
    nonce=str(time.time_ns())[-6:]
    contexts=[browser.new_context(viewport={'width':390,'height':844}) for _ in range(2)]
    pages=[ctx.new_page() for ctx in contexts]
    try:
        ids=[]
        for i,page in enumerate(pages):
            page.goto(BASE+'/?rank=arrival',wait_until='domcontentloaded')
            page.get_by_role('textbox',name='排位昵称').fill(f'走查{i}{nonce}')
            page.get_by_role('button',name='取名参赛').click()
            page.get_by_role('button',name='开一局').click()
            stage(page).locator('[data-move=proof]').click()
            expect(stage(page).get_by_text('剩余 2 回合')).to_be_visible()
            if i==0:
                page.context.set_offline(True)
                stage(page).locator('[data-move=verify]').click()
                expect(page.get_by_role('button',name='重试这一步')).to_be_visible()
                page.context.set_offline(False)
                page.get_by_role('button',name='重试这一步').click()
            else:
                page.reload(wait_until='domcontentloaded', timeout=30000)
                page.get_by_role('button',name='继续排位').click()
                stage(page).locator('[data-move=verify]').click()
            expect(stage(page).get_by_text('剩余 1 回合')).to_be_visible()
            stage(page).locator('[data-move=expose]').click()
            expect(stage(page).locator('.showdown-score > div').first).to_contain_text('80')
            stage(page).get_by_role('button',name='查看排名').click()
            row=page.locator('tr[data-me=true]')
            expect(row).to_be_visible()
            ids.append(row.locator('td').nth(2).inner_text())
        for page in pages:
            page.reload(wait_until='domcontentloaded', timeout=30000)
            expect(page.get_by_role('table',name='全服排名')).to_be_visible()
            for public_id in ids:
                row=page.get_by_role('row').filter(has_text=public_id)
                expect(row).to_be_visible()
                expect(row.locator('td').first).to_have_text('1')
                expect(row.locator('td').last).to_have_text('80')
        api=contexts[0].request
        board=api.get(BASE+'/api/ranks?route=arrival').json()
        last=board['latest']
        payload={'op':'move','route':'arrival','week':board['week'],'id':last['id'],'step':2,'move':'expose','requestId':str(uuid4())}
        for _ in range(2):
            duplicate=api.post(BASE+'/api/ranks',data=payload,headers={'Origin':BASE})
            assert duplicate.ok,duplicate.text()
            assert duplicate.json()==last
        stale=api.post(BASE+'/api/ranks',data={**payload,'week':board['previous']},headers={'Origin':BASE})
        assert stale.status==409
        pages[0].get_by_role('button',name='上周榜').click()
        expect(pages[0].get_by_role('button',name='回到本周')).to_be_visible()
        expect(pages[0].get_by_role('button',name='开一局')).to_have_count(0)
        print('周榜 · 双身份可见 · 并列 · 断网续打 · 重复提交 · 上周归档',flush=True)
    finally:
        for context in contexts:
            context.close()


with sync_playwright() as playwright:
    browser=playwright.webkit.launch()
    try:
        if not RANK_ONLY:
            for route in STARTS:
                if not STORY_ONLY or route==STORY_ONLY:
                    play_story(browser,route,WIDTH)
        if RUN_RANKS:
            play_ranks(browser)
    finally:
        browser.close()
