
export async function rollDie(die: number, amount: number) {
  const result = await fetch('https://www.random.org/integers/?format=plain&min=1&rnd=new&col=1&base=10&num=' + amount + '&max=' + die)
    .then(res => res.text());
  return Number(result);
}

export async function rollAbility(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('ability', `Rolled ${name} 1d20`, res, res + modifier);
}

export async function rollSkill(name: string, modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('skill', `Rolled ${name} 1d20`, res, res + modifier)
}

export async function rollInitiative(modifier: number) {
  const res = await rollDie(20, 1);
  writeRollLog('initiative', `Rolled Initiative 1d20`, res, res + modifier);
}

export async function rollSave(name: string, modifier: number, proficiency: number) {
  const res = await rollDie(20, 1);
  writeRollLog('save', `Rolled ${name} saving throw 1d20`, res, res + modifier);
}

export function writeRollLog(type: string, text: string, roll: number, total: number) {
  let log = localStorage.getItem('roll_log') || '[]'
  const logData = JSON.parse(log) as Array<{type: string, text: string, roll: number, total: number, rolledAt: string}>
  logData.push({type, text, roll, total, rolledAt: Date()})
  localStorage.setItem('roll_log', JSON.stringify(logData));
}