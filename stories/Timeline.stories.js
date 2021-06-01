import '../src/Timeline';

export default {
  title: 'ATA/Timeline',
  argTypes: {

  }
}

const Template = (args) =>
`
<ata-timeline 
    years="${args.years}"
    age="${args.age}"
    startingYear="${args.startingYear}"
/>
`;

export const EmptyTimeline = Template.bind({});
EmptyTimeline.args = {
  years: 15,
  age: 30,
  startingYear: 2021
}
