/**
 * Team departments, in the order the directory (Team block style B) lists them. A plain
 * module so the website can use it without loading the CMS.
 */
export const STAFF_DEPARTMENTS = [
  { label: 'Golf', value: 'golf' },
  { label: 'Course', value: 'course' },
  { label: 'Club & membership', value: 'club' },
  { label: 'Clubhouse', value: 'clubhouse' },
  { label: 'Committee', value: 'committee' },
] as const

export type StaffDepartment = (typeof STAFF_DEPARTMENTS)[number]['value']
