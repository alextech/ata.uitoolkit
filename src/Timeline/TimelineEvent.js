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
    return [];
  }

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
    const numCols = parseInt(this.getAttribute('end')) - parseInt(this.getAttribute('start'));

    for (let i = 0; i < numCols; i++) {
      const dragNode = document.createElement('div');
      dragNode.className = 'dragHandler';
      dragNode.draggable = true;

      const that = this;
      const handleIndex = i;
      dragNode.addEventListener('dragstart', (e) => {
        that.dispatchEvent(new CustomEvent('moveStart', {detail: {
            handleIndex: handleIndex,
        }}));
      });

      dragNode.addEventListener('dragend', (e) => {
        that.dispatchEvent(new CustomEvent('moveEnd'));
      });

      goalNode.appendChild(dragNode);
    }

    // this.shadowRoot.querySelectorAll('.goalRight')[0].addEventListener('dragstart',  (e) => {
    //   e.preventDefault();
    // });
  }

}

if(!customElements.get('ata-timeline-event')) {
  customElements.define('ata-timeline-event', Event);
}
