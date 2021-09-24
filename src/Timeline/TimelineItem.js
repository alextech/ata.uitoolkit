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

export default class Event extends HTMLElement {
  static get observedAttributes() {
    return ['start', 'end'];
  }

  #moveIndex = -1;

  #originalStart;
  #originalEnd;

  #actionType;
  #actionDirection;
  #rightDragNode;

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(eventTpl.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [style];
    document.adoptedStyleSheets = [ ...document.adoptedStyleSheets, lightDomStyle ];
  }

  connectedCallback() {
    this.#rightDragNode = this.shadowRoot.querySelector('#itemRight');

    const contentObserver = new MutationObserver((mutationsList) => {
      for (const mutationRecord of mutationsList) {
        if (mutationRecord.addedNodes.length > 0) {

          let i = 0;
          do {
            const addedNode = mutationRecord.addedNodes[i];
            if (!(addedNode instanceof Element) || addedNode.getAttribute('slot') !== 'itemIcon') continue;

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


  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;


    switch (attribute) {
      case 'start':
        if (isNaN(this.end)) break;

        console.log('start:', newValue, 'end:', this.end);

      {
        const length = this.end - parseInt(newValue) + 1;
        this.shadowRoot.host.style.setProperty('--length', length);
      }

        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const itemHandlersContainer = this.shadowRoot.querySelector('#item');
          let diffItemHandles = parseInt(newValue) - parseInt(oldValue);

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
        console.log('start:', newValue, 'end:', this.end);

      {
        const length = parseInt(newValue) - this.start + 1;
        this.shadowRoot.host.style.setProperty('--length', length);
      }

        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const itemHandlersContainer = this.shadowRoot.querySelector('#item');
          let diffItemHandles = parseInt(newValue) - parseInt(oldValue);

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
    itemIconNode.setAttribute('draggable', false);
    itemIconNode.querySelector('img').setAttribute('draggable', false);


    const third = Math.floor((this.end - this.start) / 3 + 1);
    if(third === 1) {
      itemIconNode.classList.add('widthOne');
    } else {
      itemIconNode.classList.remove('widthOne');
    }
    itemIconNode.style.setProperty('grid-column', third);
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

}

if(!customElements.get('ata-timeline-item')) {
  customElements.define('ata-timeline-item', Event);
}
