const p = require('phosphor-react');
const icons = ['X','List','ArrowUp','ChartBar','ShareNetwork','Download','ArrowClockwise','Atom','Planet','WaveSine','Cube','Globe','Flask','Moon','Heart','Mountains','Sparkle','ArrowRight','BookBookmark','ChatCircleText','Palette','Play','Clock','CheckCircle'];
let missing = [];
icons.forEach(i => { if(!p[i]) missing.push(i); });
console.log('Missing:', missing.length ? missing.join(',') : 'NONE');
