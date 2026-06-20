import { categoryCodec } from '@/lib/notion/category.codec'

/** 카테고리 페이지 fixture */
function categoryPage(opts: { name?: string; accountId?: string; fixed?: boolean | undefined }) {
  const { name = '식비', accountId = 'acc-1', fixed } = opts
  return {
    id: 'cat-1',
    properties: {
      '카테고리명': { title: name === '' ? [] : [{ plain_text: name }] },
      '계좌': { relation: accountId === '' ? [] : [{ id: accountId }] },
      ...(fixed === undefined ? {} : { '고정여부': { checkbox: fixed } }),
    },
  }
}

describe('categoryCodec.read', () => {
  it('Notion 페이지에서 Category를 뽑는다', () => {
    expect(categoryCodec.read(categoryPage({ fixed: false }))).toEqual({
      id: 'cat-1',
      name: '식비',
      accountId: 'acc-1',
      isFixed: false,
    })
  })
  it('고정여부 property가 없으면 isFixed는 false', () => {
    expect(categoryCodec.read(categoryPage({ fixed: undefined })).isFixed).toBe(false)
  })
  it('고정여부 checkbox true를 읽는다', () => {
    expect(categoryCodec.read(categoryPage({ fixed: true })).isFixed).toBe(true)
  })
  it('relation/title이 비면 빈 문자열', () => {
    const c = categoryCodec.read(categoryPage({ name: '', accountId: '', fixed: false }))
    expect(c.name).toBe('')
    expect(c.accountId).toBe('')
  })
})

describe('categoryCodec.write', () => {
  it('입력을 Notion properties로 변환한다', () => {
    expect(categoryCodec.write({ name: '  식비  ', accountId: 'acc-1', isFixed: true })).toEqual({
      '카테고리명': { title: [{ text: { content: '식비' } }] },
      '계좌': { relation: [{ id: 'acc-1' }] },
      '고정여부': { checkbox: true },
    })
  })
})
