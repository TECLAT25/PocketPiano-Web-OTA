const NOTES = [
  { name: 'Do', accidental: false },
  { name: 'Do♯', accidental: true },
  { name: 'Re', accidental: false },
  { name: 'Re♯', accidental: true },
  { name: 'Mi', accidental: false },
  { name: 'Fa', accidental: false },
  { name: 'Fa♯', accidental: true },
  { name: 'Sol', accidental: false },
  { name: 'Sol♯', accidental: true },
  { name: 'La', accidental: false },
  { name: 'La♯', accidental: true },
  { name: 'Si', accidental: false }
];

function decorateOctave() {
  const grid = document.querySelector('#offsetGrid');
  if (!grid) return;

  grid.classList.add('piano-octave');
  [...grid.children].forEach((item, index) => {
    const note = NOTES[index];
    if (!note) return;

    item.classList.add('piano-key', note.accidental ? 'black-key' : 'white-key');
    item.dataset.note = note.name;
    item.dataset.keyNumber = String(index + 1);

    const label = item.querySelector('label');
    const input = item.querySelector('input');
    if (!label || !input) return;

    label.innerHTML = `
      <span class="note-name">${note.name}</span>
      <span class="key-number">N.º ${index + 1}</span>
      <output class="key-time" aria-live="polite"></output>
    `;

    const timeOutput = label.querySelector('.key-time');
    const refreshTime = () => {
      const value = input.value === '' ? '—' : input.value;
      timeOutput.textContent = `Tiempo: ${value}`;
    };

    input.setAttribute('aria-label', `${note.name}, tecla ${index + 1}, valor de tiempo`);
    input.addEventListener('input', refreshTime);
    input.addEventListener('change', refreshTime);
    refreshTime();
  });
}

const octaveObserver = new MutationObserver(decorateOctave);
const offsetGrid = document.querySelector('#offsetGrid');
if (offsetGrid) octaveObserver.observe(offsetGrid, { childList: true });

document.addEventListener('DOMContentLoaded', decorateOctave);
queueMicrotask(decorateOctave);
