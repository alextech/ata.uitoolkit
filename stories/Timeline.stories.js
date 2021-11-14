import '../src/index';
import item_1_Icon from './assets/dollar.png';

export default {
  title: 'ATA/Timeline',
  argTypes: {
    NewItemRequest: { action: 'NewItemRequest' },
    ItemChanged: { action: 'ItemChanged' }
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

  let i = 1;
  for (const item of args.items ?? []) {
    innerHtml += `
        <ata-timeline-item 
            item-id="${item.item_id}" 
            start="${item.start}" end="${item.end}" icon=""
            iconyear="${item.iconYear}"
            slot="items">
            
            <a href="/" slot="itemIcon">
                <img src="${item.icon}" alt="${item.item_name}" />
            </a>
            
        </ata-timeline-item>`;
    i++;
  }

  innerHtml += '</ata-timeline>';
  tpl.innerHTML = innerHtml;

  const timelineEl = tpl.firstElementChild;
  timelineEl.addEventListener('NewItemRequest', (e) => {
    args.NewItemRequest(e.detail);
  });
  timelineEl.addEventListener('ItemChanged', (e) => {
    args.ItemChanged(e.detail);
  });

  return timelineEl;
}

export const EmptyTimeline = TimelineTemplate.bind({});
EmptyTimeline.args = {
  years: 15,
  age: 34,
  startingYear: 2021,
}

export const TimelineWithItem = TimelineTemplate.bind({});
TimelineWithItem.args = {
  years: 35,
  age: 34,
  startingYear: 2021,

  items: [
    {
      start: 2025,
      end: 2033,
      item_id: "sample_1",
      item_name: "sample 1",
      icon: item_1_Icon
    },
    // {
    //   start: 2035,
    //   end: 2041,
    //   item_id: "sample_2",
    //   item_name: "sample 2",
    //   icon: item_1_Icon
    // },
  ],

};

export const OverlappingItems = TimelineTemplate.bind({});
OverlappingItems.args = {
  years: 35,
  age: 34,
  startingYear: 2021,

  items: [
    {
      start: 2025,
      end: 2033,
      item_id: "sample_1",
      item_name: "sample 1",
      icon: item_1_Icon
    },
    {
      start: 2028,
      end: 2034,
      item_id: "sample_2",
      item_name: "sample 2",
      icon: item_1_Icon,
      iconYear: 2033
    },
  ],

};
