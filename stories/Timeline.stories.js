import '../src/index';
import event_1_Icon from './assets/dollar.png';

export default {
  title: 'ATA/Timeline',
  argTypes: {
    NewEventRequest: { action: 'NewEventRequest' },
    EventChanged: { action: 'EventChanged' }
  }
}

const TimelineTemplate = (args) => {
  const tpl = document.createElement('div');
  let innerHtml =
  `<ata-timeline
      id="timelineCmp"
      years="${args.years}"
      startingYear="${args.startingYear}"
      age="${args.age}"
  >`;

  for (const event of args.events ?? []) {
    innerHtml += `
        <ata-timeline-event 
            event-id="sample_1" 
            start="${event.start}" end="${event.end}" icon="${event.icon}"
            slot="events" />`;
  }

  innerHtml += '</ata-timeline>';
  tpl.innerHTML = innerHtml;

  const timelineEl = tpl.firstElementChild;
  timelineEl.addEventListener('NewEventRequest', (e) => {
    args.NewEventRequest(e.detail);
  });
  timelineEl.addEventListener('EventChanged', (e) => {
    args.EventChanged(e.detail);
  });

  return timelineEl;
}

export const EmptyTimeline = TimelineTemplate.bind({});
EmptyTimeline.args = {
  years: 15,
  age: 34,
  startingYear: 2021,
}

export const TimelineWithEvent = TimelineTemplate.bind({});
TimelineWithEvent.args = {
  years: 15,
  age: 34,
  startingYear: 2021,

  events: [
    {
      start: 2025,
      end: 2033,
      icon: event_1_Icon
    }
  ],

};
