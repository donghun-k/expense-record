import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { getAccounts } from '@/lib/actions/account'
import { getCategories } from '@/lib/actions/category'
import { AccountSettings } from '@/components/settings/account-settings'
import { CategorySettings } from '@/components/settings/category-settings'

export default async function SettingsPage() {
  const [accounts, categories] = await Promise.all([
    getAccounts(),
    getCategories(),
  ])

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">설정</h1>
      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">계좌</TabsTrigger>
          <TabsTrigger value="categories">카테고리</TabsTrigger>
          <TabsTrigger value="budgets">예산</TabsTrigger>
        </TabsList>
        <TabsContent value="accounts" className="mt-4">
          <AccountSettings accounts={accounts} />
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
          <CategorySettings accounts={accounts} categories={categories} />
        </TabsContent>
        <TabsContent value="budgets" className="mt-4">
          <p className="text-sm text-muted-foreground">다음 단계에서 추가됩니다.</p>
        </TabsContent>
      </Tabs>
    </div>
  )
}
