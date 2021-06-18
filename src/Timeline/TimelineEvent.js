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
    const numCols = parseInt(this.getAttribute('end')) - parseInt(this.getAttribute('start')) + 1;

    // keep 1-based to be consistent with CSS grid columns
    for (let i = 1; i <= numCols; i++) {
      const dragNode = document.createElement('div');
      dragNode.className = 'dragHandler';
      dragNode.draggable = true;

      const that = this;
      const handleIndex = i;
      dragNode.addEventListener('dragstart', (e) => {
        that.dispatchEvent(new CustomEvent('moveStart', {detail: {
            handleIndex: handleIndex,
        }}));

        this.#moveIndex = handleIndex;
      });

      dragNode.addEventListener('dragend', (e) => {
        that.dispatchEvent(new CustomEvent('moveEnd'));

        this.#moveIndex = -1;
      });

      dragNode.addEventListener('dragenter', (e) => {
        e.preventDefault();

        that.dispatchEvent(new CustomEvent('moveEnter', {detail: {
          targetIndex: handleIndex,
          handleIndex: this.#moveIndex,
        }}));
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
        that.dispatchEvent(new CustomEvent('moveEnd'));
      });

      goalNode.appendChild(dragNode);
    }

    // this.shadowRoot.querySelectorAll('.goalRight')[0].addEventListener('dragstart',  (e) => {
    //   e.preventDefault();
    // });
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
