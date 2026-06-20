/**
 * @jest-environment node
 *
 * action(shell)의 책임만 검증: core 결과를 그대로 흘려보내고,
 * PartialDeletionError를 사용자 메시지로 변환하며, 성공/실패 모두 캐시를 무효화한다.
 * pagination/rate-limit(adapter)·경계 계산(core)은 각자 테스트가 따로 있다.
 */
jest.mock('@/lib/notion', () => ({
  notion: { databases: { query: jest.fn() }, pages: { create: jest.fn(), update: jest.fn(), retrieve: jest.fn() } },
  DB: { EXPENSE: 'E', ACCOUNT: 'A', CATEGORY: 'C', BUDGET: 'B' },
}))
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/lib/core/expense', () => ({
  countPastExpenses: jest.fn(),
  deletePastExpenses: jest.fn(),
}))

import { deletePastExpenses } from '@/lib/actions/expense'
import * as core from '@/lib/core/expense'
import { PartialDeletionError } from '@/lib/repositories/expense'
import { revalidatePath } from 'next/cache'

const mockedCore = core.deletePastExpenses as jest.Mock

beforeEach(() => jest.clearAllMocks())

describe('deletePastExpenses (action/shell)', () => {
  it('성공 시 core 결과를 반환하고 / 와 /history 캐시를 무효화한다', async () => {
    mockedCore.mockResolvedValueOnce({ deletedCount: 3 })

    expect(await deletePastExpenses()).toEqual({ deletedCount: 3 })
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })

  it('PartialDeletionError를 카운트 담은 메시지로 변환하고, 실패에도 캐시를 무효화한다', async () => {
    mockedCore.mockRejectedValueOnce(new PartialDeletionError(2))

    await expect(deletePastExpenses()).rejects.toThrow('2건 삭제 후 오류가 발생했습니다. 다시 시도해주세요.')
    expect(revalidatePath).toHaveBeenCalledWith('/')
    expect(revalidatePath).toHaveBeenCalledWith('/history')
  })
})
