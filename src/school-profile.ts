export interface SchoolProfile {
  school: string
  teacher: string
  classroom: string
  subject: string
  defaultTheme: string
  logoDataUrl: string
}

const storageKey = 'pf-school-profile'
const emptyProfile: SchoolProfile = {
  school: '',
  teacher: '',
  classroom: '',
  subject: '',
  defaultTheme: 'jardim',
  logoDataUrl: '',
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.slice(0, max) : ''
}

export function loadSchoolProfile(): SchoolProfile {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return { ...emptyProfile }
    const parsed = JSON.parse(raw) as Record<string, unknown>
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...emptyProfile }
    }
    const logo = cleanText(parsed.logoDataUrl, 360000)
    return {
      school: cleanText(parsed.school, 120),
      teacher: cleanText(parsed.teacher, 100),
      classroom: cleanText(parsed.classroom, 80),
      subject: cleanText(parsed.subject, 80),
      defaultTheme: ['jardim', 'sol', 'pessego', 'economico'].includes(
        String(parsed.defaultTheme ?? ''),
      )
        ? String(parsed.defaultTheme)
        : 'jardim',
      logoDataUrl:
        logo.startsWith('data:image/png;base64,') ||
        logo.startsWith('data:image/jpeg;base64,')
          ? logo
          : '',
    }
  } catch {
    return { ...emptyProfile }
  }
}

export function saveSchoolProfile(next: Partial<SchoolProfile>) {
  const current = loadSchoolProfile()
  const merged: SchoolProfile = {
    school: cleanText(next.school ?? current.school, 120),
    teacher: cleanText(next.teacher ?? current.teacher, 100),
    classroom: cleanText(next.classroom ?? current.classroom, 80),
    subject: cleanText(next.subject ?? current.subject, 80),
    defaultTheme: ['jardim', 'sol', 'pessego', 'economico'].includes(
      String(next.defaultTheme ?? current.defaultTheme),
    )
      ? String(next.defaultTheme ?? current.defaultTheme)
      : 'jardim',
    logoDataUrl: cleanText(next.logoDataUrl ?? current.logoDataUrl, 360000),
  }
  try {
    localStorage.setItem(storageKey, JSON.stringify(merged))
  } catch {
    /* ignore storage quota failures */
  }
  return merged
}

export function clearSchoolProfile() {
  try {
    localStorage.removeItem(storageKey)
  } catch {
    /* ignore storage errors */
  }
}
