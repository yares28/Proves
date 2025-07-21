import { generateICalContent } from '../utils'

const mockExams = [
  {
    id: 1,
    subject: 'Math',
    code: 'MATH101',
    date: '2024-06-01',
    time: '08:00',
    duration_minutes: 120,
    location: 'Room 1',
    school: 'ETSINF',
    degree: 'CS',
    year: '1',
    semester: '1',
  },
]

describe('generateICalContent', () => {
  it('produces valid DTSTART without Z when timezone is provided', () => {
    const ics = generateICalContent(mockExams, { timeZone: 'Europe/Madrid' })
    expect(ics).toContain('DTSTART;TZID=Europe/Madrid:20240601T080000')
    expect(ics).not.toContain('DTSTART;TZID=Europe/Madrid:20240601T080000Z')
  })
})
