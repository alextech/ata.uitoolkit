'use strict';

import style from './TimelineEvent.scss';


const eventTpl = document.createElement('template');
eventTpl.innerHTML = `
<div class="existingGoal" style="height: 2em; background-color: cornflowerblue">
  <div class="goalLeft">&nbsp;</div>
  
  <div class="goal"></div>
  
  <div class="goalRight"
     draggable="true"
 
  
     >&nbsp;</div>
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


  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    this.shadowRoot.appendChild(eventTpl.content.cloneNode(true));
    this.shadowRoot.adoptedStyleSheets = [style];
  }

  connectedCallback() {
    const startColumn = parseInt(this.getAttribute('start')) - this.parentElement.startingYear;
    const endColumn = parseInt(this.getAttribute('end')) - this.parentElement.startingYear;

    const iconColumn = Math.floor(startColumn + (endColumn - startColumn) / 2);
    const icon = this.shadowRoot.querySelectorAll('img')[0];
    icon.src = this.getAttribute('icon');
    icon.style.setProperty('grid-column', `${iconColumn} / ${iconColumn + 1}`);

    const goalNode = this.shadowRoot.querySelector('.goal');
    const end = parseInt(this.getAttribute('end'));
    const start = parseInt(this.getAttribute('start'))

    // keep 1-based to be consistent with CSS grid columns
    for (let year = start, i = 1; year <= end; year++, i++) {
      const dragNode = document.createElement('div');
      dragNode.className = 'dragHandler';
      dragNode.draggable = true;
      dragNode.dataset.handleIndex = i+'';
      dragNode.dataset.year = year+'';

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

      goalNode.appendChild(dragNode);
    }

    /* ------------------------------------- *\
    |
    | Resizing dragging setup
    |
    \* ------------------------------------- */
    this.shadowRoot.querySelectorAll('.goalRight')[0].addEventListener('dragstart',  (e) => {

      this.#actionType = 'resizing';

      this.dispatchEvent(new CustomEvent('resizeStart', {detail: {
        eventId: this.getAttribute('event-id'),
        direction: 'right'
      }}))
    });
    this.shadowRoot.querySelectorAll('.goalRight')[0].addEventListener('dragend',  (e) => {
      e.preventDefault();

      this.dispatchEvent(new CustomEvent('resizeEnd', {
        eventId: this.getAttribute('event-id'),
      }))
    });
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (attribute) {
      case 'start':
        // TODO if not moving everything
        this.dispatchEvent(new CustomEvent("startchanged", {detail: {start: newValue}}));

        break;
      case 'end':
        // TODO if not moving everything
        if(this.#actionType === 'resizing') {
          const goalHandlersContainer = this.shadowRoot.querySelector('.goal');
          let numGoalHandles = goalHandlersContainer.childElementCount;
          const diffGoalHandles = parseInt(oldValue) - parseInt(newValue) + 1;
          while (diffGoalHandles > 1 && numGoalHandles > diffGoalHandles) {
            goalHandlersContainer.removeChild(goalHandlersContainer.lastElementChild);
            numGoalHandles--;
          }
        }
        this.dispatchEvent(new CustomEvent("endchanged", {detail: {end: newValue}}));

        break;
    }
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
