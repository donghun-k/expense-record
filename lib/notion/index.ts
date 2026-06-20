// Notion 연동의 공개 진입점.
// 기존 `@/lib/notion` import 호환을 위해 client(Client + DB id)를 재export한다.
// entity별 codec은 직접 경로(`@/lib/notion/*.codec`)로 import 한다.
export { notion, DB } from './client'
