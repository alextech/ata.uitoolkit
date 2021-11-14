'use strict';

import style from './TimelineItem.scss';
import lightDomStyle from './TimelineItemLight.scss';


const eventTpl = document.createElement('template');
eventTpl.innerHTML = `
<slot name="itemIcon">
    
</slot>
  <div id="itemLeft" draggable="true" data-handle-index="1">&nbsp;</div>
  
  <div id="item"></div>
  
  <div id="itemRight" draggable="true">&nbsp;</div>
  <div id="itemStrip">&nbsp;</div>
`;

const __DEFAULT_ICON_POSITION__ = 3;

export default class Event extends HTMLElement {
  static get observedAttributes() {
    return ['start', 'end', 'iconyear'];
  }

  #moveIndex = -1;

  #originalStart;
  #originalEnd;

  #actionType;
  #actionDirection;
  #rightDragNode;

  #iconInitialYear;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(eventTpl.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [style];
    document.adoptedStyleSheets = [ ...document.adoptedStyleSheets, lightDomStyle ];
  }

  connectedCallback() {
    let iconYear = this.iconYear;
    if(iconYear == null || isNaN(iconYear)) {
      this.iconYear = Math.floor((this.end - this.start) / __DEFAULT_ICON_POSITION__) + this.start;
    }

    this.#rightDragNode = this.shadowRoot.querySelector('#itemRight');

    const contentObserver = new MutationObserver((mutationsList) => {
      for (const mutationRecord of mutationsList) {
        if (mutationRecord.addedNodes.length > 0) {

          let i = 0;
          do {
            const addedNode = mutationRecord.addedNodes[i];
            if (!(addedNode instanceof Element) || addedNode.getAttribute('slot') !== 'itemIcon') continue;

            this.#iconNodeDragEvents(addedNode);
            this.#positionIcon();

            i++;
          } while(i > mutationRecord.addedNodes.length)


        }
      }
    });
    contentObserver.observe(this, {childList: true});

    const end = parseInt(this.getAttribute('end'));
    const start = parseInt(this.getAttribute('start'))

    // keep 1-based to be consistent with CSS grid columns
    for (let year = start, i = 1; year <= end; year++, i++) {
      this.#addDragNodeAtIndex(i)
    }

    /* ------------------------------------- *\
    |
    | Right Resizing dragging setup
    |
    \* ------------------------------------- */
    const itemRight = this.shadowRoot.querySelector('#itemRight');
    itemRight.addEventListener('dragstart',  (e) => {
      this.#actionType = 'resizing';
      this.#actionDirection = 'right';

      this.#originalStart = this.start;
      this.#originalEnd = this.end;
      this.dispatchEvent(new CustomEvent('resizeStart', {detail: {
        eventId: this.getAttribute('event-id'),
        direction: 'right',
        fromStart: this.#originalStart,
        fromEnd: this.#originalEnd,
        handleIndex: parseInt(e.target.dataset.handleIndex)
      }, bubbles: true, composed: true}))
    });

    itemRight.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
    itemRight.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    itemRight.addEventListener('dragend',  () => {
      this.#actionType = '';

      this.dispatchEvent(new CustomEvent('resizeEnd', {detail: {
        eventId: this.getAttribute('event-id'),
      }, bubbles: true, composed: true}));
    });


    /* ------------------------------------- *\
    |
    | Left Resizing dragging setup
    |
    \* ------------------------------------- */
    const itemLeft = this.shadowRoot.querySelector('#itemLeft');
    itemLeft.addEventListener('dragstart',  (e) => {
      this.#actionType = 'resizing';
      this.#actionDirection = 'left';

      this.#originalStart = this.start;
      this.#originalEnd = this.end;
      this.dispatchEvent(new CustomEvent('resizeStart', {detail: {
        eventId: this.getAttribute('event-id'),
        direction: 'left',
        fromStart: this.#originalStart,
        fromEnd: this.#originalEnd,
        handleIndex: parseInt(e.target.dataset.handleIndex)
      }, bubbles: true, composed: true}));
    });
    itemLeft.addEventListener('dragend',  () => {
      this.#actionType = '';

      this.dispatchEvent(new CustomEvent('resizeEnd', {detail: {
        eventId: this.getAttribute('event-id'),
      }, bubbles: true, composed: true}));
    });
    itemLeft.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
    itemLeft.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    const itemIconNode = this.querySelector('a[slot="itemIcon"]');
    this.#iconNodeDragEvents(itemIconNode)
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;
    oldValue = parseInt(oldValue);
    newValue = parseInt(newValue);
    if(isNaN(newValue)) return;


    switch (attribute) {
      case 'start':
        if (isNaN(this.end)) break;

        console.log('start:', newValue, 'end:', this.end);

      {
        const length = this.end - newValue + 1;
        this.shadowRoot.host.style.setProperty('--length', length);
      }

        let diffItemHandles = newValue - oldValue;
        if (this.#actionType === 'moving') {
          this.iconYear += diffItemHandles;
        }
        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const itemHandlersContainer = this.shadowRoot.querySelector('#item');

          if (diffItemHandles > 0) {
            while (diffItemHandles > 0) {
              if (itemHandlersContainer.lastElementChild != null) {
                itemHandlersContainer.removeChild(itemHandlersContainer.lastElementChild);
              }
              diffItemHandles--;
            }
          } else {
            while (diffItemHandles < 0) {
              this.#addDragNodeAtIndex(itemHandlersContainer.childElementCount + 1);
              diffItemHandles++;
            }
          }
        }
        this.#positionIcon();

        this.dispatchEvent(new CustomEvent("startchanged", {detail: {start: newValue}, bubbles: true, composed: true}));

        break;
      case 'end':
        console.log('start:', this.start, 'end:', newValue);
        const length = newValue - this.start + 1;
        this.shadowRoot.host.style.setProperty('--length', length);

        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const itemHandlersContainer = this.shadowRoot.querySelector('#item');
          let diffItemHandles = newValue - oldValue;

          if (diffItemHandles < 0) {
            while (diffItemHandles < 0) {
              if (itemHandlersContainer.lastElementChild != null) {
                itemHandlersContainer.removeChild(itemHandlersContainer.lastElementChild);
              }
              diffItemHandles++;
            }
          } else {
            while (diffItemHandles > 0) {
              this.#addDragNodeAtIndex(itemHandlersContainer.childElementCount + 1);
              diffItemHandles--;
            }
          }
        }

        this.#positionIcon();

        this.dispatchEvent(new CustomEvent("endchanged", {detail: {end: newValue}, bubbles: true, composed: true}));

        break;
      case 'iconyear':
        this.#positionIcon();

        break;
    }
  }

  #iconBoundariesCorrection() {
    let iconYear = this.iconYear;
    if (!(iconYear != null && !isNaN(iconYear))) return;

    let corrected = false;
    if (iconYear < this.start) {
      iconYear = this.start;
      corrected = true;
    }
    if (iconYear > this.end) { // newValue == this.end
      iconYear = this.end;
      corrected = true;
    }

    if(corrected)
    {
      this.iconYear = iconYear;
    }
  }

  #addDragNodeAtIndex(index) {
    const dragNode = document.createElement('div');
    dragNode.className = 'dragHandler';
    dragNode.draggable = true;
    dragNode.dataset.handleIndex = index+'';
    dragNode.style.setProperty('grid-column', index+'');

    /* ------------------------------------- *\
    |
    | Moving Dragging setup
    |
    \* ------------------------------------- */
    dragNode.addEventListener('dragstart', (e) => {
      console.group("timeline moving");
      console.info("timeline node dragstart");

      this.#actionType = 'moving';

      e.dataTransfer.effectAllowed = 'move';
      this.#originalStart = this.start;
      this.#originalEnd = this.end;
      this.dispatchEvent(new CustomEvent('moveStart', {detail: {
          fromStart: this.#originalStart,
          fromEnd: this.#originalEnd,
          handleIndex: parseInt(e.target.dataset.handleIndex),
        }, bubbles: true, composed: true}));

      this.#moveIndex = parseInt(e.target.dataset.handleIndex);
    });

    dragNode.addEventListener('dragend', () => {
      console.info("timeline node dragend");
      console.groupEnd();

      this.dispatchEvent(new CustomEvent('moveEnd', {bubbles: true, composed: true}));

      this.#actionType = '';

      this.#moveIndex = -1;
    });

    dragNode.addEventListener('dragenter', (e) => {
      e.preventDefault();

      console.log('item dragenter: ', this.#actionType);

      switch (this.#actionType) {
        case 'moving':
          this.dispatchEvent(new CustomEvent('moveEnter', {detail: {
              targetIndex: parseInt(e.target.dataset.handleIndex),
              handleIndex: this.#moveIndex,
            }, bubbles: true, composed: true}));

          break;
        case 'resizing':
          const attribute = this.#actionDirection === 'right' ? 'end' : 'start';
          const year = this.start + parseInt(e.target.dataset.handleIndex) - 1;
          this.setAttribute(attribute, year+'');

          break;

        case 'movingIcon':
          const itemIconNode = this.querySelector('a[slot="itemIcon"]');
          const column = e.target.dataset.handleIndex;
          itemIconNode.style.setProperty('grid-column', column);
          this.iconYear = this.start + parseInt(column) - 1;

          break;
        default: // if received while not in a state, it probably came from something else passing over it.
          this.dispatchEvent(new CustomEvent('dragEnterExternal', {
            detail: {
              handleIndex: parseInt(e.target.dataset.handleIndex)
            }
          }));

          break;
      }
    });



    /* ------------------------------------- *\
    |
    | Drop zone setup
    |   dragOVER is not over as in finished,
    |     but over as in on top of.
    |   Completion is DROP
    |
    \* ------------------------------------- */
    dragNode.addEventListener('dragover', (e) => {
      e.preventDefault();
    });

    dragNode.addEventListener('drop', (e) => {
      e.preventDefault();
    });

    this.shadowRoot.querySelector('#item').appendChild(dragNode);
  }


  #positionIcon() {
    const itemIconNode = this.querySelector('a[slot="itemIcon"]');
    if (itemIconNode === null) return;

    this.#iconBoundariesCorrection();
    itemIconNode.querySelector('img').setAttribute('draggable', false);

    const iconIndex = this.iconYear - this.start + 1;
    if(iconIndex === 1) {
      itemIconNode.classList.add('widthOne');
    } else {
      itemIconNode.classList.remove('widthOne');
    }
    itemIconNode.style.setProperty('grid-column', iconIndex);
  }

  #iconNodeDragEvents(iconNode) {
    if(iconNode == null) return;

    iconNode.addEventListener('dragstart', (e) => {
      this.#actionType = 'movingIcon';
      this.#iconInitialYear = this.iconYear;
    });

    iconNode.addEventListener('dragend', (e) => {
      this.#actionType = '';
      if (this.#iconInitialYear === this.iconYear) return;

      const from = {
        start: this.start,
        end: this.end,
        iconYear: this.#iconInitialYear
      };

      const to = {
        start: from.start,
        end: from.end,
        iconYear: this.iconYear
      }

      this.dispatchEvent(new CustomEvent('ItemChanged', {detail:{
        itemId: this.getAttribute('item-id'),
        from: from,
        to: to
        }, bubbles: true, composed: true}
      ));
    });
  }


  set start(start) {
    this.setAttribute('start', start);
  }

  get start() {
    return parseInt(this.getAttribute('start'));
  }

  set end(end) {
    this.setAttribute('end', end);
  }

  get end() {
    return parseInt(this.getAttribute('end'));
  }

  get duration() {
    return this.end - this.start + 1;
  }

  set iconYear(year) {
    this.setAttribute('iconYear', year);
  }

  get iconYear() {
    return parseInt(this.getAttribute('iconYear'));
  }

}

if(!customElements.get('ata-timeline-item')) {
  customElements.define('ata-timeline-item', Event);
}
