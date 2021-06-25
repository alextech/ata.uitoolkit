import {Timeline} from "./Timeline";
import TimelineEvent from "./Timeline/TimelineEvent";

if(!customElements.get('ata-timeline')) {
    customElements.define('ata-timeline', Timeline);
}

if(!customElements.get('ata-timeline-event')) {
    customElements.define('ata-timeline-event', TimelineEvent);
}

