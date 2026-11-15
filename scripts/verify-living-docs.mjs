import { test } from 'node:test';
import assert from 'node:assert/strict';
import { requiredDocs, journalProblems, sourceFile } from './check-living-docs.mjs';
const map={journal:'docs/QUALITY_JOURNAL.md',architecture:'docs/ARCHITECTURE.md',security:'docs/SECURITY.md',data:'docs/DATA.md',operations:'docs/OPERATIONS.md',qa:'QA_CHECKLIST.md',changelog:'CHANGELOG.md'};
const journal = [
  '+## 2026-11-15 | Introduce enforceable living document requirements',
  '+- Scope: Repository documentation change policy and its GitHub Actions check.',
  '+- Root cause: Existing agent documentation rules were not required by CI.',
  '+- Owner: Repository maintainers review the software and its architecture contracts.',
  '+- Tests: Node tests exercise changed path classification and invalid journal entries.',
  '+- Failure path: Missing documentation or inaccessible git history rejects the pull request.',
  '+- Docs updated: Architecture quality baseline, operations notes and checklists.',
  '+- Residual risk: Text checks do not verify correctness of documentation or deployed behavior.'
].join('\n');
test('source filtering excludes docs and static assets',()=>{
 assert.equal(sourceFile('app/page.tsx'),true);
 assert.equal(sourceFile('README.md'),false);
 assert.equal(sourceFile('public/logo.svg'),false);
 assert.equal(sourceFile('package-lock.json'),false);
});
test('UI changes require changelog, QA and journal',()=>{
 assert.deepEqual(requiredDocs(['app/page.tsx'],map),['CHANGELOG.md','QA_CHECKLIST.md','docs/QUALITY_JOURNAL.md']);
});
test('auth and schema changes require their owning documents',()=>{
 const docs=requiredDocs(['lib/auth/session.ts','infra/supabase/schema.sql'],map);
 for(const path of [map.journal,map.architecture,map.qa,map.security,map.data]) assert.ok(docs.includes(path),path);
});
test('workflow changes require operations and journal',()=>{
 assert.deepEqual(requiredDocs(['.github/workflows/ci.yml'],map),['docs/OPERATIONS.md','docs/QUALITY_JOURNAL.md']);
});
test('documentation changes do not generate fake journal entries',()=>{
 assert.deepEqual(requiredDocs(['README.md'],map),[]);
});
test('journal updates must be substantive and new',()=>{
 assert.deepEqual(journalProblems(journal),[]);
 assert.notEqual(journalProblems(journal.replace('+- Tests:', '+- Observations:')).length,0);
 assert.notEqual(journalProblems(journal.replace('+- Scope: Repository documentation change policy and its GitHub Actions check.','+- Scope: TODO')).length,0);
});
