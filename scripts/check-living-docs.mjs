#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const keys = ['journal','architecture','security','data','operations','quality','qa','changelog'];
const entryFields = ['Scope','Root cause','Owner','Tests','Failure path','Docs updated','Residual risk'];

export function sourceFile(path) {
  return !path.endsWith('.md') && !path.startsWith('docs/') && !path.startsWith('public/') &&
    !/(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/.test(path) &&
    /\.(js|cjs|mjs|ts|tsx|jsx|json|yml|yaml|sql|css)$/.test(path);
}

export function requiredDocs(paths, map) {
  const source = paths.filter(sourceFile);
  const required = new Set();
  if (!source.length) return [];
  required.add(map.journal);
  const runtime = source.filter(p => !/(^|\/)(test|tests|__tests__)\//.test(p) &&
    !/\.(test|spec)\.[cm]?[jt]sx?$/.test(p) && !p.startsWith('scripts/') && !p.startsWith('.github/'));
  if (runtime.some(p => /^(app\/|apps\/|src\/|components\/|hooks\/|pages\/|api\/)/.test(p))) {
    required.add(map.qa); required.add(map.changelog);
  }
  if (runtime.some(p => /^(lib\/|packages\/|src\/lib\/)/.test(p))) {
    required.add(map.architecture); required.add(map.qa);
  }
  if (source.some(p => /(^|\/)(auth|security|mcp|session|rbac|rls)(\/|[._-])|(^|\/)proxy\.[jt]s$/.test(p))) required.add(map.security);
  if (source.some(p => /(^|\/)(supabase|migrations|database|schema)(\/|[._-])|\.sql$/.test(p))) required.add(map.data);
  if (source.some(p => p.startsWith('scripts/') || p.startsWith('.github/workflows/') || /(^|\/)(deploy|worker|cron|instrumentation)(\/|[._-])/.test(p))) required.add(map.operations);
  return [...required].sort();
}

export function journalProblems(diff) {
  const additions=diff.split('\n').filter(x=>x.startsWith('+')&&!x.startsWith('+++')).map(x=>x.slice(1)).join('\n');
  const problems=[];
  if (!/^## \d{4}-\d{2}-\d{2} \| .{12,}$/m.test(additions)) problems.push('New dated quality journal heading missing');
  for (const label of entryFields) {
    if (!new RegExp('^- '+label+': (.{10,})$', 'm').test(additions)) problems.push('Missing substantive new journal field: '+label);
  }
  return problems;
}

function git(...args) { return execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024}); }
function run() {
  const map=JSON.parse(readFileSync(join(root,'docs/living-docs.json'),'utf8'));
  const problems=[];
  for (const key of keys) {
    const p=map[key];
    if(typeof p!=='string'||!(/^[A-Za-z0-9._/-]+\.md$/).test(p)||p.includes('..')||!existsSync(join(root,p))) problems.push('Missing or invalid owner document: '+key);
  }
  if (problems.length===0&&process.argv.includes('--diff')) {
    const base=process.env.BASE_REF;
    if(!base||!/^[A-Za-z0-9._/-]+$/.test(base)||base.startsWith('-')||base.includes('..')) throw new Error('Invalid or missing BASE_REF');
    const ancestor=git('merge-base','HEAD','refs/remotes/origin/'+base).trim();
    const paths=git('diff','--name-only','-z',ancestor,'HEAD').split('\0').filter(Boolean);
    const req=requiredDocs(paths,map);
    for(const p of req) if(!paths.includes(p)) problems.push('Changed code requires updated '+p);
    if(req.includes(map.journal)&&paths.includes(map.journal)) problems.push(...journalProblems(git('diff','--unified=0',ancestor,'HEAD','--',map.journal)));
    console.log('Living docs: '+paths.filter(sourceFile).length+' source changes, '+req.length+' document owners');
  }
  if (problems.length) { for(const p of problems) console.error('::error::'+p); process.exitCode=1; }
  else console.log('Living docs contract passed');
}
if (process.argv[1]?.replaceAll('\\', '/').endsWith('scripts/check-living-docs.mjs')) {
  try { run(); } catch(e) { console.error('::error::Cannot verify living docs: '+String(e)); process.exitCode=1; }
}
