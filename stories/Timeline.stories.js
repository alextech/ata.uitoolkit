import '../src/Timeline';
import event_1_Icon from './assets/dollar.png';

export default {
  title: 'ATA/Timeline',
  argTypes: {

  }
}

const EmptyTemplate = (args) =>
`
<ata-timeline 
    years="${args.years}"
    startingYear="${args.startingYear}"
    age="${args.age}"
/>`;

const TimelineWithEventTemplate = (args) => `
<ata-timeline 
    years="${args.years}" 
    startingYear="${args.startingYear}"
    age="${args.age}"
>
    <ata-timeline-event event-id="sample_1" start="${args.eventStart}" end="${args.eventEnd}" icon="${args.icon}" slot="events" />
</ata-timeline>`;

export const EmptyTimeline = EmptyTemplate.bind({});
EmptyTimeline.args = {
  years: 15,
  age: 34,
  startingYear: 2021
}

export const TimelineWithEvent = TimelineWithEventTemplate.bind({});
TimelineWithEvent.args = {
  years: 15,
  age: 34,
  startingYear: 2021,

  eventStart: 2025,
  eventEnd: 2033,

  icon: event_1_Icon
};
