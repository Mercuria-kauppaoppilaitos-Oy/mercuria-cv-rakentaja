import { createContext, useContext } from 'react';
import { skillsResponseSchema, skillsRequestSchema, skillsMessages, rewriteMessages, type SkillsRequest } from '../../../../shared/rewrite-contract';
import type { CvData } from '../cv-model';

export const skillsStorageKey = 'mercuria-cv-skills-v1';
export function getSkillSource(data: CvData): SkillsRequest['source'] {
  return {
    professionalTitle: data.personalDetails.professionalTitle.trim(), summary: data.summary.trim(),
    workExperience: data.workExperience.map(({ title, description }) => ({ title: title.trim(), description: description.trim() })).filter((entry) => entry.title || entry.description),
    education: data.education.map(({ qualification, description }) => ({ qualification: qualification.trim(), description: description.trim() })).filter((entry) => entry.qualification || entry.description),
  };
}
export async function skillSourceKey(source: SkillsRequest['source']) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(source)));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
export class SkillsCache {
  private values = new Map<string, string[]>();
  constructor() {
    try {
      const raw = sessionStorage.getItem(skillsStorageKey);
      if (!raw || raw.length > 64000) return;
      const entries: unknown = JSON.parse(raw);
      if (!Array.isArray(entries)) return;
      for (const entry of entries.slice(-20)) {
        if (!Array.isArray(entry) || typeof entry[0] !== 'string' || !/^[a-f0-9]{64}$/.test(entry[0])) continue;
        const result = skillsResponseSchema.safeParse({ skills: entry[1] });
        if (result.success) this.values.set(entry[0], result.data.skills);
      }
    } catch { /* Storage is optional; the current page retains its memory cache. */ }
  }
  get(key: string) { return this.values.get(key); }
  set(key: string, skills: string[]) {
    this.values.delete(key); this.values.set(key, skills);
    if (this.values.size > 20) this.values.delete(this.values.keys().next().value!);
    try { sessionStorage.setItem(skillsStorageKey, JSON.stringify([...this.values])); } catch { /* Memory cache remains available. */ }
  }
  clear() { this.values.clear(); try { sessionStorage.removeItem(skillsStorageKey); } catch { /* Browser storage may be disabled. */ } }
}
export const SkillsCacheContext = createContext<SkillsCache | null>(null);
export function useSkillsCache() {
  const cache = useContext(SkillsCacheContext);
  if (!cache) throw new Error('Skills cache missing');
  return cache;
}
export async function suggestSkills(source: SkillsRequest['source'], signal: AbortSignal): Promise<string[]> {
  const payload = skillsRequestSchema.parse({ operation: 'suggest-skills', source });
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).byteLength > 8192) throw new Error(skillsMessages.long);
  try {
    const response = await fetch('/api/rewrite-text', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      signal: AbortSignal.any([signal, AbortSignal.timeout(18000)]), cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'no-referrer' });
    if (response.status === 504) throw new Error(rewriteMessages.timeout);
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error(skillsMessages.failure);
    return skillsResponseSchema.parse(await response.json()).skills;
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.message === rewriteMessages.timeout)) throw new Error(rewriteMessages.timeout);
    throw new Error(skillsMessages.failure);
  }
}
