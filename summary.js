const fs = require('fs')
const moment = require('moment')
const { pipe, omit, pick, assoc, map, isEmpty } = require('ramda')

const statNames = {
  1: 'strength',
  2: 'dexterity',
  3: 'constitution',
  4: 'intelligence',
  5: 'wisdom',
  6: 'charisma',
}

const getStatName = (id) => statNames[id]

const getStatObject = (property, data) =>
  Object.fromEntries(
    data[property]
      .map(({ id, value }) => (value ? [getStatName(id), value] : null))
      .filter(Boolean),
  )

const getInventoryItem = (item, characterValues) => {
  const name = item.definition.name
  if (name.includes('Spell Scroll (')) {
    const spell = characterValues.find((cv) => cv.valueId === item.id.toString())
    return `Scroll: ${spell.value}`
  }
  return name
}

const getActions = (actions) => {
  const actionTypes = ['race', 'background', 'class', 'item', 'feat']

  const actionList = []

  actionTypes.forEach((at) => {
    actions[at]?.forEach((a) => actionList.push(a.name))
  })

  return actionList
}

const summarize = (player) => {
  const raw = fs.readFileSync(`json/${player}.json`)

  const data = JSON.parse(raw).data

  const {
    characterValues,
    background,
    inventory,
    classes,
    name,
    notes,
    traits,
    currencies,
    actions,
    feats,
    classSpells,
    dateModified,
  } = data

  const final = {
    name,
    classes: classes.map(
      (c) =>
        `Level ${c.level} ${c.definition.name}${
          c.subclassDefinition ? ` | ${c.subclassDefinition.name}` : ''
        }`,
    ),
    stats: getStatObject('stats', data),
    hitPoints: {
      base: data.baseHitPoints,
      current: data.baseHitPoints - data.removedHitPoints,
      temp: data.temporaryHitPoints,
    },
    traits,
    bonusStats: getStatObject('bonusStats', data),
    overrideStats: getStatObject('overrideStats', data),
    background: background.hasCustomBackground
      ? background.customBackground.name
      : background.definition.name,
    feats,
    spells: classSpells
      .map((cs) => cs.spells?.map((s) => s.definition.name))
      .flat()
      .sort(),
    actions: getActions(actions).sort(),
    inventory: inventory.map((i) => getInventoryItem(i, characterValues)).sort(),
    currencies,
    notes,
    dateModified: moment(dateModified).format('LLLL'),
  }

  fs.writeFileSync(`summary/${player}.json`, JSON.stringify(final))
}

;['josh', 'corey', 'todd', 'gamel', 'jen'].forEach((player) => summarize(player))
