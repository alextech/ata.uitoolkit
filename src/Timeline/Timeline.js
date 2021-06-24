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
  #maxYear;
  #dragChildEvent = null;
  #resizeChildEvent = null;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    this.observer = new MutationObserver(this.#renderEvents.bind(this));
    this.observer.observe(this, {childList: true});

    // TODO tmp test
    // this.addEventListener('EventChanged', (e) => {
    //   console.log("dropped dispatched eventchanged on id", e.detail);
    // });

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

    let currentYear = this.startingYear;
    for (let i = 1; i <= years; i++) {
      const column = i;
      // <div class="dropTarget" style="grid-row: 1/5;" draggable="true" />
      const dropTarget = document.createElement('div');
      dropTarget.className = 'dropTarget';
      dropTarget.style.setProperty('grid-column', `${column}`);
      dropTarget.style.setProperty('grid-row', '1 / 5');
      dropTarget.draggable = true;
      dropTarget.dataset.column = column+'';
      dropTarget.dataset.year = (currentYear++)+'';

      dropTarget.addEventListener('dragenter', (e) => {
        if (this.#dragChildEvent != null) {
          this.#updateEventBoundaries(parseInt(e.target.dataset.column));
        }

        if (this.#resizeChildEvent != null) {
          switch (this.#resizeChildEvent.detail.direction) {
            case 'right':
              if(e.target.dataset.year >= this.#resizeChildEvent.target.start)
              {
                this.#resizeChildEvent.target.setAttribute('end', e.target.dataset.year);
              }

              break;
            case 'left':
              if(e.target.dataset.year <= this.#resizeChildEvent.target.end)
              {
                this.#resizeChildEvent.target.setAttribute('start', e.target.dataset.year);
              }

              break;
          }
        }
      });



      /* ------------------------------------- *\
      |
      | Drop zone setup
      |
      \* ------------------------------------- */
      dropTarget.addEventListener('dragover', (e) => {
        e.preventDefault();
      });
      dropTarget.addEventListener('drop', (e) => {
          e.preventDefault();
          // this.#dragChildEvent = null;
      });
      /*
      | -------------------------------------------- */


      tmpFragment.appendChild(dropTarget);
    }
    this.#maxYear = years + this.startingYear - 1;

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
      const startColumn = parseInt(event.getAttribute('start')) - this.startingYear + 1;
      const endColumn = parseInt(event.getAttribute('end')) - this.startingYear + 2;
      event.style.setProperty('grid-column', `${startColumn} / ${endColumn}`);
      event.style.setProperty('grid-row', '4 / 5');
      event.style.setProperty('z-index', 101);

      /* ------------------------------------- *\
      |
      | Event dispatch setup
      |
      \* ------------------------------------- */
      event.addEventListener('moveStart', (e) => {
        this.#dragChildEvent = e;
      });
      event.addEventListener('moveEnd', (e) => {
        const from = {
          start: this.#dragChildEvent.fromStart,
          end: this.#dragChildEvent.fromEnd
        };

        const to = {
          start: parseInt(this.#dragChildEvent.target.getAttribute('start')),
          end: parseInt(this.#dragChildEvent.target.getAttribute('end'))
        }

        if (from.start !== to.start || from.end !== to.end) {
          this.dispatchEvent(new CustomEvent('EventChanged', {detail: {
              eventId: this.#dragChildEvent.target.getAttribute('event-id'),
              from: from,
              to: to,
              thirdOfTotal: 1,
            }}));
        }


        this.#dragChildEvent = null;
      });
      event.addEventListener('resizeStart', (e) => {
        this.#resizeChildEvent = e;
      });
      event.addEventListener('resizeEnd', (e) => {
        this.#resizeChildEvent = null;
      })
      /*
      | -------------------------------------------- */



      /* ------------------------------------- *\
      |
      | Coordinate updating section
      |
      \* ------------------------------------- */
      event.addEventListener('startchanged', (e) => {
        const newStartCol = e.detail.start - this.startingYear + 1;
        e.target.style.setProperty('grid-column-start', newStartCol);
      });

      event.addEventListener('endchanged', (e) => {
        // offset extra + 1 for CSS grid column end
        const newStartCol = e.detail.end - this.startingYear + 2;
        e.target.style.setProperty('grid-column-end', newStartCol);
      });

      event.addEventListener('moveEnter', (e) => {
        const targetColumn = e.detail.targetIndex + parseInt(e.target.getAttribute('start')) - this.startingYear;
        this.#updateEventBoundaries(targetColumn)
      });
      /*
      | -------------------------------------------- */
    }
  }

  #updateEventBoundaries(targetColumn) {
    const e = this.#dragChildEvent;
    const originalColumn = e.detail.handleIndex + parseInt(e.target.getAttribute('start')) - this.startingYear;

    const diff = targetColumn - originalColumn;

    if (diff === 0) {
      return;
    }

    let newStart = parseInt(e.target.getAttribute('start')) + diff;
    let newEnd = parseInt(e.target.getAttribute('end')) + diff;

    if (newStart < this.startingYear || newEnd > this.#maxYear) {
      return;
    }

    e.target.setAttribute('start', newStart);
    e.target.setAttribute('end', newEnd);
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