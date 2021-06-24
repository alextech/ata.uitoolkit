'use strict';

import style from './TimelineEvent.scss';


const eventTpl = document.createElement('template');
eventTpl.innerHTML = `
<div class="existingGoal" style="height: 2em; background-color: cornflowerblue">
  <div id="goalLeft" draggable="true">&nbsp;</div>
  
  <div id="goal"></div>
  
  <div id="goalRight" draggable="true">&nbsp;</div>
</div>
<div class="goalIcon lengthClass">
    <img draggable="false" src="" alt="" />
</div>`;

export default class Event extends HTMLElement {
  static get observedAttributes() {
    return ['start', 'end'];
  }

  #moveIndex = -1;

  #originalStart;
  #originalEnd;

  #actionType;
  #goalNode;


  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(eventTpl.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [style];

    this.#goalNode = this.shadowRoot.querySelector('#goal');
  }

  connectedCallback() {
    const startColumn = parseInt(this.getAttribute('start')) - this.parentElement.startingYear;
    const endColumn = parseInt(this.getAttribute('end')) - this.parentElement.startingYear;

    const iconColumn = Math.floor(startColumn + (endColumn - startColumn) / 2);
    const icon = this.shadowRoot.querySelectorAll('img')[0];
    icon.src = this.getAttribute('icon');
    icon.style.setProperty('grid-column', `${iconColumn} / ${iconColumn + 1}`);

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
    const goalRight = this.shadowRoot.querySelector('#goalRight');
    goalRight.addEventListener('dragstart',  (e) => {
      this.#actionType = 'resizing';

      this.dispatchEvent(new CustomEvent('resizeStart', {detail: {
        eventId: this.getAttribute('event-id'),
        direction: 'right'
      }}))
    });
    goalRight.addEventListener('dragend',  (e) => {
      this.#actionType = '';

      this.dispatchEvent(new CustomEvent('resizeEnd', {
        eventId: this.getAttribute('event-id'),
      }))
    });


    /* ------------------------------------- *\
    |
    | Left Resizing dragging setup
    |
    \* ------------------------------------- */
    const goalLeft = this.shadowRoot.querySelector('#goalLeft');
    goalLeft.addEventListener('dragstart',  (e) => {
      this.#actionType = 'resizing';

      this.dispatchEvent(new CustomEvent('resizeStart', {detail: {
        eventId: this.getAttribute('event-id'),
        direction: 'left'
      }}))
    });
    goalLeft.addEventListener('dragend',  (e) => {
      this.#actionType = '';

      this.dispatchEvent(new CustomEvent('resizeEnd', {
        eventId: this.getAttribute('event-id'),
      }))
    });


  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (attribute) {
      case 'start':
        if(this.#actionType === 'resizing' || this.#actionType === '') {
          const goalHandlersContainer = this.shadowRoot.querySelector('#goal');
          let diffGoalHandles = parseInt(newValue) - parseInt(oldValue);

          if(diffGoalHandles > 0) {
            while (diffGoalHandles > 0) {
              if(goalHandlersContainer.lastElementChild != null)
              {
                goalHandlersContainer.removeChild(goalHandlersContainer.lastElementChild);
              }
              diffGoalHandles--;
            }
          } else {
            while(diffGoalHandles < 0) {
              this.#addDragNodeAtIndex(goalHandlersContainer.childElementCount + 1);
              diffGoalHandles++;
            }
          }
        }

        this.dispatchEvent(new CustomEvent("startchanged", {detail: {start: newValue}}));

        break;
      case 'end':
        if(this.#actionType === 'resizing' || this.#actionType === '') {
          const goalHandlersContainer = this.shadowRoot.querySelector('#goal');
          let diffGoalHandles = parseInt(newValue) - parseInt(oldValue);

          if(diffGoalHandles < 0) {
            while (diffGoalHandles < 0) {
              if(goalHandlersContainer.lastElementChild != null)
              {
                goalHandlersContainer.removeChild(goalHandlersContainer.lastElementChild);
              }
              diffGoalHandles++;
            }
          } else {
            while(diffGoalHandles > 0) {
              this.#addDragNodeAtIndex(goalHandlersContainer.childElementCount + 1);
              diffGoalHandles--;
            }
          }
        }

        this.dispatchEvent(new CustomEvent("endchanged", {detail: {end: newValue}}));

        break;
    }
  }

  #addDragNodeAtIndex(index) {
    const dragNode = document.createElement('div');
    dragNode.className = 'dragHandler';
    dragNode.draggable = true;
    dragNode.dataset.handleIndex = index+'';

    /* ------------------------------------- *\
    |
    | Moving Dragging setup
    |
    \* ------------------------------------- */
    dragNode.addEventListener('dragstart', (e) => {
      this.#actionType = 'moving';

      e.dataTransfer.effectAllowed = 'move';
      this.#originalStart = this.start;
      this.#originalEnd = this.end;
      this.dispatchEvent(new CustomEvent('moveStart', {detail: {
          fromStart: this.#originalStart,
          fromEnd: this.#originalEnd,
          handleIndex: parseInt(e.target.dataset.handleIndex),
        }}));

      this.#moveIndex = parseInt(e.target.dataset.handleIndex);
    });

    dragNode.addEventListener('dragend', (e) => {
      this.dispatchEvent(new CustomEvent('moveEnd'));

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
            }}));

          break;
        case 'resizing':

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

    this.#goalNode.appendChild(dragNode);
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

if(!customElements.get('ata-timeline-event')) {
  customElements.define('ata-timeline-event', Event);
}
