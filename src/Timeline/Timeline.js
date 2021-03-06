'use strict';

import style from './Timeline.scss';

const ROW_OFFSET = 2;

const timelineTpl = document.createElement('template');
timelineTpl.innerHTML =
`
<div class="period"></div>
<div class="age"></div>
<div class="year"></div>
`;

function generateId() {
  return 'placeholder_'+(Math.random()*100);
}

export default class Timeline extends HTMLElement {
  static get observedAttributes() {
    return ['years', 'startingyear', 'age', 'disabled'];
  }

  #previousYears;
  #maxYear;
  #dragChildEvent = null;
  #resizeChildEvent = null;

  #newItemDragState = {
    isDraggingNewItem: false,
    newItemOrigin: -1,
    newItemPlaceholder: null
  };

  #currentTargetYear = -1;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  // noinspection JSUnusedGlobalSymbols
  connectedCallback() {
    this.draggable = false;
    const contentObserver = new MutationObserver((mutationsList) => {
      console.groupCollapsed("timeline_mutation")
      const itemDragRedispatchHandlerRef = this.#timelineItemDragEnterRedispatch.bind(this);

      for (const mutationRecord of mutationsList) {
        if (mutationRecord.addedNodes.length > 0) {
          this.#renderItems();

          mutationRecord.addedNodes.forEach((node) => {
            if(node.nodeName !== 'ATA-TIMELINE-ITEM') return;

            if (this.disabled) {
              node.setAttribute('disabled', '');
            }
            node.addEventListener('dragEnterExternal', itemDragRedispatchHandlerRef);
          });
        }

        if (mutationRecord.removedNodes.length > 0) {
          mutationRecord.removedNodes.forEach((node) => {
            node.removeEventListener('dragEnterExternal', itemDragRedispatchHandlerRef);
          });

          this.#renderItems();
        }
      }

      console.groupEnd()
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

      case 'disabled':
        // empty or null IS disabled
        // possibly enabled
        newValue = (newValue != null  && (newValue !== 'false'));
        this.shadowRoot.querySelectorAll('.dropTarget').forEach(handler => {
          handler.draggable = !newValue;
        });

        this.querySelectorAll('ata-timeline-item').forEach(item => {
          if (newValue) {
            item.setAttribute('disabled', 'true');
          } else {
            item.removeAttribute('disabled');
          }
        });

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
      dropTarget.style.setProperty('grid-column', `${column}`);
      dropTarget.style.setProperty('grid-row', '1 / '+(numRows+2));
      dropTarget.draggable = true;
      dropTarget.dataset.column = column+'';
      dropTarget.dataset.year = (currentYear++)+'';

      dropTarget.addEventListener('dragstart', (e) => {
        console.group("new placeholder");
        console.info("new placeholder node dragstart");

        this.#newItemDragState.isDraggingNewItem = true;
        this.#newItemDragState.newItemOrigin = parseInt(e.target.dataset.year);
        this.#newItemDragState.newItemPlaceholder = document.createElement('ata-timeline-item');
        console.log("dragstart year:", e.target.dataset.year);
        this.#newItemDragState.newItemPlaceholder.setAttribute('item-id', generateId());
        this.#newItemDragState.newItemPlaceholder.setAttribute('start', e.target.dataset.year);
        this.#newItemDragState.newItemPlaceholder.setAttribute('end', parseInt(e.target.dataset.year) + 1);

        this.appendChild(this.#newItemDragState.newItemPlaceholder);
      });

      dropTarget.addEventListener('dragend', (e) => {
        console.info("new placeholder node dragend", e.target);
        console.groupEnd();

        if (this.#newItemDragState.isDraggingNewItem) {
          this.dispatchEvent(new CustomEvent('NewItemRequest', {detail: {
              id: this.#newItemDragState.newItemPlaceholder.getAttribute('item-id'),
              start: this.#newItemDragState.newItemPlaceholder.start,
              end: this.#newItemDragState.newItemPlaceholder.end
            }}));
        }

        this.#newItemDragState.isDraggingNewItem = false;
        this.#newItemDragState.newItemPlaceholder.style.setProperty('z-index', 101);
        this.#newItemDragState.newItemPlaceholder = null;
        this.#currentTargetYear = -1;
      });

      dropTarget.addEventListener('dragenter', this.#dragEnterHandler.bind(this));

      dropTarget.addEventListener('click', (e) => {
        if (this.disabled) return;

        const start = parseInt(e.target.dataset.year), end = start;

        const newPlaceholder = document.createElement('ata-timeline-item');
        newPlaceholder.setAttribute('item-id', generateId());
        newPlaceholder.setAttribute('start', start+'');
        newPlaceholder.setAttribute('end', start+'');
        this.appendChild(newPlaceholder)

        this.dispatchEvent(new CustomEvent('NewItemRequest', {detail: {
            start: start,
            end: end,
            id: newPlaceholder.getAttribute('item-id')
          }}));
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

    // noinspection JSUnresolvedFunction
    this.shadowRoot.replaceChildren(tmpFragment);


    const slot = document.createElement('slot');
    slot.setAttribute('name', 'items');
    this.shadowRoot.appendChild(slot);
  }

  #timelineItemDragEnterRedispatch(e) {
    const handleIndex = e.detail.handleIndex;
    const timelineRelativeIndex = parseInt(e.target.dataset.gridColumn) + handleIndex - 2;

    const simulatedEventData = {
      target: {
        dataset: {
          year: timelineRelativeIndex + this.startingYear,
          column: timelineRelativeIndex
        },
      }
    }

    console.info("dragging new over item", simulatedEventData);

    this.#dragEnterHandler(simulatedEventData);
  }

  #dragEnterHandler(e) {
    console.groupCollapsed('entering node on main grid: ', e.target.dataset.column);

    this.#currentTargetYear = parseInt(e.target.dataset.year);

    if (this.#dragChildEvent != null) {
      this.#updateItemBoundaries(parseInt(e.target.dataset.column));
    }

    if (this.#resizeChildEvent != null) {
      switch (this.#resizeChildEvent.detail.direction) {
        case 'right':
          if(e.target.dataset.year >= this.#resizeChildEvent.target.start
              && Math.abs(e.target.dataset.year - this.#resizeChildEvent.target.end) === 1
          )
          {
            this.#resizeChildEvent.target.setAttribute('end', this.#currentTargetYear);
          }

          break;
        case 'left':
          if(e.target.dataset.year <= this.#resizeChildEvent.target.end
              && Math.abs(e.target.dataset.year - this.#resizeChildEvent.target.start) === 1
          )
          {
            this.#resizeChildEvent.target.setAttribute('start', this.#currentTargetYear);
          }

          break;
      }
    }

    const dragState = this.#newItemDragState;

    if (dragState.isDraggingNewItem) {
      let target = parseInt(e.target.dataset.year);


      let start, end;
      if (target > dragState.newItemOrigin) {
        start = dragState.newItemOrigin;
        end = target;
      } else {
        start = target;
        end = dragState.newItemOrigin;
      }

      console.log('setting placeholder range', [start, end]);

      dragState.newItemPlaceholder.setAttribute('start', start);
      dragState.newItemPlaceholder.setAttribute('end', end);
    }

    console.groupEnd();
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

  #renderItems() {
    const items = this.getElementsByTagName('ata-timeline-item');

    const currentNumRows = parseInt(this.shadowRoot.host.style.getPropertyValue('--rows'));
    const rows = this.#assignRows();

    if (!(this.#isDragging() && rows.length < currentNumRows)) {
      const numRows = (rows.length > 0 ? rows.length : 1);
      this.shadowRoot.host.style.setProperty('--rows', numRows);
      this.shadowRoot.querySelectorAll('.dropTarget').forEach((dropTarget) => {
        dropTarget.style.setProperty('grid-row-end', numRows + ROW_OFFSET);
      });
    }

    for (const item of items) {
      item.setAttribute('slot', 'items');

      let startRow = 0;
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (const range of row) {
          if (range.itemId === item.getAttribute('item-id')) {
            item.setAttribute('row', i+1+'');
            startRow = i+ROW_OFFSET;
          }
        }
      }

      const start = parseInt(item.getAttribute('start'));
      const end = parseInt(item.getAttribute('end'));

      if (start < this.startingYear || end > this.#maxYear)
      {
        console.error(
            `Item ${item.getAttribute('item-id')} start or end is outside of the range of timeline.`,
            `item range: ${start} - ${end}`,
            `timeline range: ${this.startingYear} - ${this.#maxYear}`
        )
      }

      let startColumn = start - this.startingYear + 1;
      let endColumn = end - this.startingYear + 2;

      startColumn = startColumn > 0 ? startColumn : 1;
      endColumn = endColumn > 0 ? endColumn : 1;

      item.style.setProperty('grid-column', `${startColumn} / ${endColumn}`);
      item.dataset.gridColumn = startColumn+'';
      item.style.setProperty('grid-row', `${startRow} / ${startRow + 1}`);

      if (!this.#newItemDragState.isDraggingNewItem)
      {
        item.style.setProperty('z-index', 101);
      }
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
      this.#dragChildEvent = null;
      this.#renderItems();
    });
    this.addEventListener('resizeStart', (e) => {
      this.#resizeChildEvent = e;
    });
    this.addEventListener('resizeEnd', () => {
      this.#resizeChildEvent = null;
      this.#renderItems()
    })
    /*
    | -------------------------------------------- */



    /* ------------------------------------- *\
    |
    | Coordinate updating section
    |
    \* ------------------------------------- */
    this.addEventListener('startchanged', (e) => {
      console.log('startchanged', e);
      const newStartCol = e.detail.start - this.startingYear + 1;
      e.target.style.setProperty('grid-column-start', newStartCol);

      this.#renderItems();
    });

    this.addEventListener('endchanged', (e) => {
      // offset extra + 1 for CSS grid column end
      const newStartCol = e.detail.end - this.startingYear + 2;
      e.target.style.setProperty('grid-column-end', newStartCol);

      this.#renderItems();
    });

    this.addEventListener('moveEnter', (e) => {
      const targetColumn = e.detail.targetIndex + parseInt(e.target.getAttribute('start')) - this.startingYear;
      this.#updateItemBoundaries(targetColumn);

      console.log("moveEnter -> renderItems");
      this.#renderItems();
    });
    /*
    | -------------------------------------------- */


    /* ------------------------------------- *\
    |
    | Coordinate updating section
    |
    \* ------------------------------------- */

    const itemNodes = this.getElementsByTagName('ata-timeline-item');
    for (const itemNode of itemNodes) {
      itemNode.addEventListener('dragEnterExternal', this.#timelineItemDragEnterRedispatch.bind(this));
    }
  }

  #updateItemBoundaries(targetColumn) {
    const e = this.#dragChildEvent;
    const originalColumn = e.detail.handleIndex + parseInt(e.target.getAttribute('start')) - this.startingYear;

    const diff = targetColumn - originalColumn;

    if (diff === 0
        // || Math.abs(diff) > 1
    ) {
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

  #assignRows() {
    const itemNodes = this.getElementsByTagName('ata-timeline-item');

    const rows = [
      []
    ]

    // collect row info
    for (const item of itemNodes) {

      const itemRange = {
        itemId: item.getAttribute('item-id'),
        start: parseInt(item.getAttribute('start')),
        end: parseInt(item.getAttribute('end'))
      }

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        let hasIntersection = false;
        for (const range of row) {
          if (Timeline.#intersects(range, itemRange)) {
            if ((i + 1) > (rows.length-1)) {
              rows.push([]);
            }

            hasIntersection = true;
            break;
          }
        }

        if (!hasIntersection) {
          row.push(itemRange);
          break;
        }
      }
    }

    Timeline.#consoleLogRows(rows)

    return rows;
  }

  #isDragging() {
    return (
        this.#dragChildEvent !== null ||
        this.#resizeChildEvent !== null ||
        this.#newItemDragState.isDraggingNewItem
    );
  }

  static #consoleLogRows(rows) {
    for (const row of rows) {
      console.table(row);
    }
  }

  static #intersects(range_1, range_2) {

    return (
        (range_2.start >= range_1.start && range_2.start <= range_1.end) ||
        (range_2.end >= range_1.start && range_2.end <= range_1.end) ||
        (range_2.end >= range_1.end && range_2.start <= range_1.start)
    );
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

  set disabled(isDisabled) {
    if (isDisabled) {
      this.setAttribute('disabled', '');
    } else {
      this.removeAttribute('disabled');
      delete this.dataset.disabled;
    }
  }

  get disabled() {
    return this.hasAttribute('disabled') && this.getAttribute('disabled') !== 'false';
  }
}

if(!customElements.get('ata-timeline')) {
  customElements.define('ata-timeline', Timeline);
}