'use strict';

import style from './Timeline.scss';

const timelineTpl = document.createElement('template');
timelineTpl.innerHTML =
`
<div class="period" style="grid-row: 1/5;"></div>
<div class="age" style="grid-row: 5/6"></div>
<div class="year" style="grid-row: 6/7;"></div>
`;

class Timeline extends HTMLElement {
  static get observedAttributes() {
    return ['years', 'startingyear', 'age'];
  }

  #previousYears;
  #dragChildEvent = false;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    this.observer = new MutationObserver(this.#renderEvents.bind(this));
    this.observer.observe(this, {childList: true});

    this.#renderEvents();
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if(oldValue === newValue) return;

    switch (attribute) {
      case 'years':
        this.#setupGrid(parseInt(newValue));

        break;

      case 'age':
        Timeline.#updateAge(parseInt(newValue), this.shadowRoot);

        break;

      case 'startingyear':
        Timeline.#updateStartingYear(parseInt(newValue), this.shadowRoot);

        break;
    }
  }

  #setupGrid(years) {
    this.shadowRoot.host.style.setProperty('--years', years);

    const tmpFragment = document.createDocumentFragment();

    for (let i = 0; i < years; i++) {
      tmpFragment.appendChild(timelineTpl.content.cloneNode(true));
    }

    const periods = tmpFragment.querySelectorAll('.period');
    let i = 1;
    for (const period of periods) {
      period.style.setProperty('grid-column', `${i} / ${++i}`);
    }


    const that = this;
    for (let i = 1; i <= years; i++) {
      const column = i;
      // <div class="dropTarget" style="grid-row: 1/5;" draggable="true" />
      const dropTarget = document.createElement('div');
      dropTarget.className = 'dropTarget';
      dropTarget.style.setProperty('grid-column', `${column}`);
      dropTarget.style.setProperty('grid-row', '1 / 5');
      dropTarget.draggable = true;

      dropTarget.addEventListener('dragenter', (e) => e.preventDefault());
      dropTarget.addEventListener('dragover', (e) => e.preventDefault());
      dropTarget.addEventListener('drop', (e) => {
        console.log("Dropped", e, that.#dragChildEvent);
      });

      tmpFragment.appendChild(dropTarget);
    }

    if (this.#previousYears !== years) {
      Timeline.#updateAge(this.age, tmpFragment);
      Timeline.#updateStartingYear(this.startingYear, tmpFragment);

      this.#previousYears = years;
    }

    this.shadowRoot.replaceChildren(tmpFragment);


    const slot = document.createElement('slot');
    slot.setAttribute('name', 'events');
    this.shadowRoot.appendChild(slot);
  }

  static #updateAge(age, rootNode) {
    const ageNodes = rootNode.querySelectorAll('.age');

    let currentAge = age;
    let i = 0;
    for (const ageNode of ageNodes) {
      if (i % 2 === 0) {
        ageNode.innerText = currentAge;
      } else {
        ageNode.innerText = "\u00A0";
      }

      i++;
      currentAge++;
    }
  }

  static #updateStartingYear(year, rootNode) {
    const yearNodes = rootNode.querySelectorAll('.year');

    let currentYear = year;
    for (const yearNode of yearNodes) {
      yearNode.innerText = currentYear;

      currentYear++;
    }
  }

  #renderEvents() {
    const events = this.getElementsByTagName('ata-timeline-event');

    const that = this;
    for (const event of events) {
      const startColumn = parseInt(event.getAttribute('start')) - this.startingYear;
      const endColumn = parseInt(event.getAttribute('end')) - this.startingYear;
      event.style.setProperty('grid-column', `${startColumn} / ${endColumn}`);
      event.style.setProperty('grid-row', '4 / 5');
      event.style.setProperty('z-index', 101);

      event.addEventListener('moveStart', (e) => {
        console.log('move started');

        that.#dragChildEvent = true;
      });
      event.addEventListener('moveEnd', (e) => {
        console.log('move end');

        that.#dragChildEvent = false;
      });
    }
  }

  set years(years) {
    this.setAttribute('years', years);
  }

  get years() {
    return parseInt(this.getAttribute('years'));
  }

  set age(age) {
    this.setAttribute('age', age);
  }

  get age() {
    return parseInt(this.getAttribute('age'));
  }

  set startingYear(year) {
    this.setAttribute('startingYear', year);
  }

  get startingYear() {
    return parseInt(this.getAttribute('startingYear'));
  }
}

if(!customElements.get('ata-timeline')) {
  customElements.define('ata-timeline', Timeline);
}