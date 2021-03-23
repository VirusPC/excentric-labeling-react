import { Component, createRef } from 'react';
import * as d3 from 'd3';
import renderUsingD3 from './render-using-d3'

export default class Canvas extends Component {

  root = createRef();

  render() {
    
    return (
    <>
      <div id="canvas"  ref={this.root}></div>
    </>
    );
  }
  
  componentDidMount = () => {
    const { width } = this.props;
    const rootElem = this.root.current;
    renderUsingD3(rootElem, width, width * 0.6, this.extractInteractionParams(this.props), this.extractSetStateFuncs(this.props) );
  }

  shouldComponentUpdate = (props, state) => {
    if(this.props.fontSize === props.fontSize 
        && this.props.lensRadius === props.lensRadius
        && this.props.maxLabelsNum === props.maxLabelsNum
        && this.props.shouldVerticallyCoherent === props.shouldVerticallyCoherent
        && this.props.shouldHorizontallyCoherent === props.shouldHorizontallyCoherent){
      return false;
    } 
    return true;
  }

  componentDidUpdate = () => {
      console.log("update")
    const { width } = this.props;
    const rootElem = this.root.current;
    d3.select(rootElem).selectAll(":root *").remove();
    renderUsingD3(rootElem, width, width * 0.6, this.extractInteractionParams(), this.extractSetStateFuncs());
  }

  extractInteractionParams() {
    const {fontSize, lensRadius, maxLabelsNum, shouldVerticallyCoherent, shouldHorizontallyCoherent} = this.props;
    return {
      fontSize: fontSize, 
      lensRadius: lensRadius, 
      maxLabelsNum: maxLabelsNum,
      shouldVerticallyCoherent: shouldVerticallyCoherent,
      shouldHorizontallyCoherent: shouldHorizontallyCoherent,
    }
  }

  extractSetStateFuncs() {
    const {setCurLabel, setRandomLabel} = this.props;
    const result = {
      setCurLabel: setCurLabel,
      setRandomLabel: setRandomLabel,
    }
    return result;
  }

}