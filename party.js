const fs = require('fs')
const { sum, pluck, pipe, flatten, sort, sortBy, prop, identity } = require('ramda')

const ignoredItems = [
  'Stress I',
  'Stress II',
  'Stress III',
  'Stress IV',
  'Stress V',
  'Emotional Baggage',
]

const partySummary = () => {
  const josh = JSON.parse(fs.readFileSync('summary/josh.json'))
  const corey = JSON.parse(fs.readFileSync('summary/corey.json'))
  const todd = JSON.parse(fs.readFileSync('summary/todd.json'))
  const gamel = JSON.parse(fs.readFileSync('summary/gamel.json'))
  const jen = JSON.parse(fs.readFileSync('summary/jen.json'))

  const party = [josh, corey, todd, gamel, jen]

  const inventory = pipe(
    pluck('inventory'),
    flatten,
    sortBy(identity),
  )(party)
    .reduce((a, b) => {
      const index = a.findIndex((item) => item.name === b)
      return index === -1 ? a.push({ name: b, count: 1 }) : a[index].count++, a
    }, [])
    .filter((item) => !ignoredItems.includes(item.name))
    .map((item) => (item.count > 1 ? `${item.name} x${item.count}` : item.name))

  const equipment = pipe(
    pluck('equipment'),
    flatten,
    sortBy(identity),
  )(party)
    .reduce((a, b) => {
      const index = a.findIndex((item) => item.name === b)
      return index === -1 ? a.push({ name: b, count: 1 }) : a[index].count++, a
    }, [])
    .filter((item) => !ignoredItems.includes(item.name))
    .map((item) => (item.count > 1 ? `${item.name} x${item.count}` : item.name))

  const summary = {
    classes: pipe(pluck('classes'))(party),
    money: sum(pluck('money', party)),
    equipment,
    inventory,
  }

  fs.writeFileSync(`summary/party.json`, JSON.stringify(summary))
}

partySummary()

module.exports = { ignoredItems }
