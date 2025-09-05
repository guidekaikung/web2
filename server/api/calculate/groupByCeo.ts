// utils/groupByCeo.ts
export function groupByCEO(data: any[]) {
  const grouped: Record<string, number> = {}
  let currentCEO = ''

  for (const row of data) {
    const name = row.Column4
    const column9 = Number(row.Column9 || 0)

    if (name?.includes('CEO')) {
      currentCEO = name
      grouped[currentCEO] = 0
    } else if (currentCEO) {
      grouped[currentCEO] += column9
    }
  }

  return grouped
}
