import { accountCodec } from '@/lib/notion/account.codec'

/** 계좌 페이지 fixture */
function accountPage(name: string) {
  return {
    id: 'acc-1',
    properties: {
      '계좌명': { title: name === '' ? [] : [{ plain_text: name }] },
    },
  }
}

describe('accountCodec.read', () => {
  it('Notion 페이지에서 Account를 뽑는다', () => {
    expect(accountCodec.read(accountPage('신한'))).toEqual({ id: 'acc-1', name: '신한' })
  })
  it('title이 비면 name은 빈 문자열', () => {
    expect(accountCodec.read(accountPage('')).name).toBe('')
  })
})

describe('accountCodec.write', () => {
  it('입력을 Notion properties로 변환한다', () => {
    expect(accountCodec.write({ name: '신한' })).toEqual({
      '계좌명': { title: [{ text: { content: '신한' } }] },
    })
  })
  it('content는 trim 된다', () => {
    expect(accountCodec.write({ name: '  신한  ' })['계좌명'].title[0].text.content).toBe('신한')
  })
})
