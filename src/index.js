import {Timeline} from "./Timeline";
import TimelineItem from "./Timeline/TimelineItem";

if(!customElements.get('ata-timeline')) {
    customElements.define('ata-timeline', Timeline);
}

if(!customElements.get('ata-timeline-item')) {
    customElements.define('ata-timeline-item', TimelineItem);
}

