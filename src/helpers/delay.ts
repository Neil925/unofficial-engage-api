//Generates a promise about a timeout. Useful to force an await. Only used once - past events.

const delay = (miliseconds: number) => new Promise(resolve => setTimeout(resolve, miliseconds));

export default delay;