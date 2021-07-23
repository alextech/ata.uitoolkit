'use strict';

import style from './TimelineEvent.scss';


const eventTpl = document.createElement('template');
eventTpl.innerHTML = `
<div id="goalIcon">
    <img draggable="false" src="" alt="" />
</div>
<!--<div class="existingGoal" style="height: 2em; background-color: cornflowerblue">-->
  <div id="goalLeft" draggable="true" data-handle-index="1">&nbsp;</div>
  
  <div id="goal"></div>
  
  <div id="goalRight" draggable="true">&nbsp;</div>
  <div id="goalStrip">&nbsp;</div>
<!--</div>-->
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

  #goalIconNode;


  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(eventTpl.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [style];

    this.#rightDragNode = this.shadowRoot.querySelector('#goalRight');
    this.#goalIconNode = this.shadowRoot.querySelector('#goalIcon');
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

    goalRight.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
    goalRight.addEventListener('dragover', (e) => {
      e.preventDefault();
    });
    goalRight.addEventListener('dragend',  () => {
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
    const goalLeft = this.shadowRoot.querySelector('#goalLeft');
    goalLeft.addEventListener('dragstart',  (e) => {
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
    goalLeft.addEventListener('dragend',  () => {
      this.#actionType = '';

      this.dispatchEvent(new CustomEvent('resizeEnd', {detail: {
        eventId: this.getAttribute('event-id'),
      }, bubbles: true, composed: true}));
    });
    goalLeft.addEventListener('dragenter', (e) => {
      e.preventDefault();
    });
    goalLeft.addEventListener('dragover', (e) => {
      e.preventDefault();
    });


  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;


    switch (attribute) {
      case 'start': {
        const length = this.end - parseInt(newValue) + 1;
        this.shadowRoot.host.style.setProperty('--length', length);
      }

        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const goalHandlersContainer = this.shadowRoot.querySelector('#goal');
          let diffGoalHandles = parseInt(newValue) - parseInt(oldValue);

          if (diffGoalHandles > 0) {
            while (diffGoalHandles > 0) {
              if (goalHandlersContainer.lastElementChild != null) {
                goalHandlersContainer.removeChild(goalHandlersContainer.lastElementChild);
              }
              diffGoalHandles--;
            }
          } else {
            while (diffGoalHandles < 0) {
              this.#addDragNodeAtIndex(goalHandlersContainer.childElementCount + 1);
              diffGoalHandles++;
            }
          }
        }

        this.#positionIcon();

        this.dispatchEvent(new CustomEvent("startchanged", {detail: {start: newValue}, bubbles: true, composed: true}));

        break;
      case 'end': {
        const length = parseInt(newValue) - this.start + 1;
        this.shadowRoot.host.style.setProperty('--length', length);
      }

        if (this.#actionType === 'resizing' || this.#actionType === '') {
          const goalHandlersContainer = this.shadowRoot.querySelector('#goal');
          let diffGoalHandles = parseInt(newValue) - parseInt(oldValue);

          if (diffGoalHandles < 0) {
            while (diffGoalHandles < 0) {
              if (goalHandlersContainer.lastElementChild != null) {
                goalHandlersContainer.removeChild(goalHandlersContainer.lastElementChild);
              }
              diffGoalHandles++;
            }
          } else {
            while (diffGoalHandles > 0) {
              this.#addDragNodeAtIndex(goalHandlersContainer.childElementCount + 1);
              diffGoalHandles--;
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

    this.shadowRoot.querySelector('#goal').appendChild(dragNode);
  }


  #positionIcon() {
    const third = Math.floor((this.end - this.start) / 3 + 1);
    if(third === 1) {
      this.#goalIconNode.classList.add('widthOne');
    } else {
      this.#goalIconNode.classList.remove('widthOne');
    }
    this.#goalIconNode.style.setProperty('grid-column', third);
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
