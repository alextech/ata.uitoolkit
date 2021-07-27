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

  for (const item of args.events ?? []) {
    innerHtml += `
        <ata-timeline-event 
            event-id="${item.item_id}" 
            start="${item.start}" end="${item.end}" icon=""
            handleIndex="${item.handleIndex}"
            slot="events">
            
            <a href="/" slot="itemIcon">
                <img src="${item.icon}" alt="${item.item_name}" />
            </a>
            
        </ata-timeline-event>`;
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
      item_id: "sample_1",
      item_name: "sample 1",
      icon: event_1_Icon
    },
    {
      start: 2035,
      end: 2041,
      item_id: "sample_2",
      item_name: "sample 2",
      icon: event_1_Icon
    },
  ],

};
