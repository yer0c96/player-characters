const fs = require('fs')
const { pluck, pipe, flatten, sortBy, identity, uniq } = require('ramda')

const ignoredItems = [
  'Stress I',
  'Stress II',
  'Stress III',
  'Stress IV',
  'Stress V',
  'Emotional Baggage',
]

const partySummary = () => {
  const brayton = JSON.parse(fs.readFileSync('summary/brayton.json'))
  const jendi = JSON.parse(fs.readFileSync('summary/jendi.json'))
  const jeryl = JSON.parse(fs.readFileSync('summary/jeryl.json'))
  const jes = JSON.parse(fs.readFileSync('summary/jes.json'))
  const joey = JSON.parse(fs.readFileSync('summary/joey.json'))
  //const jazzlyn = JSON.parse(fs.readFileSync('summary/jazzlyn.json'))

  const party = [brayton, jendi, jeryl, jes, joey]

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

  const spells = pipe(pluck('spells'), flatten, sortBy(identity), uniq)(party)

  const languages = pipe(pluck('languages'), flatten, sortBy(identity), uniq)(party)

  const summary = {
    classes: pipe(pluck('classes'))(party),
    money: pluck('money', party).reduce((acc, curr) => Math.floor(acc * 1000) / 1000 + curr, 0),
    equipment,
    inventory,
    spells,
    languages,
  }

  fs.writeFileSync(`summary/party.json`, JSON.stringify(summary))
}

partySummary()

module.exports = { ignoredItems }
