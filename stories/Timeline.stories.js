import '../src/Timeline';

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
    <ata-timeline-event start="${args.eventStart}" end="${args.eventEnd}" />
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
  eventEnd: 2034
};
