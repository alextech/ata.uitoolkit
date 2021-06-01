'use strict';

import style from './Timeline.scss';

/*

<div id="timeline"
         style="
              grid-template-columns: repeat(@numColumns, minmax(1.4em, 1em));
              grid-template-rows: repeat(4, 3em) 1em 3em;
        "
         >

        @* // CSS Grid is 1-based, not 0-based *@
        @for (int i = 1; i <= numColumns + 1; i++)
        {
            <div class="period" style="grid-column: @i; grid-row: 1/5;"></div>
        }

        @for (int i = 1; i <= numColumns + 1; i++)
        {
            int yearColumn = i;
            <div class="dropTarget"
                 style="grid-column: @i; grid-row: 1/5;"
                 draggable="true"

                 @ondragstart="@(() => OnNewProfileDragStart(yearColumn))"

                 @onclick="@(() => OnNewProfileClicked(yearColumn))"

                 @ondrop="@(() => _columnDropHandler(yearColumn))"
                 @ondragenter="@(() => OnYearEnter(yearColumn))"
                 ondragover="event.preventDefault();"
            ></div>
        }

        @if (_isNewProfileDragging)
        {
            int columnStart;
            int columnEnd;

            if (_currentDragColumn < _startDragAt)
            {
                columnStart = _currentDragColumn;
                columnEnd = _startDragAt + 1;
            }
            else
            {
                columnStart = _startDragAt;
                columnEnd = _currentDragColumn + 1;
            }
            <div class="goal"
                 style="grid-column: @(columnStart) / @(columnEnd); grid-row: 4/5; "
            >&nbsp;</div>
        }

        @{
            int primaryYears = CurrentYear + PrimaryLifespan - PrimaryAge;
            int jointYears = JointAge > 0 ? CurrentYear + JointLifespan - JointAge : 0;
            int maxYear = primaryYears > jointYears ? primaryYears : jointYears;
        }

        @{
            int row = 4;
        }
        @foreach (Profile profile in PrimaryClient.Profiles)
        {
            int start = profile.Meta.GoalStart - CurrentYear + 1;
            int end;

            if (!_isResizeDragging)
            {
                end = profile.Meta.GoalEnd - CurrentYear + 1;
            }
            else
            {
                end = _currentDragColumn;
            }

            string lengthClass = "";
            if (start != end && (start - end) % 2 == 0)
            {
                lengthClass = "evenLength";
            }

            <div class="existingGoal" style="grid-column: @start / @end; grid-row: @row / @(row + 1)">

                <div class="goalLeft">&nbsp;</div>

                <div class="goal @(!_isResizeDragging ? "aboveDropTarget" : "")">&nbsp;</div>

                <div class="goalRight"
                     draggable="true"

                     @ondragstart="@(() => RightResizeDrag(profile.Guid, end))"
                     @ondragend="@OnDragEnd"

                     ondragover="event.preventDefault();">&nbsp;</div>

            </div>

            int iconColumn = start + (end - start) / 2;
            <div class="goalIcon @lengthClass" style="grid-column: @iconColumn / @(iconColumn + 1); grid-row: @(row - 1) / @row">
                <img src="/_content/KycViewer/icons/@(profile.Meta.Icon).png" alt="@profile.Name" />
            </div>

            // @TODO decrement only when overlap
            // row -= 2;
        }


        @for (int i = PrimaryAge; i <= PrimaryLifespan; i++)
        {
            @if (i % 2 == 0)
            {
                <div class="age" style="grid-row: 5/6">@i</div>
            }
            else
            {
                <div class="age" style="grid-row: 5/6">&nbsp;</div>
            }

        }

        @{
            int column = 1;
        }
        @for (int i = CurrentYear; i <= maxYear; i++)
        {
            <div class="year @(i%2==0 ? "even" : "odd")" style="grid-column: @column; grid-row: 6/7;">@i</div>
            column++;
        }
    </div>
 */

const timelineTpl = document.createElement('template');
timelineTpl.innerHTML =
`
<div class="period even" style="grid-row: 1/5;"></div>
<div class="age" style="grid-row: 5/6"></div>
<div class="year even" style="grid-row: 6/7;"></div>
`;

let gridTemplate;

export default class Timeline extends HTMLElement {

  static get observedAttributes() {
    return ['years', 'startingYear', 'age'];
  }

  constructor() {
    super();

    this.attachShadow({mode: 'open'});
    gridTemplate = timelineTpl.content;

    this.shadowRoot.adoptedStyleSheets = [style];
  }

  attributeChangedCallback(attribute, oldValue, newValue) {
    if(oldValue === newValue) return;

    switch (attribute) {
      case 'years':

        this.#setupGrid(parseInt(newValue));
        break;

      case 'age':
        this.#updateAge(parseInt(newValue));

        break;
    }
  }


  // #setupGrid(years) {
  #setupGrid() {
    const years = this.getAttribute('years');

    this.shadowRoot.host.style.setProperty('--years', years);
    this.shadowRoot.innerHTML = '';

    const tmpFragment = document.createDocumentFragment();
    const periodTpl = gridTemplate.firstElementChild;
    const ageTpl = periodTpl.nextElementSibling;
    const yearTpl = ageTpl.nextElementSibling;

    for (let i = 1; i <= years; i++) {
      tmpFragment.appendChild(periodTpl.cloneNode());
    }

    let currentAge = parseInt(this.getAttribute('age'));
    for (let i = 1; i <= years; i++) {
      const ageCell = ageTpl.cloneNode();
      if (i % 2 === 0) {
        ageCell.innerText = "\u00A0";
      } else {
        ageCell.innerText = currentAge;
      }
      currentAge++;

      tmpFragment.appendChild(ageCell);
    }

    let currentYear = parseInt(this.getAttribute('startingYear'));
    for (let i = 1; i <= years; i++) {
      const yearCell = yearTpl.cloneNode();
      yearCell.classList.add(i % 2 === 0 ? 'even' : 'odd');
      yearCell.innerText = currentYear;

      tmpFragment.appendChild(yearCell);
    }

    this.shadowRoot.append(tmpFragment);
  }

  #updateAge(age) {
    const ageNodes = this.shadowRoot.querySelectorAll('.age');

    let i = 0;
    for (const ageNode of ageNodes) {
      if (i % 2 === 0) {
        ageNode.innerText = age;
      }

      i++;
      age++;
    }
  }

  set years(years) {
    this.setAttribute('years', years);
  }

  get years() {
    return this.getAttribute('years');
  }

  set startingYear(startingYear) {
    this.setAttribute('startingYear', startingYear);
  }

  get startingYear() {
    return this.getAttribute('startingYear');
  }

  set age(age) {
    this.setAttribute('age', age);
  }

  get age() {
    return this.getAttribute('age');
  }
}

if(!customElements.get('ata-timeline')) {
  customElements.define('ata-timeline', Timeline);
}
