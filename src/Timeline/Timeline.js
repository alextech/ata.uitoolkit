'use strict';

import style from './Timeline.scss';

const timelineTpl = document.createElement('template');
timelineTpl.innerHTML =
`
<div class="period"></div>
<div class="age"></div>
<div class="year"></div>
`;

export default class Timeline extends HTMLElement {
  static get observedAttributes() {
    return ['years', 'startingyear', 'age'];
  }

  #previousYears;
  #maxYear;
  #dragChildEvent = null;
  #resizeChildEvent = null;
  #dragNewItemStart = null;
  #newItemPlaceholder = null;
  #currentTargetYear = -1;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    this.draggable = false;
    const contentObserver = new MutationObserver((mutationsList) => {
      for (const mutationRecord of mutationsList) {
        if (mutationRecord.addedNodes.length > 0) {
          this.#renderItems();
        }
      }
    });
    contentObserver.observe(this, {childList: true});

    this.#setupListeners();

    this.#renderItems();
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if(oldValue === newValue) return;

    switch (attribute) {
      case 'years':
        this.#setupGrid(parseInt(newValue));
        this.#renderItems();

        break;

      case 'age':
        Timeline.#updateAge(parseInt(newValue), this.shadowRoot);

        break;

      case 'startingyear':
        Timeline.#updateStartingYear(parseInt(newValue), this.shadowRoot);
        this.#renderItems();

        break;
    }
  }

  #setupGrid(years) {
    const numRows = this.childElementCount > 0 ? this.childElementCount : 1;

    this.shadowRoot.host.style.setProperty('--rows', numRows);

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

    i = 1;
    const yearNodes = tmpFragment.querySelectorAll('.year');
    for (const yearNode of yearNodes) {
      yearNode.style.setProperty('grid-column', `${i} / ${++i}`);
    }

    let currentYear = this.startingYear;
    for (let i = 1; i <= years; i++) {
      const column = i;
      const dropTarget = document.createElement('div');
      dropTarget.className = 'dropTarget';
      dropTarget.className = 'dropTarget';
      dropTarget.style.setProperty('grid-column', `${column}`);
      dropTarget.style.setProperty('grid-row', '1 / '+(numRows+2));
      dropTarget.draggable = true;
      dropTarget.dataset.column = column+'';
      dropTarget.dataset.year = (currentYear++)+'';

      dropTarget.addEventListener('dragstart', (e) => {
        this.#dragNewItemStart = e.target.dataset.year;
        this.#newItemPlaceholder = document.createElement('div');
        this.#newItemPlaceholder.classList.add('newItemPlaceholder');

        const row = this.childElementCount > 0 ? this.childElementCount : 1;
        this.#newItemPlaceholder.style.setProperty('grid-row', row);
        this.#newItemPlaceholder.style.setProperty('grid-column-start', e.target.dataset.column);
        this.#newItemPlaceholder.style.setProperty('grid-column-end', parseInt(e.target.dataset.column) + 1 + '');
        this.#newItemPlaceholder.dataset.dragStart = e.target.dataset.column;

        this.shadowRoot.appendChild(this.#newItemPlaceholder);
      });
      dropTarget.addEventListener('dragend', () => {
        if (this.#dragNewItemStart != null) {
          this.dispatchEvent(new CustomEvent('NewItemRequest', {detail: {
              start: parseInt(this.#dragNewItemStart),
              end: this.#currentTargetYear,
            }}));
        }

        this.#dragNewItemStart = null;
        this.#currentTargetYear = -1;
        this.shadowRoot.removeChild(this.#newItemPlaceholder);
        this.#newItemPlaceholder = null;
      });

      dropTarget.addEventListener('dragenter', (e) => {
        this.#currentTargetYear = parseInt(e.target.dataset.year);

        if (this.#dragChildEvent != null) {
          this.#updateItemBoundaries(parseInt(e.target.dataset.column));
        }

        if (this.#resizeChildEvent != null) {
          switch (this.#resizeChildEvent.detail.direction) {
            case 'right':
              if(e.target.dataset.year >= this.#resizeChildEvent.target.start)
              {
                this.#resizeChildEvent.target.setAttribute('end', this.#currentTargetYear);
              }

              break;
            case 'left':
              if(e.target.dataset.year <= this.#resizeChildEvent.target.end)
              {
                this.#resizeChildEvent.target.setAttribute('start', this.#currentTargetYear);
              }

              break;
          }
        }

        if (this.#newItemPlaceholder != null) {
          let target = parseInt(e.target.dataset.column) + 1;
          let origin = parseInt(this.#newItemPlaceholder.dataset.dragStart);

          let start, end;
          if (target < origin) {
            start = target - 1;
            end = origin + 1;
          } else {
            start = origin;
            end = target;
          }

          this.#newItemPlaceholder.style.setProperty('grid-column-start', start);
          this.#newItemPlaceholder.style.setProperty('grid-column-end', end);
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
    slot.setAttribute('name', 'items');
    this.shadowRoot.appendChild(slot);
  }

  static #updateAge(age, rootNode) {
    const ageNodes = rootNode.querySelectorAll('.age');

    let currentAge = age;
    let i = 0;
    for (const ageNode of ageNodes) {
      ageNode.style.setProperty('grid-column', i+1);

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

  #processedItems = [];
  #renderItems() {
    const items = this.getElementsByTagName('ata-timeline-item');
    this.shadowRoot.host.style.setProperty('--rows', items.length);

    let row = 1;

    for (const item of items) {
      item.setAttribute('slot', 'items');
      // TODO ===== until intersection placement is done
      item.setAttribute('row', row+'');
      row++;
      // =======================

      const startColumn = parseInt(item.getAttribute('start')) - this.startingYear + 1;
      const endColumn = parseInt(item.getAttribute('end')) - this.startingYear + 2;
      item.style.setProperty('grid-column', `${startColumn} / ${endColumn}`);
      const startRow = parseInt(item.getAttribute('row'));
      item.style.setProperty('grid-row', `${startRow} / ${startRow + 1}`);
      item.style.setProperty('z-index', 101);

      const itemId = item.getAttribute('item-id');
      if (this.#processedItems.includes(itemId)) {
        continue;
      }

      this.#processedItems.push(itemId);


    }
  }

  #setupListeners() {
    /* ------------------------------------- *\
      |
      | Event dispatch setup
      |
      \* ------------------------------------- */
    this.addEventListener('moveStart', (e) => {
      this.#dragChildEvent = e;
    });
    this.addEventListener('moveEnd', () => {
      const from = {
        start: this.#dragChildEvent.detail.fromStart,
        end: this.#dragChildEvent.detail.fromEnd
      };

      const to = {
        start: parseInt(this.#dragChildEvent.target.getAttribute('start')),
        end: parseInt(this.#dragChildEvent.target.getAttribute('end'))
      }

      if (from.start !== to.start || from.end !== to.end) {
        this.dispatchEvent(new CustomEvent('ItemChanged', {detail: {
            itemId: this.#dragChildEvent.target.getAttribute('item-id'),
            from: from,
            to: to,
            thirdOfTotal: 1,
          }}));
      }


      this.#dragChildEvent = null;
    });
    this.addEventListener('resizeStart', (e) => {
      this.#resizeChildEvent = e;
    });
    this.addEventListener('resizeEnd', () => {
      const from = {
        start: this.#resizeChildEvent.detail.fromStart,
        end: this.#resizeChildEvent.detail.fromEnd
      };

      const to = {
        start: parseInt(this.#resizeChildEvent.target.getAttribute('start')),
        end: parseInt(this.#resizeChildEvent.target.getAttribute('end'))
      }

      if (from.start !== to.start || from.end !== to.end) {
        this.dispatchEvent(new CustomEvent('ItemChanged', {
          detail: {
            itemId: this.#resizeChildEvent.target.getAttribute('item-id'),
            from: from,
            to: to,
            thirdOfTotal: 1,
          }
        }));
      }

      this.#resizeChildEvent = null;
    })
    /*
    | -------------------------------------------- */



    /* ------------------------------------- *\
    |
    | Coordinate updating section
    |
    \* ------------------------------------- */
    this.addEventListener('startchanged', (e) => {
      const newStartCol = e.detail.start - this.startingYear + 1;
      e.target.style.setProperty('grid-column-start', newStartCol);
    });

    this.addEventListener('endchanged', (e) => {
      // offset extra + 1 for CSS grid column end
      const newStartCol = e.detail.end - this.startingYear + 2;
      e.target.style.setProperty('grid-column-end', newStartCol);
    });

    this.addEventListener('moveEnter', (e) => {
      const targetColumn = e.detail.targetIndex + parseInt(e.target.getAttribute('start')) - this.startingYear;
      this.#updateItemBoundaries(targetColumn)
    });
    /*
    | -------------------------------------------- */
  }

  #updateItemBoundaries(targetColumn) {
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