import React from 'react';
import { browserHistory } from 'react-router'

require('../../scss/components/BarXp.scss');

class ActionButtons extends React.Component {

  constructor(props) {
    super(props);
    // Bind functions early. More performant. Upgrade to autobind when Babel6 sorts itself out
    this.clickReset = this.clickReset.bind(this);
    this.clickSave = this.clickSave.bind(this);
    this.clickChangeCareer = this.clickChangeCareer.bind(this);
  }

  clickReset() {
    this.props.resetCareer();
  }

  createSaveLink() {
    let saveLink = `${window.location.origin}/career/${this.props.careerShort}/s?`;
    saveLink += `l=${this.props.currentLevel}`;
    saveLink += `&r=${this.props.currentRenown}`;
    saveLink += `&tl=${this.props.currentTacticLimit}`;
    saveLink += `&mp=${this.props.masteryPoints}`;
    saveLink += `&pA=${this.props.pathAMeter}`;
    saveLink += `&pB=${this.props.pathBMeter}`;
    saveLink += `&pC=${this.props.pathCMeter}`;
    saveLink += `&m1=${this.props.morale1}`;
    saveLink += `&m2=${this.props.morale2}`;
    saveLink += `&m3=${this.props.morale3}`;
    saveLink += `&m4=${this.props.morale4}`;
    saveLink += `&sa=${this.props.selectedAbilities}`;
    saveLink += `&ma=${this.props.masteryAbilities}`;
    saveLink += `&t=${this.props.tactics}`;
    return saveLink;
  }

  createBBCode(link) {
    return (
      `[url=${link}]RoR.builders - ${this.props.career.name}[/url]`
    )
  }

  buildModalTitle() {
    const url = `/images/icons/${this.props.careerShort}.png`;
    return (
      <h2 className="c-page-title c-page-title--dark o-row">
        <img src={url} className="c-title__icon c-title__icon--small" />
        {this.props.career.name}
      </h2>
    );
  }

  buildModalBody() {
    return (
      <div>
        <p>To save this career simply copy the link below:</p>
        <div className="c-input--read-only" contenteditable>{this.createSaveLink()}</div>
        <p>Alternatively, here is some BBCode to copy and paste into a forum post:</p>
        <div className="c-input--read-only" contenteditable>{this.createBBCode(this.createSaveLink())}</div>
      </div>
    )
  }

  clickSave() {
    this.props.updateModalContent(this.buildModalTitle(), this.buildModalBody());
    this.props.updateOverlayVisibility(true);
    this.props.updateModalVisibility(true);
  }

  clickChangeCareer() {
    this.props.updateOverlayVisibility(true);
    this.props.updateSidebarVisibility(true);
  }

  clickHome() {
    browserHistory.push('/');
  }

  render() {
    return (
      <div className="c-box u-margin__left-md">
        <button className="pure-button c-button c-button--tertiary" type="button" onClick={this.clickHome}>
          <i className="fa fa-home u-margin__right--small u-hidden--mobile"></i>
          Home
        </button>
        <button className="pure-button c-button c-button--primary u-float__right u-margin__left" type="button" onClick={this.clickSave}>
          <i className="fa fa-save u-margin__right--small u-hidden--mobile"></i>
          Save<span className="u-hidden--mobile"> career</span>
        </button>
        <button className="pure-button c-button c-button--secondary u-float__right u-margin__left" type="button" onClick={this.clickChangeCareer}>
          <i className="fa fa-group u-margin__right--small u-hidden--mobile"></i>
          Change<span className="u-hidden--mobile"> career</span>
        </button>
        <button className="pure-button c-button c-button--negative u-float__right u-margin__left" type="button" onClick={this.clickReset}>
          <i className="fa fa-refresh u-margin__right--small u-hidden--mobile"></i>
          Reset
        </button>
      </div>
    )
  }
}

export default ActionButtons;