'use client'

import { useState, useRef } from 'react'
import { m, AnimatePresence } from 'motion/react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AccountSettings } from '@/components/settings/account-settings'
import { CategorySettings } from '@/components/settings/category-settings'
import { BudgetSettings } from '@/components/settings/budget-settings'
import type { Account, Category, Budget } from '@/lib/types'

interface Props {
  accounts: Account[]
  categories: Category[]
  budgets: Budget[]
  currentYearMonth: string
  hasPreviousMonthBudget: boolean
}

const TAB_ORDER = ['accounts', 'categories', 'budgets']

const tabVariants = {
  enter: (dir: number) => ({
    x: dir * 60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (dir: number) => ({
    x: dir * -60,
    opacity: 0,
  }),
}

export function SettingsTabs({ accounts, categories, budgets, currentYearMonth, hasPreviousMonthBudget }: Props) {
  const [activeTab, setActiveTab] = useState('accounts')
  const prevTabRef = useRef('accounts')

  const direction = TAB_ORDER.indexOf(activeTab) > TAB_ORDER.indexOf(prevTabRef.current) ? 1 : -1

  const handleTabChange = (value: string) => {
    prevTabRef.current = activeTab
    setActiveTab(value)
  }

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="accounts">계좌</TabsTrigger>
        <TabsTrigger value="categories">카테고리</TabsTrigger>
        <TabsTrigger value="budgets">예산</TabsTrigger>
      </TabsList>
      <div className="mt-4 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <m.div
            key={activeTab}
            custom={direction}
            variants={tabVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'accounts' && <AccountSettings accounts={accounts} />}
            {activeTab === 'categories' && <CategorySettings accounts={accounts} categories={categories} />}
            {activeTab === 'budgets' && (
              <BudgetSettings
                categories={categories}
                currentYearMonth={currentYearMonth}
                budgets={budgets}
                hasPreviousMonthBudget={hasPreviousMonthBudget}
              />
            )}
          </m.div>
        </AnimatePresence>
      </div>
    </Tabs>
  )
}
