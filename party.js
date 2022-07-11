const fs = require('fs')
const { sum, pluck, pipe, flatten, sort, sortBy, prop, identity } = require('ramda')

const partySummary = () => {
  const josh = JSON.parse(fs.readFileSync('summary/josh.json'))
  const corey = JSON.parse(fs.readFileSync('summary/corey.json'))
  const todd = JSON.parse(fs.readFileSync('summary/todd.json'))
  const gamel = JSON.parse(fs.readFileSync('summary/gamel.json'))
  const jen = JSON.parse(fs.readFileSync('summary/jen.json'))

  const party = [josh, corey, todd, gamel, jen]

  const summary = {
    money: sum(pluck('money', party)),
    inventory: pipe(pluck('inventory'), flatten, sortBy(identity))(party),
  }

  console.log(summary)
  fs.writeFileSync(`summary/party.json`, JSON.stringify(summary))
}

partySummary()
