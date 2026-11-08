import { describe, expect, it, vi } from 'vitest';
import { CITY_TIMELINES, readTickets, removeTicket, saveTicket, ticketFromHash, validateTicket, walk, type Ticket } from '../src/game/timelines';
import { storyComparisons } from '../src/game/timelineComparison';

describe('parallel timelines', () => {
  const ticket = (): Ticket => structuredClone({ version: 1, timeline: CITY_TIMELINES[0] });

  it('takes the same opening to two distinct scenes and keeps the original outcome', () => {
    const { timeline } = validateTicket(ticket());
    const work = walk(timeline, [{ pick: 0 }]);
    const family = walk(timeline, [{ pick: 1 }]);
    expect(timeline.turns[work.next!].place).toBe('张江 · 工位 37');
    expect(timeline.turns[family.next!].place).toBe('愚园路 · 修鞋摊');
    expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBeNull();
    expect(timeline.original).toContain('末班车');
  });

  it('lets a guest inspect the old listing and carry its evidence into the key handover', () => {
    const { timeline } = validateTicket(ticketFromHash('#story=fang-deposit')!);
    const inspected = walk(timeline,[{pick:0}]);
    expect(timeline.turns[inspected.next!].scene).toContain('已经有一道白印');
    const recovered = walk(timeline,[{pick:0},{pick:0}]);
    const settled = walk(timeline,[{pick:1}]);
    expect(timeline.turns[recovered.next!].scene).toContain('租客的女儿');
    expect(timeline.turns[settled.next!].scene).toContain('剩下三百');
    const closed = walk(timeline,[{pick:0},{pick:0},{pick:1}]);
    expect(closed.steps.at(-1)?.option.shot).toBe('/art/contacts/fang-handover.webp');
  });

  it('rejects backward links, unreachable scenes and choices after an ending', () => {
    const looping = ticket();
    looping.timeline.turns[1].options[0].next = 0;
    expect(() => validateTicket(looping)).toThrow();

    const detached = ticket();
    detached.timeline.turns[0].options[1].next = null;
    expect(() => validateTicket(detached)).toThrow();

    expect(() => validateTicket({ ...ticket(), route: [{ pick: 1 }, { pick: 1 }, { pick: 1 }] })).toThrow();
  });

  it('allows a reply to an open question with no preset routes', () => {
    const question = ticket();
    question.timeline.kind = 'question';
    question.timeline.turns = [{ ...question.timeline.turns[0], options: [] }];
    expect(() => validateTicket({ ...question, route: [{ pick: 0 }] })).toThrow();
    const result = validateTicket({ ...question, route: [{ pick: 2, note: '我先打个电话' }] });
    const trail = walk(result.timeline, result.route!);
    expect(trail.next).toBeNull();
    expect(trail.steps[0].option.after).toBe('我先打个电话');
  });

  it('opens Lin Jia’s shared story and shows different art on the two routes', () => {
    const { timeline } = validateTicket(ticketFromHash('#story=scallion-bill'));
    expect(timeline.turns.map(turn => turn.shot)).toEqual([
      '/art/dates/lin-middle.webp', '/art/dates/lin-parting.webp', '/art/dates/lin-return.webp',
    ]);
    expect(walk(timeline, [{ pick: 0 }]).next).toBe(1);
    expect(walk(timeline, [{ pick: 1 }]).next).toBe(2);
    expect(walk(timeline, [{ pick: 1 }, { pick: 0 }]).next).toBeNull();
  });

  it('keeps four distinct photo endings when the photo shop ticket is reopened', () => {
    const story = ticketFromHash('#story=last-photo');
    const photos = [0, 1].flatMap(first => [0, 1].map(second => {
      const restored = validateTicket({ ...story, route: [{ pick: first }, { pick: second }] });
      const { steps, next } = walk(restored.timeline, restored.route!);
      expect(next).toBeNull();
      return steps[1].option.shot;
    }));
    expect(photos).toEqual(['script', 'address', 'group', 'id'].map(name => `/art/photo-shop/${name}.webp`));

    const modified = structuredClone(story);
    modified.timeline.turns[1].options[0].shot = 'https://example.com/tracking.webp';
    expect(validateTicket(modified).timeline.turns[1].options[0].shot).toBeUndefined();
  });

  it('compares finished branches at the first differing choice, including a saved receipt from before the new stills', () => {
    const opened = ticketFromHash('#story=pearl-signal');
    const newReceipt: Ticket = { ...opened, route: [{pick:0},{pick:1}] };
    const oldReceipt: Ticket = { ...structuredClone(opened), route: [{pick:1}] };
    delete oldReceipt.timeline.turns[0].options[1].shot;
    const otherScenario = structuredClone(oldReceipt);
    otherScenario.timeline.turns[0].options[1].after = '公司已经搬走了。';
    const comparisons = storyComparisons(newReceipt, [
      otherScenario, { ...opened, route:[{pick:0}] }, newReceipt, oldReceipt, oldReceipt,
    ]);
    expect(comparisons).toHaveLength(1);
    expect(comparisons[0].comparison).toMatchObject({
      place:'外滩 · 轮渡口',
      left:{path:'A·B', choice:'端着柠檬水上船', ending:'喝掉，留在这里帮忙收摊', shot:'/art/timelines/pearl-close.webp'},
      right:{path:'B', shot:'/art/timelines/pearl-office.webp'},
    });
    expect(storyComparisons({ ...opened, route:[{pick:0}] }, [oldReceipt])).toEqual([]);
  });

  it('distinguishes two write-in replies to the same question', () => {
    const question = validateTicket({version:1,timeline:{
      id:'question-reply',kind:'question',title:'先等谁',author:'测试',original:'',
      turns:[{date:'晚上八点',place:'上海',scene:'车已经到了。',options:[]}],
    }});
    const current: Ticket = {...question, route:[{pick:2,note:'先等一会儿'}]};
    const previous: Ticket = {...question, route:[{pick:2,note:'让司机开吧'}]};
    expect(storyComparisons(current,[previous])[0].comparison).toMatchObject({
      left:{path:'C',after:'先等一会儿'},right:{path:'C',after:'让司机开吧'},
    });
  });

  it('keeps the seven ending stills through share-ticket validation', () => {
    const train = validateTicket(ticketFromHash('#story=last-train')).timeline;
    const pearl = validateTicket(ticketFromHash('#story=pearl-signal')).timeline;
    const photos = [train,pearl].flatMap(timeline=>timeline.turns.flatMap(turn=>
      turn.options.filter(option=>option.next===null).map(option=>option.shot)));
    expect(photos).toHaveLength(7);
    expect(photos.every(shot=>shot?.startsWith('/art/timelines/'))).toBe(true);
    expect(new Set(photos).size).toBe(7);
  });

  it('collapses old duplicate receipts and keeps only one copy on replay', () => {
    const receipt: Ticket = { ...ticketFromHash('#story=last-photo'), route: [{ pick: 0 }, { pick: 1 }] };
    let stored = JSON.stringify([receipt, validateTicket(receipt)]);
    vi.stubGlobal('localStorage', { getItem: () => stored, setItem: (_: string, data: string) => { stored = data; } });
    try {
      expect(readTickets()).toHaveLength(1);
      expect(saveTicket(receipt)).toHaveLength(1);
      expect(removeTicket(receipt)).toHaveLength(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('uses the warehouse and company decisions to select the correct 59-year-old scene', () => {
    const warehouse=validateTicket(ticketFromHash('#story=warehouse-card')).timeline;
    expect(warehouse.turns[0].options.map(choice=>choice.next)).toEqual([1,2]);
    expect(warehouse.turns[1].scene).toContain('带白班那阵');
    expect(warehouse.turns[2].scene).toContain('夜班有个人认出你');
    const company=validateTicket(ticketFromHash('#story=factory-handover')).timeline;
    expect(company.turns[1].options.map(choice=>choice.next)).toEqual([2,3]);
    expect(company.turns[2].scene).toContain('已经结清的周转单');
    expect(company.turns[3].scene).toContain('¥40,000');
    expect(company.turns[4].scene).toContain('晚一批下单');
    expect(company.turns[3].shot).toBe('/art/endings/life-heir-final.webp');
  });

  it('keeps the celebration bill and the two street cameos on separate guest routes', () => {
    const dinner=validateTicket(ticketFromHash('#story=huanghe-toast')).timeline;
    expect(dinner.turns[0].scene).toContain('经常庆功，就能成功');
    const small=dinner.turns[walk(dinner,[{pick:0}]).next!];
    const banquet=dinner.turns[walk(dinner,[{pick:1}]).next!];
    expect(small.scene).toContain('碰杯的水印');
    expect(banquet.scene).toContain('庆功宴已经吃了');
    expect(small.shot).toBe('/art/blossoms/huanghe-small-ledger.webp');
    expect(banquet.shot).toBe('/art/blossoms/huanghe-banquet-bill.webp');
    expect(walk(dinner,[{pick:1},{pick:1}]).steps.at(-1)?.option.shot).toBe('/art/blossoms/huanghe-soda-end.webp');
    const cameos=validateTicket(ticketFromHash('#story=shanghai-cameos')).timeline;
    expect(cameos.turns[walk(cameos,[{pick:0}]).next!].scene).toContain('胡歌');
    expect(cameos.turns[walk(cameos,[{pick:1}]).next!].scene).toContain('唐嫣');
  });

});
