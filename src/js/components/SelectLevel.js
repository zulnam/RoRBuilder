import React from 'react';

require('../../scss/SelectLevel.scss');

class SelectLevel extends React.Component {

  constructor(props) {
    super(props);
    // Bind functions early. More performant. Upgrade to autobind when Babel6 sorts itself out
    this.changeLevel = this.changeLevel.bind(this);
  }

  generateLevels() {
    let start = 1, end = 40, optionList = [];
    for (start; start <= end; start++) {
      optionList.push (<option key={start} value={start}>{start}</option>);
    }
    return optionList;
  }

  changeLevel() {
    this.props.resetSelections();
    this.props.updateLevel(this.refs.level.value);
    this.props.setMasteryPoints(this.refs.level.value, this.props.currentRenown);
    this.props.setCurrentTacticLimit(this.refs.level.value);
  }

  render() {
    return (
      <div className="l-select l-spacing-bottom--large">
        <div className="c-level">
          <label className="c-level__label t-primary" htmlFor="levelSelect">Level</label>
          <select ref="level"
            onChange={this.changeLevel}
            className="c-level__select" id="levelSelect"
            value={this.props.currentLevel}>
            {this.generateLevels()}
          </select>
        </div>
      </div>
    )
  }
}

export default SelectLevel;
