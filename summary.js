const { default: axios } = require('axios')
const fs = require('fs')
const moment = require('moment/moment')
const {
  pipe,
  map,
  flatten,
  sortBy,
  prop,
  values,
  uniq,
  pluck,
  filter,
  trim,
  omit,
} = require('ramda')
const { ignoredItems } = require('./party')

const statNames = {
  1: 'strength',
  2: 'dexterity',
  3: 'constitution',
  4: 'intelligence',
  5: 'wisdom',
  6: 'charisma',
}

const playerCharacterIds = {
  corey: 71560080,
  gamel: 71562753,
  todd: 71559602,
  josh: 72209867,
  jen: 71942288,
  dummy: 72798822,
}

const sources = ['race', 'background', 'class', 'item', 'feat']

const getStatName = (id) => statNames[id]

const mapTrim = (obj) => map((x) => trim(x), removeNulls(obj))

const removeNulls = (obj) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => v != null))

const getStatObject = (property, data) =>
  Object.fromEntries(
    data[property]
      .map(({ id, value }) => (value ? [getStatName(id), value] : null))
      .filter(Boolean),
  )

const getInventoryItem = (item, characterValues) => {
  const name = item.definition.name
  const charVals = characterValues.filter((cv) => cv.valueId === item.id.toString())

  if (charVals) {
    const isSilvered = charVals.some((cv) => cv.typeId === 20 && cv.value === true)
    const hasCustomName = charVals.some((cv) => cv.typeId === 8)
    const customName = hasCustomName ? charVals.find((cv) => cv.typeId === 8).value : null

    if (name.includes('Spell Scroll (')) return `Scroll: ${customName}`
    if (hasCustomName) return customName
    if (isSilvered) return `Silvered ${name}`
  }
  return name
}

const summarize = async (player) => {
  const data = await axios
    .get(
      `https://character-service.dndbeyond.com/character/v3/character/${playerCharacterIds[player]}`,
    )
    .then(({ data }) => {
      return pipe(omit(['providedFrom']))(data.data)
    })

  fs.writeFileSync(`json/${player}.json`, JSON.stringify(data))

  if (!data) return null

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
    spells,
    classSpells,
    dateModified,
    modifiers,
  } = data

  const { cp, sp, gp, ep, pp } = currencies

  const _spells = pipe(
    values,
    flatten,
    filter(Boolean),
    map((x) => x.definition?.name),
  )(spells)

  const _classSpells = classSpells.map((cs) => cs.spells?.map((s) => s.definition.name)).flat()

  const bags = inventory
    .filter((i) => !i.equipped)
    .map((i) => getInventoryItem(i, characterValues))
    .filter((i) => !ignoredItems.includes(i))
    .sort()
  const gear = inventory
    .filter((i) => i.equipped)
    .map((i) => getInventoryItem(i, characterValues))
    .filter((i) => !ignoredItems.includes(i))
    .sort()

  const final = {
    name,
    classes: classes.map(
      (c) =>
        `Level ${c.level} ${c.definition.name}${
          c.subclassDefinition ? ` | ${c.subclassDefinition.name}` : ''
        }`,
    ),
    stats: getStatObject('stats', data),
    stress: inventory.filter((i) => i.equipped && i.definition.name.includes('Stress'))[0]
      ?.definition.name,
    hitPoints: {
      base: data.baseHitPoints,
      current: data.baseHitPoints - data.removedHitPoints,
      temp: data.temporaryHitPoints,
    },
    traits: mapTrim(traits),
    bonusStats: getStatObject('bonusStats', data),
    overrideStats: getStatObject('overrideStats', data),
    background: background.hasCustomBackground
      ? background.customBackground?.name
      : background.definition?.name,
    feats: feats.map((f) => f.definition.name).sort(),
    spells: _spells.concat(_classSpells).sort(),
    actions: pipe(values, flatten, filter(Boolean), sortBy(prop('name')), pluck('name'))(actions),
    modifiers: pipe(
      values,
      flatten,
      sortBy(prop('type')),
      map((x) => `${x.friendlyTypeName}: ${x.friendlySubtypeName}`),
      uniq,
    )(modifiers),
    equipment: gear,
    inventory: bags,
    currencies,
    money: cp * 0.01 + sp * 0.1 + ep * 0.5 + gp * 1 + pp * 10,
    notes: mapTrim(notes),
    // dateModified: moment(dateModified).format('YYYY.MM.DD - HH:mm'),
  }

  fs.writeFileSync(`summary/${player}.json`, JSON.stringify(final))
}

;['josh', 'corey', 'todd', 'gamel', 'jen', 'dummy'].forEach((player) => summarize(player))
