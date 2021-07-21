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
            event-id="${event.event_id}" 
            start="${event.start}" end="${event.end}" icon="${event.icon}"
            handleIndex="${event.handleIndex}"
            slot="events"></ata-timeline-event>`;
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
  years: 35,
  age: 34,
  startingYear: 2021,

  events: [
    {
      start: 2025,
      end: 2033,
      handleIndex: 3,
      event_id: "sample_1",
      icon: event_1_Icon
    },
    {
      start: 2035,
      end: 2041,
      handleIndex: 3,
      event_id: "sample_2",
      icon: event_1_Icon
    },
  ],

};
