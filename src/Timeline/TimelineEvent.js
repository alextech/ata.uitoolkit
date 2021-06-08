'use strict';

export default class Event extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();

  }


}

if(!customElements.get('ata-timeline-event')) {
  customElements.define('ata-timeline-event', Event);
}
